import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { NotFoundError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { OwnershipService } from '../common/ownership.service.js';
import { ReferencesService } from '../common/references.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  classDetailSelect,
  classSelect,
  toClassDetailResponse,
  toClassResponse,
} from './classes.mapper.js';
import { AssignStudentsDto } from './dto/assign-students.dto.js';
import {
  ClassDetailResponseDto,
  ClassResponseDto,
  ClassStudentDto,
} from './dto/class-response.dto.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { UpdateClassDto } from './dto/update-class.dto.js';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly references: ReferencesService,
  ) {}

  async create(dto: CreateClassDto): Promise<ClassResponseDto> {
    await this.references.assertClassNameFree(dto.name);
    if (dto.teacherId !== undefined) {
      await this.references.assertTeacherExists(dto.teacherId);
    }
    const row = await this.prisma.class.create({
      data: { name: dto.name, teacherId: dto.teacherId },
      select: classSelect,
    });
    return toClassResponse(row);
  }

  async findAll(user: AuthenticatedUser): Promise<ClassResponseDto[]> {
    const where: Prisma.ClassWhereInput = {};
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      where.teacherId = teacher.id;
    }
    const rows = await this.prisma.class.findMany({
      where,
      select: classSelect,
      orderBy: { name: 'asc' },
    });
    return rows.map(toClassResponse);
  }

  async findOne(id: number, user: AuthenticatedUser): Promise<ClassDetailResponseDto> {
    if (user.role === Role.TEACHER) {
      const teacher = await this.ownership.getTeacherByUserId(user.userId);
      await this.ownership.assertTeacherTeachesClass(teacher.id, id);
    }
    return this.getDetail(id);
  }

  async findStudents(id: number, user: AuthenticatedUser): Promise<ClassStudentDto[]> {
    const detail = await this.findOne(id, user);
    return detail.students;
  }

  async update(id: number, dto: UpdateClassDto): Promise<ClassResponseDto> {
    await this.assertClassExists(id);
    if (dto.name !== undefined) {
      await this.references.assertClassNameFree(dto.name, id);
    }
    if (typeof dto.teacherId === 'number') {
      await this.references.assertTeacherExists(dto.teacherId);
    }

    const data: Prisma.ClassUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.teacherId !== undefined) data.teacherId = dto.teacherId;

    const row = await this.prisma.class.update({ where: { id }, data, select: classSelect });
    return toClassResponse(row);
  }

  async assignTeacher(id: number, teacherId: number | null): Promise<ClassResponseDto> {
    await this.assertClassExists(id);
    if (teacherId !== null) {
      await this.references.assertTeacherExists(teacherId);
    }
    const row = await this.prisma.class.update({
      where: { id },
      data: { teacherId },
      select: classSelect,
    });
    return toClassResponse(row);
  }

  async assignStudents(id: number, dto: AssignStudentsDto): Promise<ClassDetailResponseDto> {
    await this.assertClassExists(id);
    await this.references.assertStudentsExist(dto.studentIds);
    await this.prisma.student.updateMany({
      where: { id: { in: dto.studentIds } },
      data: { classId: id },
    });
    return this.getDetail(id);
  }

  async removeStudent(id: number, studentId: number): Promise<void> {
    await this.assertClassExists(id);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, classId: id },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundError(
        ErrorCode.STUDENT_NOT_FOUND,
        'This student is not enrolled in the class',
      );
    }
    await this.prisma.student.update({ where: { id: studentId }, data: { classId: null } });
  }

  async remove(id: number): Promise<void> {
    await this.assertClassExists(id);
    await this.prisma.class.delete({ where: { id } });
  }

  private async getDetail(id: number): Promise<ClassDetailResponseDto> {
    const row = await this.prisma.class.findUnique({ where: { id }, select: classDetailSelect });
    if (!row) {
      throw new NotFoundError(ErrorCode.CLASS_NOT_FOUND, 'Class not found');
    }
    return toClassDetailResponse(row);
  }

  private async assertClassExists(id: number): Promise<void> {
    const found = await this.prisma.class.findUnique({ where: { id }, select: { id: true } });
    if (!found) {
      throw new NotFoundError(ErrorCode.CLASS_NOT_FOUND, 'Class not found');
    }
  }
}
