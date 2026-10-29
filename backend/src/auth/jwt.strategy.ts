import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { UnauthorizedError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { getConfig } from '../config/app-config.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const { jwt } = getConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.secret,
      algorithms: ['HS256'],
      issuer: jwt.issuer,
      audience: jwt.audience,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) {
      throw new UnauthorizedError(ErrorCode.UNAUTHENTICATED, 'Authentication required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedError(ErrorCode.UNAUTHENTICATED, 'Authentication required');
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
