# School Management System

A full-stack web app for managing students, teachers, classes and grades, with JWT authentication and role-based access control (RBAC).

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript), Prisma ORM |
| Database | MySQL 8 |
| Auth | Short-lived JWT access token + rotating httpOnly refresh cookie, bcrypt password hashing |
| Authorization | RBAC with global `JwtAuthGuard` + `RolesGuard` (default deny) and service-level ownership checks |
| API | REST under `/api`, documented with Swagger at `/api/docs` |
| Frontend | Vue 3, Vue Router, Pinia, Axios, Bootstrap 5 |

## Repository layout

```
backend/    NestJS API (src/), Prisma schema, migrations and seed (prisma/)
frontend/   Vue 3 single-page app
```

## Prerequisites

- Node.js 22.18+ (or 24.12+)
- MySQL 8 running locally, with an empty database and a user that can use it, e.g.

```sql
CREATE DATABASE school_management;
CREATE USER 'school'@'localhost' IDENTIFIED BY 'school_pass123';
GRANT ALL PRIVILEGES ON *.* TO 'school'@'localhost';
FLUSH PRIVILEGES;
```

(`ALL PRIVILEGES ON *.*` is only needed so Prisma can create its shadow database for `migrate dev`. For `migrate deploy` and `migrate reset` on a local machine it is the simplest setup.)

## Run it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma migrate deploy   # creates the tables
npm run prisma:seed         # creates the sample accounts and data
npm run start:dev           # http://localhost:3000
```

- `JWT_SECRET` is **required** and must be at least 32 characters. Generate one with `openssl rand -hex 32`. The backend refuses to start otherwise.
- `npm run db:setup` runs the migration and the seed in one step.
- **Upgrading from an earlier version of this project:** the schema migration was replaced (grade subjects are now an enum, dates are `DATE`, and deleting a teacher keeps their grades). Run `npm run db:reset` once to drop the old tables, re-apply the migration and re-seed.

Main environment variables (see `backend/.env.example` for all of them):

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | | MySQL connection string |
| `JWT_SECRET` | | Signing secret, 32+ characters, required |
| `PORT` | `3000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin(s), comma-separated |
| `ACCESS_TOKEN_TTL_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh token lifetime |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `TRUST_PROXY` | `false` | Set `true` behind a reverse proxy so the login throttle sees the real IP |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_WINDOW_MINUTES` | `5` / `15` | Failed-login throttle |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL, defaults to http://localhost:3000
npm run dev                 # http://localhost:5173
```

`VITE_API_URL` is the backend origin **without** `/api`; the client adds the prefix.

## Test credentials

Created by the seed script. All accounts use the password **`password123`** (override with `SEED_PASSWORD`).

| Role | Email | Notes |
|---|---|---|
| Administrator | `admin@school.com` | Full access |
| Teacher | `teacher@school.com` | Teaches class 5A |
| Teacher | `teacher2@school.com` | Teaches class 5B |
| Student | `student@school.com` | In class 5A, has grades |
| Student | `student2@school.com` | In class 5A |
| Student | `student3@school.com` | In class 5B |

Use the second teacher to check the ownership rules: `teacher@school.com` cannot grade or see students of class 5B.

## Authentication

1. `POST /api/auth/login` with `{ "email", "password" }` returns `{ accessToken, tokenType, expiresIn, user }` and sets an httpOnly, SameSite=Strict `refresh_token` cookie (path `/api/auth`).
2. Send `Authorization: Bearer <accessToken>` on every other request. The frontend keeps the access token in memory only.
3. When the access token expires, `POST /api/auth/refresh` (cookie only) returns a new access token and **rotates** the refresh token. Refresh tokens are stored hashed; presenting an already-used one revokes the session (a short grace period tolerates parallel requests).
4. `POST /api/auth/logout` revokes the refresh token and clears the cookie. `GET /api/auth/me` returns the current user.
5. Failed logins are throttled per IP + email (`429 TOO_MANY_ATTEMPTS`). Login responses are the same for an unknown email and a wrong password.

## Roles and permissions

| Capability | Admin | Teacher | Student |
|---|:-:|:-:|:-:|
| Create / update / delete students, teachers, classes | ✅ | | |
| Assign teachers and students to classes | ✅ | | |
| View classes and their students | all classes | own classes only | |
| Add grades | any student | students of own classes | |
| Update grades | any grade | only grades they assigned | |
| Delete grades | ✅ | | |
| View grades | all | students of own classes | own grades + average |
| View own profile and class | | | ✅ |

All of this is enforced on the backend. Guards run in this order: `JwtAuthGuard` (valid access token, unless the route is `@Public()`), then `RolesGuard`. `RolesGuard` is **default deny**: a route without `@Roles(...)` answers `403`. Services then check ownership (for example, a teacher requesting a class or student that is not theirs gets `403`).

## API documentation

Interactive Swagger UI: **http://localhost:3000/api/docs** (click *Authorize* and paste the `accessToken` returned by login).

All paths below are prefixed with `/api`. Everything except `login`, `refresh`, `logout` and `health` requires a Bearer token.

### Auth and health
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Email + password → access token, sets refresh cookie |
| POST | `/auth/refresh` | public (cookie) | Rotate refresh token, new access token |
| POST | `/auth/logout` | public (cookie) | Revoke refresh token |
| GET | `/auth/me` | any role | Current user |
| GET | `/health` | public | Liveness + database check |

### Students
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/students` | Admin | Create a student (creates the login account too) |
| GET | `/students` | Admin | List students |
| GET | `/students/me` | Student | Own profile and class |
| GET | `/students/:id` | Admin, Teacher (own class) | Student details |
| PATCH | `/students/:id` | Admin | Update, including `classId` (`null` removes from class) |
| DELETE | `/students/:id` | Admin | Delete student and their grades |

