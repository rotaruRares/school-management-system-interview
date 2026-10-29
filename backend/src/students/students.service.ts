import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { NotFoundError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { OwnershipService } from '../common/ownership.service.js';
import { PasswordService } from '../common/password.service.js';
import { ReferencesService } from '../common/references.service.js';
import { toDateOnly } from '../common/validation/date.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { StudentDetailResponseDto, StudentResponseDto } from './dto/student-response.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import {
  studentDetailSelect,
  studentSelect,
  toStudentDetailResponse,
  toStudentResponse,
} from './students.mapper.js';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly references: ReferencesService,
    private readonly passwords: PasswordService,
  ) {}

  async create(dto: CreateStudentDto): Promise<StudentResponseDto> {
    await this.references.assertEmailFree(dto.email);
    if (dto.classId !== undefined) {
      await this.references.assertClassExists(dto.classId);
    }
    const passwordHash = await this.passwords.hash(dto.password);

    const data: Prisma.StudentCreateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: toDateOnly(dto.dateOfBirth),
      user: { create: { email: dto.email, passwordHash, role: Role.STUDENT } },
    };
    if (dto.classId !== undefined) {
      data.class = { connect: { id: dto.classId } };
    }

    const row = await this.prisma.student.create({ data, select: studentSelect });
    return toStudentResponse(row);
  }

  async findAll(): Promise<StudentResponseDto[]> {
    const rows = await this.prisma.student.findMany({
      select: studentSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return rows.map(toStudentResponse);
  }

  async findMe(user: AuthenticatedUser): Promise<StudentDetailResponseDto> {
    const me = await this.ownership.getStudentByUserId(user.userId);
    return this.findOne(me.id, user);
  }

  async findOne(id: number, user: AuthenticatedUser): Promise<StudentDetailResponseDto> {
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      await this.ownership.assertTeacherTeachesStudent(teacher.id, id);
    }
    const row = await this.prisma.student.findUnique({
      where: { id },
      select: studentDetailSelect,
    });
    if (!row) {
      throw new NotFoundError(ErrorCode.STUDENT_NOT_FOUND, 'Student not found');
    }
    return toStudentDetailResponse(row);
  }

  async update(id: number, dto: UpdateStudentDto): Promise<StudentResponseDto> {
    const existing = await this.prisma.student.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundError(ErrorCode.STUDENT_NOT_FOUND, 'Student not found');
    }
    if (dto.email !== undefined) {
      await this.references.assertEmailFree(dto.email, existing.userId);
    }
    if (typeof dto.classId === 'number') {
      await this.references.assertClassExists(dto.classId);
    }

    const data: Prisma.StudentUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = toDateOnly(dto.dateOfBirth);
    if (dto.classId === null) {
      data.class = { disconnect: true };
    } else if (dto.classId !== undefined) {
      data.class = { connect: { id: dto.classId } };
    }

    const userData: Prisma.UserUpdateWithoutStudentInput = {};
    if (dto.email !== undefined) userData.email = dto.email;
    if (dto.password !== undefined) {
      userData.passwordHash = await this.passwords.hash(dto.password);
      userData.refreshTokens = { deleteMany: {} };
    }
    if (Object.keys(userData).length > 0) {
      data.user = { update: userData };
    }

    const row = await this.prisma.student.update({ where: { id }, data, select: studentSelect });
    return toStudentResponse(row);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.student.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundError(ErrorCode.STUDENT_NOT_FOUND, 'Student not found');
    }
    await this.prisma.user.delete({ where: { id: existing.userId } });
  }
}
