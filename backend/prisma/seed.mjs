import bcrypt from 'bcrypt';
import prismaPkg from '@prisma/client';

const { PrismaClient, Role, Subject } = prismaPkg;
const prisma = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD ?? 'password123';
const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

async function upsertUser(email, role, passwordHash) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, role },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, ROUNDS);

  await upsertUser('admin@school.com', Role.ADMIN, passwordHash);

  const teachers = {};
  for (const t of [
    { email: 'teacher@school.com', firstName: 'Ion', lastName: 'Ionescu' },
    { email: 'teacher2@school.com', firstName: 'Maria', lastName: 'Georgescu' },
  ]) {
    const user = await upsertUser(t.email, Role.TEACHER, passwordHash);
    teachers[t.email] = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, firstName: t.firstName, lastName: t.lastName },
    });
  }

  const classes = {};
  for (const c of [
    { name: '5A', teacherEmail: 'teacher@school.com' },
    { name: '5B', teacherEmail: 'teacher2@school.com' },
  ]) {
    classes[c.name] = await prisma.class.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, teacherId: teachers[c.teacherEmail].id },
    });
  }

  const students = {};
  for (const s of [
    { email: 'student@school.com', firstName: 'Ana', lastName: 'Popescu', dob: '2014-05-14', cls: '5A' },
    { email: 'student2@school.com', firstName: 'Mihai', lastName: 'Radu', dob: '2014-09-02', cls: '5A' },
    { email: 'student3@school.com', firstName: 'Elena', lastName: 'Dumitru', dob: '2014-01-27', cls: '5B' },
  ]) {
    const user = await upsertUser(s.email, Role.STUDENT, passwordHash);
    students[s.email] = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: new Date(`${s.dob}T00:00:00.000Z`),
        classId: classes[s.cls].id,
      },
    });
  }

  if ((await prisma.grade.count()) === 0) {
    const t1 = teachers['teacher@school.com'].id;
    const t2 = teachers['teacher2@school.com'].id;
    const day = (value) => new Date(`${value}T00:00:00.000Z`);
    await prisma.grade.createMany({
      data: [
        { studentId: students['student@school.com'].id, teacherId: t1, subject: Subject.MATHEMATICS, numericGrade: 9, date: day('2026-10-05') },
        { studentId: students['student@school.com'].id, teacherId: t1, subject: Subject.PHYSICS, numericGrade: 8, date: day('2026-10-12') },
        { studentId: students['student@school.com'].id, teacherId: t1, subject: Subject.MATHEMATICS, numericGrade: 10, date: day('2026-10-19') },
        { studentId: students['student2@school.com'].id, teacherId: t1, subject: Subject.MATHEMATICS, numericGrade: 7, date: day('2026-10-05') },
        { studentId: students['student3@school.com'].id, teacherId: t2, subject: Subject.HISTORY, numericGrade: 10, date: day('2026-10-07') },
      ],
    });
  }

  console.log('Seed complete. All accounts use the password:', PASSWORD);
  console.log('  admin@school.com    (ADMIN)');
  console.log('  teacher@school.com  (TEACHER, class 5A)');
  console.log('  teacher2@school.com (TEACHER, class 5B)');
  console.log('  student@school.com  (STUDENT, class 5A)');
  console.log('  student2@school.com (STUDENT, class 5A)');
  console.log('  student3@school.com (STUDENT, class 5B)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