### Teachers
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/teachers` | Admin | Create a teacher |
| GET | `/teachers` | Admin | List teachers |
| GET | `/teachers/:id` | Admin | Teacher details |
| PATCH | `/teachers/:id` | Admin | Update |
| DELETE | `/teachers/:id` | Admin | Delete. Their classes become unassigned and their grades are kept (author becomes `null`) |

### Classes
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/classes` | Admin | Create a class (optional `teacherId`) |
| GET | `/classes` | Admin, Teacher | All classes (admin) or own classes (teacher) |
| GET | `/classes/:id` | Admin, Teacher (own class) | Class with teacher and students |
| GET | `/classes/:id/students` | Admin, Teacher (own class) | Enrolled students |
| PATCH | `/classes/:id` | Admin | Update name / teacher |
| PUT | `/classes/:id/teacher` | Admin | Assign teacher (`{ "teacherId": 1 }`, or `null` to unassign) |
| POST | `/classes/:id/students` | Admin | Assign students (`{ "studentIds": [1, 2] }`) |
| DELETE | `/classes/:id/students/:studentId` | Admin | Remove a student from the class |
| DELETE | `/classes/:id` | Admin | Delete class (students become unassigned) |

### Grades
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/grades` | Admin, Teacher (own class) | Add a grade: `studentId`, `subject`, `numericGrade` (1–10), optional `date` (`YYYY-MM-DD`, not in the future) |
| GET | `/grades` | Admin, Teacher | List grades (teacher: own classes only); optional `?studentId=` and `?subject=` |
| GET | `/grades/subjects` | any role | Allowed subject values |
| GET | `/grades/me` | Student | Own grades, `average` and `count` |
| GET | `/grades/student/:studentId` | Admin, Teacher (own class) | One student's grades, `average` and `count` |
| GET | `/grades/:id` | Admin, Teacher (own class) | Grade details |
| PATCH | `/grades/:id` | Admin, Teacher (own grades) | Update subject / grade / date |
| DELETE | `/grades/:id` | Admin | Delete a grade |

`subject` is one of: `MATHEMATICS`, `ROMANIAN`, `ENGLISH`, `FRENCH`, `PHYSICS`, `CHEMISTRY`, `BIOLOGY`, `HISTORY`, `GEOGRAPHY`, `COMPUTER_SCIENCE`, `PHYSICAL_EDUCATION`, `MUSIC`, `ART`.

### Responses and errors

Responses are built from response DTOs through mappers; database rows (password hashes, internal ids such as `userId`) are never returned as-is.

Errors always look like:

```json
{
  "statusCode": 422,
  "code": "STUDENT_NOT_FOUND",
  "message": "Student 99 does not exist",
  "errors": [{ "field": "studentId" }]
}
```

`errors` is only present for validation failures. `code` is a stable identifier clients can switch on.

| Status | When | Example codes |
|---|---|---|
| `200` / `201` / `204` | success / created / deleted | |
| `400` | malformed or invalid input, empty update body, bad path parameter | `VALIDATION_FAILED`, `INVALID_PARAMETER`, `EMPTY_UPDATE` |
| `401` | missing/expired/invalid token, bad credentials | `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `REFRESH_TOKEN_INVALID` |
| `403` | wrong role, not your class, not your grade | `INSUFFICIENT_ROLE`, `NOT_CLASS_TEACHER`, `NOT_GRADE_AUTHOR` |
| `404` | the resource in the URL does not exist | `STUDENT_NOT_FOUND`, `TEACHER_NOT_FOUND`, `CLASS_NOT_FOUND`, `GRADE_NOT_FOUND` |
| `409` | duplicate unique value | `EMAIL_TAKEN`, `CLASS_NAME_TAKEN` |
| `413` | body larger than 100 KB | `PAYLOAD_TOO_LARGE` |
| `422` | the body is valid but references something that does not exist (e.g. `teacherId`, `studentId`) | `TEACHER_NOT_FOUND`, `STUDENT_NOT_FOUND`, `CLASS_NOT_FOUND` |
| `429` | too many failed logins | `TOO_MANY_ATTEMPTS` |
| `503` | database unavailable | `DATABASE_UNAVAILABLE` |

