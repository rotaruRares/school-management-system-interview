import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { UnauthorizedError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { PasswordService } from '../common/password.service.js';
import { getConfig } from '../config/app-config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthResponseDto, SessionUserDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginThrottleService } from './login-throttle.service.js';

const sessionUserSelect = {
  id: true,
  email: true,
  role: true,
  teacher: { select: { id: true, firstName: true, lastName: true } },
  student: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.UserSelect;

type SessionUserRow = Prisma.UserGetPayload<{ select: typeof sessionUserSelect }>;

export interface StartedSession {
  session: AuthResponseDto;
  refreshToken: string;
}

const REUSE_GRACE_MS = 10_000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toSessionUser(row: SessionUserRow): SessionUserDto {
  const profile = row.teacher ?? row.student;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    teacherId: row.teacher?.id ?? null,
    studentId: row.student?.id ?? null,
  };
}

@Injectable()
export class AuthService {
  private readonly config = getConfig();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
    private readonly throttle: LoginThrottleService,
  ) {}

  async login(dto: LoginDto, clientIp: string): Promise<StartedSession> {
    const throttleKey = `${clientIp}|${dto.email}`;
    this.throttle.assertAllowed(throttleKey);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...sessionUserSelect, passwordHash: true },
    });

    const valid = await this.passwords.verify(dto.password, user?.passwordHash ?? null);
    if (!user || !valid) {
      this.throttle.recordFailure(throttleKey);
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    this.throttle.reset(throttleKey);
    return this.startSession(user);
  }

  async refresh(rawToken: string | undefined): Promise<StartedSession> {
    if (!rawToken) {
      throw this.invalidRefreshToken();
    }

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: { select: sessionUserSelect } },
    });
    if (!record) {
      throw this.invalidRefreshToken();
    }

    if (record.revokedAt) {
      if (Date.now() - record.revokedAt.getTime() > REUSE_GRACE_MS) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: record.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw this.invalidRefreshToken();
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw this.invalidRefreshToken();
    }

    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count !== 1) {
      throw this.invalidRefreshToken();
    }

    return this.startSession(record.user);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: number): Promise<SessionUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: sessionUserSelect,
    });
    if (!user) {
      throw new UnauthorizedError(ErrorCode.UNAUTHENTICATED, 'Authentication required');
    }
    return toSessionUser(user);
  }

  private async startSession(user: SessionUserRow): Promise<StartedSession> {
    const accessToken = await this.jwt.signAsync({ sub: String(user.id) });
    const refreshToken = await this.issueRefreshToken(user.id);
    return {
      refreshToken,
      session: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.config.jwt.accessTtlSeconds,
        user: toSessionUser(user),
      },
    };
  }

  private async issueRefreshToken(userId: number): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + this.config.refreshToken.ttlSeconds * 1000),
      },
    });
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
    return token;
  }

  private invalidRefreshToken(): UnauthorizedError {
    return new UnauthorizedError(ErrorCode.REFRESH_TOKEN_INVALID, 'Session expired, please log in again');
  }
}
