import { Prisma } from '@prisma/client';
import { personSelect } from '../common/selects.js';
import { formatDateOnly } from '../common/validation/date.util.js';
import { StudentDetailResponseDto, StudentResponseDto } from './dto/student-response.dto.js';

export const studentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  user: { select: { email: true } },
  class: { select: { id: true, name: true } },
} satisfies Prisma.StudentSelect;

export const studentDetailSelect = {
  id: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  user: { select: { email: true } },
  class: { select: { id: true, name: true, teacher: { select: personSelect } } },
} satisfies Prisma.StudentSelect;

type StudentRow = Prisma.StudentGetPayload<{ select: typeof studentSelect }>;
type StudentDetailRow = Prisma.StudentGetPayload<{ select: typeof studentDetailSelect }>;

export function toStudentResponse(row: StudentRow): StudentResponseDto {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.user.email,
    dateOfBirth: formatDateOnly(row.dateOfBirth),
    class: row.class ? { id: row.class.id, name: row.class.name } : null,
  };
}

export function toStudentDetailResponse(row: StudentDetailRow): StudentDetailResponseDto {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.user.email,
    dateOfBirth: formatDateOnly(row.dateOfBirth),
    class: row.class
      ? {
          id: row.class.id,
          name: row.class.name,
          teacher: row.class.teacher
            ? {
                id: row.class.teacher.id,
                firstName: row.class.teacher.firstName,
                lastName: row.class.teacher.lastName,
              }
            : null,
        }
      : null,
  };
}
