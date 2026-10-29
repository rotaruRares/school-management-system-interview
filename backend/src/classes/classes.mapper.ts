import { Prisma } from '@prisma/client';
import { personSelect } from '../common/selects.js';
import { formatDateOnly } from '../common/validation/date.util.js';
import { ClassDetailResponseDto, ClassResponseDto } from './dto/class-response.dto.js';

export const classSelect = {
  id: true,
  name: true,
  teacher: { select: personSelect },
  _count: { select: { students: true } },
} satisfies Prisma.ClassSelect;

export const classDetailSelect = {
  id: true,
  name: true,
  teacher: { select: personSelect },
  _count: { select: { students: true } },
  students: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      user: { select: { email: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  },
} satisfies Prisma.ClassSelect;

type ClassRow = Prisma.ClassGetPayload<{ select: typeof classSelect }>;
type ClassDetailRow = Prisma.ClassGetPayload<{ select: typeof classDetailSelect }>;

export function toClassResponse(row: ClassRow): ClassResponseDto {
  return {
    id: row.id,
    name: row.name,
    teacher: row.teacher
      ? { id: row.teacher.id, firstName: row.teacher.firstName, lastName: row.teacher.lastName }
      : null,
    studentCount: row._count.students,
  };
}

export function toClassDetailResponse(row: ClassDetailRow): ClassDetailResponseDto {
  return {
    ...toClassResponse(row),
    students: row.students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.user.email,
      dateOfBirth: formatDateOnly(student.dateOfBirth),
    })),
  };
}
