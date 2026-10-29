# Backend

NestJS + Prisma + MySQL API for the School Management System.

Setup, test credentials, the endpoint list and the error format are in the [root README](../README.md).

```bash
npm install
cp .env.example .env     # set DATABASE_URL and a JWT_SECRET of 32+ characters
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev        # API: http://localhost:3000/api, Swagger UI: http://localhost:3000/api/docs
```

`npm run db:reset` drops all tables, re-applies the migration and re-seeds (needed once when upgrading from the earlier schema).
