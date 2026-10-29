export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type Subject =
  | 'MATHEMATICS'
  | 'ROMANIAN'
  | 'ENGLISH'
  | 'FRENCH'
  | 'PHYSICS'
  | 'CHEMISTRY'
  | 'BIOLOGY'
  | 'HISTORY'
  | 'GEOGRAPHY'
  | 'COMPUTER_SCIENCE'
  | 'PHYSICAL_EDUCATION'
  | 'MUSIC'
  | 'ART';

export interface SessionUser {
  id: number;
  email: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  teacherId: number | null;
  studentId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: SessionUser;
}

export interface PersonRef {
  id: number;
  firstName: string;
  lastName: string;
}

export interface ClassRef {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  class: ClassRef | null;
}

export interface StudentDetail extends Omit<Student, 'class'> {
  class: (ClassRef & { teacher: PersonRef | null }) | null;
}

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  classes: ClassRef[];
}

export interface SchoolClass {
  id: number;
  name: string;
  teacher: PersonRef | null;
  studentCount: number;
}

export interface ClassStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
}

export interface ClassDetail extends SchoolClass {
  students: ClassStudent[];
}

export interface Grade {
  id: number;
  studentId: number;
  subject: Subject;
  numericGrade: number;
  date: string;
  student: PersonRef;
  teacher: PersonRef | null;
}

export interface GradeSummary {
  average: number | null;
  count: number;
  grades: Grade[];
}

export interface ApiFieldError {
  field: string;
  constraint: string;
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  errors?: ApiFieldError[];
}
