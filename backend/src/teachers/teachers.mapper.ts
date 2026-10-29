import { Prisma } from '@prisma/client';
import { TeacherResponseDto } from './dto/teacher-response.dto.js';

export const teacherSelect = {
  id: true,
  firstName: true,
  lastName: true,
  user: { select: { email: true } },
  classes: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
} satisfies Prisma.TeacherSelect;

type TeacherRow = Prisma.TeacherGetPayload<{ select: typeof teacherSelect }>;

export function toTeacherResponse(row: TeacherRow): TeacherResponseDto {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.user.email,
    classes: row.classes.map((cls) => ({ id: cls.id, name: cls.name })),
  };
}
