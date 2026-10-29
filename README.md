# School Management System

A full-stack web application for managing students, teachers, classes, and grades with JWT authentication and Role-Based Access Control (RBAC).

  🛠️ Tech Stack

- **Backend:** NestJS (TypeScript), Prisma ORM, MySQL 8
- **Frontend:** Vue 3, Vue Router, Pinia, Axios, Bootstrap 5

---

  📋 Prerequisites

- **Node.js** v22.18+ (sau v24.12+)
- **MySQL 8** running locally

---

  🚀 Quick Start

  # 1. Database Setup

Create the local MySQL database and user:

sql
CREATE DATABASE school_management;
CREATE USER 'school'@'localhost' IDENTIFIED BY 'school_pass123';
GRANT ALL PRIVILEGES ON *.* TO 'school'@'localhost';
FLUSH PRIVILEGES;

# 2. Backend Setup

cd backend

### Install dependencies
npm install

### Setup environment variables
cp .env.example .env
### Open .env and set JWT_SECRET (must be at least 32 characters, e.g., run: openssl rand -hex 32)

### Run database migrations and seed sample data in one step
npm run db:setup

### Start the development server
npm run start:dev

# 3. Frontend Setup
In a new terminal window:
cd frontend

### Install dependencies
npm install

### Setup environment variables
cp .env.example .env

### Start the development server
npm run dev

  🔑 Test Credentials
All accounts are created via the seed script with the default password: password123
-Administrator: admin@school.com
-Teacher1: teacher@school.com
-Teacher2: teacher2@school.com
-Student1: student@school.com
-Student2: student2@school.com
-Student3: student3@school.com

