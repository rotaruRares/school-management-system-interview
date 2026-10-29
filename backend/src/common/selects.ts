import { Prisma } from '@prisma/client';

export const personSelect = {
  id: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.TeacherSelect;
