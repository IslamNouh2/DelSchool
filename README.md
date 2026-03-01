# DelSchool Management System

DelSchool is a comprehensive, modern school management platform designed for efficiency and ease of use. It features a robust backend built with NestJS and Prisma, and a high-performance frontend powered by Next.js and next-intl for multi-language support.

## 🏗️ Architecture

This project is organized as a monorepo containing two main parts:

- **/frontend**: A Next.js application providing a rich user interface for students, teachers, and admins.
- **/backend**: A NestJS API server handling business logic, authentication, and database interactions via Prisma.

---

## 🚀 Key Features

### 👨‍🎓 Student & Parent Management
- **Student Profiles**: Comprehensive records including health, attendance, and academic history.
- **Parent Portal**: Tools for parents to track their children's progress and manage fees.

### 👩‍🏫 Academic Operations
- **Timetables**: Dynamic scheduling for classes, subjects, and teachers.
- **Exams & Grading**: Flexible grading system with multi-subject support.
- **Attendance**: Real-time attendance tracking for both students and employees.

### 💰 Financial Management
- **Fee Management**: Automated billing, payment tracking, and student accounts.
- **Payroll**: Automated salary calculations based on attendance and contracts.
- **Accounting**: Built-in general ledger, journal entries, and financial reporting.

### 🌍 System Features
- **Multi-Language**: Full support for English, French, and Arabic (RTL support).
- **PWA Support**: Offline-first capabilities for reliable use in various network conditions.
- **Role-Based Access Control (RBAC)**: Secure access management for different user roles.
- **Multi-Tenancy**: Support for multiple school branches or organizations within a single system.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **State/Data**: Axios, TanStack Table, React Hook Form
- **PWA**: `@ducanh2912/next-pwa`
- **I18n**: `next-intl`

### Backend
- **Framework**: NestJS 11+
- **ORM**: Prisma (PostgreSQL)
- **Real-time**: Socket.io
- **Security**: Passport.js (JWT), Bcrypt, Helmet
- **Validation**: Class-validator, Class-transformer

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL Database
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd delSchool-Website
```

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and configure your DATABASE_URL and JWT_SECRET
cp .env.example .env
# Run migrations and seed data
npx prisma migrate dev
npm run seed
# Start the development server
npm run start:dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Copy .env.example to .env and configure NEXT_PUBLIC_API_URL
cp .env.example .env
# Start the development server
npm run dev
```

---

## 📂 Project Structure

```text
delSchool-Website/
├── backend/                # NestJS API
│   ├── prisma/             # Database schema and migrations
│   ├── src/                # Backend source code
│   └── ...
├── frontend/               # Next.js Application
│   ├── public/             # Static assets
│   ├── src/                # Frontend source code
│   │   ├── app/            # Next.js App Router folders
│   │   ├── components/     # Reusable UI components
│   │   └── ...
│   └── messages/           # Localization files (JSON)
└── Readme.md               # Project documentation (this file)
```

---

## 📄 License

This project is UNLICENSED.
