import { Injectable } from '@nestjs/common';
import { Prisma, Role, Subject } from '@prisma/client';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
} from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { OwnershipService } from '../common/ownership.service.js';
import { toDateOnly, todayUtc } from '../common/validation/date.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { GradeResponseDto, GradeSummaryDto } from './dto/grade-response.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { gradeSelect, toGradeResponse, toGradeSummary } from './grades.mapper.js';

export interface GradeFilters {
  studentId?: number;
  subject?: Subject;
}

const NEWEST_FIRST: Prisma.GradeOrderByWithRelationInput[] = [{ date: 'desc' }, { id: 'desc' }];

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  listSubjects(): Subject[] {
    return Object.values(Subject);
  }

  async create(dto: CreateGradeDto, user: AuthenticatedUser): Promise<GradeResponseDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { id: true, classId: true, class: { select: { teacherId: true } } },
    });
    if (!student) {
      throw new UnprocessableError(
        ErrorCode.STUDENT_NOT_FOUND,
        `Student ${dto.studentId} does not exist`,
        { field: 'studentId' },
      );
    }

    let teacherId: number | null;
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      await this.ownership.assertTeacherTeachesClass(teacher.id, student.classId);
      teacherId = teacher.id;
    } else {
      teacherId = student.class?.teacherId ?? null;
    }

    const row = await this.prisma.grade.create({
      data: {
        studentId: student.id,
        teacherId,
        subject: dto.subject,
        numericGrade: dto.numericGrade,
        date: dto.date ? toDateOnly(dto.date) : todayUtc(),
      },
      select: gradeSelect,
    });
    return toGradeResponse(row);
  }

  async findAll(user: AuthenticatedUser, filters: GradeFilters): Promise<GradeResponseDto[]> {
    const where: Prisma.GradeWhereInput = {};
    if (filters.studentId !== undefined) where.studentId = filters.studentId;
    if (filters.subject !== undefined) where.subject = filters.subject;
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      where.student = { class: { teacherId: teacher.id } };
    }
    const rows = await this.prisma.grade.findMany({
      where,
      select: gradeSelect,
      orderBy: NEWEST_FIRST,
    });
    return rows.map(toGradeResponse);
  }

  async findByStudent(studentId: number, user: AuthenticatedUser): Promise<GradeSummaryDto> {
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      await this.ownership.assertTeacherTeachesStudent(teacher.id, studentId);
    } else {
      const found = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true },
      });
      if (!found) {
        throw new NotFoundError(ErrorCode.STUDENT_NOT_FOUND, 'Student not found');
      }
    }
    return this.summaryFor(studentId);
  }

  async findMine(user: AuthenticatedUser): Promise<GradeSummaryDto> {
    const student = await this.ownership.getStudentByUserId(user.userId);
    return this.summaryFor(student.id);
  }

  async findOne(id: number, user: AuthenticatedUser): Promise<GradeResponseDto> {
    const row = await this.prisma.grade.findUnique({ where: { id }, select: gradeSelect });
    if (!row) {
      throw new NotFoundError(ErrorCode.GRADE_NOT_FOUND, 'Grade not found');
    }
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      await this.ownership.assertTeacherTeachesStudent(teacher.id, row.studentId);
    }
    return toGradeResponse(row);
  }

  async update(id: number, dto: UpdateGradeDto, user: AuthenticatedUser): Promise<GradeResponseDto> {
    const existing = await this.prisma.grade.findUnique({
      where: { id },
      select: { teacherId: true },
    });
    if (!existing) {
      throw new NotFoundError(ErrorCode.GRADE_NOT_FOUND, 'Grade not found');
    }
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      if (existing.teacherId !== teacher.id) {
        throw new ForbiddenError(
          ErrorCode.NOT_GRADE_AUTHOR,
          'You can only update grades that you gave',
        );
      }
    }

    const data: Prisma.GradeUpdateInput = {};
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.numericGrade !== undefined) data.numericGrade = dto.numericGrade;
    if (dto.date !== undefined) data.date = toDateOnly(dto.date);

    const row = await this.prisma.grade.update({ where: { id }, data, select: gradeSelect });
    return toGradeResponse(row);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.grade.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundError(ErrorCode.GRADE_NOT_FOUND, 'Grade not found');
    }
    await this.prisma.grade.delete({ where: { id } });
  }

  private async summaryFor(studentId: number): Promise<GradeSummaryDto> {
    const rows = await this.prisma.grade.findMany({
      where: { studentId },
      select: gradeSelect,
      orderBy: NEWEST_FIRST,
    });
    return toGradeSummary(rows);
  }
}
