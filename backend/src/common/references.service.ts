import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflictError, UnprocessableError } from './errors/app-exceptions.js';
import { ErrorCode } from './errors/error-codes.js';

@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async assertEmailFree(email: string, exceptUserId?: number): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictError(ErrorCode.EMAIL_TAKEN, 'This email address is already in use');
    }
  }

  async assertClassNameFree(name: string, exceptClassId?: number): Promise<void> {
    const existing = await this.prisma.class.findUnique({ where: { name }, select: { id: true } });
    if (existing && existing.id !== exceptClassId) {
      throw new ConflictError(ErrorCode.CLASS_NAME_TAKEN, `A class named "${name}" already exists`);
    }
  }

  async assertStudentExists(studentId: number): Promise<void> {
    const found = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!found) {
      throw new UnprocessableError(
        ErrorCode.STUDENT_NOT_FOUND,
        `Student ${studentId} does not exist`,
        { field: 'studentId' },
      );
    }
  }

  async assertClassExists(classId: number): Promise<void> {
    const found = await this.prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
    if (!found) {
      throw new UnprocessableError(ErrorCode.CLASS_NOT_FOUND, `Class ${classId} does not exist`, {
        field: 'classId',
      });
    }
  }

  async assertTeacherExists(teacherId: number): Promise<void> {
    const found = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true },
    });
    if (!found) {
      throw new UnprocessableError(
        ErrorCode.TEACHER_NOT_FOUND,
        `Teacher ${teacherId} does not exist`,
        { field: 'teacherId' },
      );
    }
  }

  async assertStudentsExist(studentIds: number[]): Promise<void> {
    const found = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((student) => student.id));
    const missingIds = studentIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new UnprocessableError(
        ErrorCode.STUDENT_NOT_FOUND,
        `Students not found: ${missingIds.join(', ')}`,
        { field: 'studentIds', missingIds },
      );
    }
  }
}
