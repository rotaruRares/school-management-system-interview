import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenError, NotFoundError } from './errors/app-exceptions.js';
import { ErrorCode } from './errors/error-codes.js';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeacherByUserId(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      throw new ForbiddenError(
        ErrorCode.PROFILE_NOT_FOUND,
        'No teacher profile is linked to this account',
      );
    }
    return teacher;
  }

  async getStudentByUserId(userId: number) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new ForbiddenError(
        ErrorCode.PROFILE_NOT_FOUND,
        'No student profile is linked to this account',
      );
    }
    return student;
  }

  async assertTeacherTeachesClass(teacherId: number, classId: number | null) {
    if (classId === null) {
      throw new ForbiddenError(
        ErrorCode.NOT_CLASS_TEACHER,
        'The student is not in one of your classes',
      );
    }
    const found = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });
    if (!found) {
      throw new NotFoundError(ErrorCode.CLASS_NOT_FOUND, 'Class not found');
    }
    if (found.teacherId !== teacherId) {
      throw new ForbiddenError(ErrorCode.NOT_CLASS_TEACHER, 'You are not the teacher of this class');
    }
  }

  async assertTeacherTeachesStudent(teacherId: number, studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student) {
      throw new NotFoundError(ErrorCode.STUDENT_NOT_FOUND, 'Student not found');
    }
    await this.assertTeacherTeachesClass(teacherId, student.classId);
  }
}