### Input validation

- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted` and `forbidUnknownValues`: unknown properties are rejected, not silently dropped.
- Optional fields use `OptionalNotNull`: a field may be omitted, but sending `null` for it is a `400`. Only fields that are genuinely nullable (`classId`, `teacherId` on updates) accept `null`.
- Strings are trimmed; emails are lower-cased; names and class names have length limits; an empty or non-object body on an update is rejected (`EMPTY_UPDATE`).
- Grades must be integers 1–10; subjects must be one of the enum values; dates must be real calendar dates in `YYYY-MM-DD` format.

## Database design

```
User 1──1 Teacher 1──* Class 1──* Student 1──1 User
                │                    │
                └────* Grade *───────┘
User 1──* RefreshToken
```

- `users`: `id`, `email` (unique), `passwordHash` (bcrypt), `role` (`ADMIN` / `TEACHER` / `STUDENT`)
- `teachers`: `userId` (unique FK), `firstName`, `lastName`
- `students`: `userId` (unique FK), `classId` (nullable FK), `firstName`, `lastName`, `dateOfBirth` (**`DATE`**)
- `classes`: `name` (unique), `teacherId` (nullable FK). One teacher per class, a teacher can have many classes
- `grades`: `studentId`, `teacherId` (**nullable FK**), `subject` (**`ENUM`**), `numericGrade` (`TINYINT UNSIGNED` with a `CHECK` between 1 and 10), `date` (**`DATE`**)
- `refresh_tokens`: `userId`, `tokenHash` (SHA-256, unique), `expiresAt`, `revokedAt`

Foreign key behaviour:

| Relation | On delete |
|---|---|
| user → teacher / student profile | `CASCADE` |
| student → grades | `CASCADE` (a student's grades have no meaning without the student) |
| teacher → grades | **`SET NULL`**: deleting a teacher keeps the grades |
| teacher → classes | `SET NULL`: the class stays, unassigned |
| class → students | `SET NULL`: students stay, unassigned |
| user → refresh tokens | `CASCADE` |

Schema: `backend/prisma/schema.prisma`. Migration: `backend/prisma/migrations/`. Seed: `backend/prisma/seed.mjs`.

## Project structure (backend)

```
src/
  config/      environment parsing and validation (fails fast on a weak JWT_SECRET)
  auth/        login, refresh rotation, throttling, guards, @Roles / @Public decorators
  students/    controller, service, mapper, DTOs
  teachers/    controller, service, mapper, DTOs
  classes/     controller, service, mapper, DTOs
  grades/      controller, service, mapper, DTOs
  common/      errors (typed exceptions, codes, global filter), validation pipes,
               ownership and reference checks, password hashing, security headers
  health/      health check
  prisma/      PrismaService / PrismaModule
```

Controllers only handle HTTP concerns; business rules live in the services; mappers turn database rows into response DTOs.
