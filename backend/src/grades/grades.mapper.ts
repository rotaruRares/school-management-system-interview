import { Prisma } from '@prisma/client';
import { personSelect } from '../common/selects.js';
import { formatDateOnly } from '../common/validation/date.util.js';
import { GradeResponseDto, GradeSummaryDto } from './dto/grade-response.dto.js';

export const gradeSelect = {
  id: true,
  studentId: true,
  subject: true,
  numericGrade: true,
  date: true,
  student: { select: personSelect },
  teacher: { select: personSelect },
} satisfies Prisma.GradeSelect;

type GradeRow = Prisma.GradeGetPayload<{ select: typeof gradeSelect }>;

export function toGradeResponse(row: GradeRow): GradeResponseDto {
  return {
    id: row.id,
    studentId: row.studentId,
    subject: row.subject,
    numericGrade: row.numericGrade,
    date: formatDateOnly(row.date),
    student: {
      id: row.student.id,
      firstName: row.student.firstName,
      lastName: row.student.lastName,
    },
    teacher: row.teacher
      ? { id: row.teacher.id, firstName: row.teacher.firstName, lastName: row.teacher.lastName }
      : null,
  };
}

export function toGradeSummary(rows: GradeRow[]): GradeSummaryDto {
  const total = rows.reduce((sum, row) => sum + row.numericGrade, 0);
  return {
    average: rows.length === 0 ? null : Math.round((total / rows.length) * 100) / 100,
    count: rows.length,
    grades: rows.map(toGradeResponse),
  };
}
