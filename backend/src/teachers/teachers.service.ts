import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { NotFoundError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { PasswordService } from '../common/password.service.js';
import { ReferencesService } from '../common/references.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { TeacherResponseDto } from './dto/teacher-response.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { teacherSelect, toTeacherResponse } from './teachers.mapper.js';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly references: ReferencesService,
    private readonly passwords: PasswordService,
  ) {}

  async create(dto: CreateTeacherDto): Promise<TeacherResponseDto> {
    await this.references.assertEmailFree(dto.email);
    const passwordHash = await this.passwords.hash(dto.password);

    const row = await this.prisma.teacher.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        user: { create: { email: dto.email, passwordHash, role: Role.TEACHER } },
      },
      select: teacherSelect,
    });
    return toTeacherResponse(row);
  }

  async findAll(): Promise<TeacherResponseDto[]> {
    const rows = await this.prisma.teacher.findMany({
      select: teacherSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return rows.map(toTeacherResponse);
  }

  async findOne(id: number): Promise<TeacherResponseDto> {
    const row = await this.prisma.teacher.findUnique({ where: { id }, select: teacherSelect });
    if (!row) {
      throw new NotFoundError(ErrorCode.TEACHER_NOT_FOUND, 'Teacher not found');
    }
    return toTeacherResponse(row);
  }

  async update(id: number, dto: UpdateTeacherDto): Promise<TeacherResponseDto> {
    const existing = await this.prisma.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundError(ErrorCode.TEACHER_NOT_FOUND, 'Teacher not found');
    }
    if (dto.email !== undefined) {
      await this.references.assertEmailFree(dto.email, existing.userId);
    }

    const data: Prisma.TeacherUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;

    const userData: Prisma.UserUpdateWithoutTeacherInput = {};
    if (dto.email !== undefined) userData.email = dto.email;
    if (dto.password !== undefined) {
      userData.passwordHash = await this.passwords.hash(dto.password);
      userData.refreshTokens = { deleteMany: {} };
    }
    if (Object.keys(userData).length > 0) {
      data.user = { update: userData };
    }

    const row = await this.prisma.teacher.update({ where: { id }, data, select: teacherSelect });
    return toTeacherResponse(row);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundError(ErrorCode.TEACHER_NOT_FOUND, 'Teacher not found');
    }
    await this.prisma.user.delete({ where: { id: existing.userId } });
  }
}
