/*
  Warnings:

  - The values [PENDING,COMPLETED] on the enum `JournalEntryStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `comptes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[operationId]` on the table `EmployerAttendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Exam` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Fee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `JournalEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `JournalLine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Local` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `StudentAttendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `TeacherSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `TeaherClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `TimeSlot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `classes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `comptes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `comptes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `employers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `grads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `journals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `parameter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `parents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `school_years` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `subject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[operationId]` on the table `subject_local` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `EmployerAttendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Fee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `JournalLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Local` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `StudentAttendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `TeacherSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `TeaherClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `comptes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `employers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `grads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `parents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `school_years` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `subject_local` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CompteCategory" AS ENUM ('GENERAL', 'CAISSE', 'BANQUE', 'RECETTE', 'DEPENSE');

-- AlterEnum
BEGIN;
CREATE TYPE "JournalEntryStatus_new" AS ENUM ('DRAFT', 'POSTED', 'REVERSED', 'CANCELLED');
ALTER TABLE "JournalEntry" ALTER COLUMN "status" TYPE "JournalEntryStatus_new" USING ("status"::text::"JournalEntryStatus_new");
ALTER TYPE "JournalEntryStatus" RENAME TO "JournalEntryStatus_old";
ALTER TYPE "JournalEntryStatus_new" RENAME TO "JournalEntryStatus";
DROP TYPE "JournalEntryStatus_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PayrollStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "EmployerAttendance" ADD COLUMN     "lateMinutes" INTEGER DEFAULT 0,
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "compteId" INTEGER,
ADD COLUMN     "dateEndConsommation" TIMESTAMP(3),
ADD COLUMN     "dateStartConsommation" TIMESTAMP(3),
ADD COLUMN     "isAmortization" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Fee" ADD COLUMN     "dateEndConsommation" TIMESTAMP(3),
ADD COLUMN     "dateStartConsommation" TIMESTAMP(3),
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Local" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "compteDestId" INTEGER,
ADD COLUMN     "compteSourceId" INTEGER,
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "attendanceSummary" JSONB,
ADD COLUMN     "compteId" INTEGER,
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "StudentAttendance" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TeacherSubject" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TeaherClass" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TimeSlot" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "comptes" DROP COLUMN "type",
ADD COLUMN     "category" "CompteCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "code" TEXT,
ADD COLUMN     "isFeeCash" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "nature" "AccountNature" NOT NULL DEFAULT 'ASSET',
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "selectionCode" TEXT,
ADD COLUMN     "showInParent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "checkInTime" TEXT DEFAULT '08:00',
ADD COLUMN     "checkOutTime" TEXT DEFAULT '16:00',
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "salary" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "salaryBasis" TEXT NOT NULL DEFAULT 'DAILY',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "grads" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "dateCreate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "journals" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "parameter" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "paramValue" TEXT,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "school_years" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "lastModifiedBy" INTEGER,
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "subject" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "subject_local" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- DropEnum
DROP TYPE "CompteType";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "userId" INTEGER,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "operationId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRevocation" (
    "id" SERIAL NOT NULL,
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRevocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTranslation" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ClassTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectTranslation" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SubjectTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteTranslation" (
    "id" SERIAL NOT NULL,
    "compteId" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CompteTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" SERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "operationId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_operationId_key" ON "AuditLog"("operationId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TokenRevocation_jti_key" ON "TokenRevocation"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTranslation_classId_locale_key" ON "ClassTranslation"("classId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectTranslation_subjectId_locale_key" ON "SubjectTranslation"("subjectId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CompteTranslation_compteId_locale_key" ON "CompteTranslation"("compteId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_year_key" ON "FiscalYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "events_operationId_key" ON "events"("operationId");

-- CreateIndex
CREATE INDEX "events_tenantId_idx" ON "events"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerAttendance_operationId_key" ON "EmployerAttendance"("operationId");

-- CreateIndex
CREATE INDEX "EmployerAttendance_tenantId_idx" ON "EmployerAttendance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_operationId_key" ON "Exam"("operationId");

-- CreateIndex
CREATE INDEX "Exam_tenantId_idx" ON "Exam"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_operationId_key" ON "Expense"("operationId");

-- CreateIndex
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Fee_operationId_key" ON "Fee"("operationId");

-- CreateIndex
CREATE INDEX "Fee_tenantId_idx" ON "Fee"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_operationId_key" ON "JournalEntry"("operationId");

-- CreateIndex
CREATE INDEX "JournalEntry_tenantId_idx" ON "JournalEntry"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalLine_operationId_key" ON "JournalLine"("operationId");

-- CreateIndex
CREATE INDEX "JournalLine_tenantId_idx" ON "JournalLine"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Local_operationId_key" ON "Local"("operationId");

-- CreateIndex
CREATE INDEX "Local_tenantId_idx" ON "Local"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_operationId_key" ON "Payment"("operationId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_employerId_idx" ON "Payment"("employerId");

-- CreateIndex
CREATE INDEX "Payment_date_idx" ON "Payment"("date");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_operationId_key" ON "Payroll"("operationId");

-- CreateIndex
CREATE INDEX "Payroll_tenantId_idx" ON "Payroll"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_operationId_key" ON "StudentAttendance"("operationId");

-- CreateIndex
CREATE INDEX "StudentAttendance_tenantId_idx" ON "StudentAttendance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_operationId_key" ON "TeacherSubject"("operationId");

-- CreateIndex
CREATE INDEX "TeacherSubject_tenantId_idx" ON "TeacherSubject"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TeaherClass_operationId_key" ON "TeaherClass"("operationId");

-- CreateIndex
CREATE INDEX "TeaherClass_tenantId_idx" ON "TeaherClass"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_operationId_key" ON "TimeSlot"("operationId");

-- CreateIndex
CREATE INDEX "TimeSlot_tenantId_idx" ON "TimeSlot"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_operationId_key" ON "Timetable"("operationId");

-- CreateIndex
CREATE INDEX "Timetable_tenantId_idx" ON "Timetable"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_operationId_key" ON "classes"("operationId");

-- CreateIndex
CREATE INDEX "classes_tenantId_idx" ON "classes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_code_key" ON "comptes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_operationId_key" ON "comptes"("operationId");

-- CreateIndex
CREATE INDEX "comptes_tenantId_idx" ON "comptes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "employers_operationId_key" ON "employers"("operationId");

-- CreateIndex
CREATE INDEX "employers_tenantId_idx" ON "employers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "grads_operationId_key" ON "grads"("operationId");

-- CreateIndex
CREATE INDEX "grads_tenantId_idx" ON "grads"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "journals_operationId_key" ON "journals"("operationId");

-- CreateIndex
CREATE INDEX "journals_tenantId_idx" ON "journals"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_operationId_key" ON "parameter"("operationId");

-- CreateIndex
CREATE INDEX "parameter_tenantId_idx" ON "parameter"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_operationId_key" ON "parents"("operationId");

-- CreateIndex
CREATE INDEX "parents_tenantId_idx" ON "parents"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "school_years_operationId_key" ON "school_years"("operationId");

-- CreateIndex
CREATE INDEX "school_years_tenantId_idx" ON "school_years"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "students_operationId_key" ON "students"("operationId");

-- CreateIndex
CREATE INDEX "students_firstName_lastName_idx" ON "students"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "students_parentId_idx" ON "students"("parentId");

-- CreateIndex
CREATE INDEX "students_tenantId_idx" ON "students"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_operationId_key" ON "subject"("operationId");

-- CreateIndex
CREATE INDEX "subject_tenantId_idx" ON "subject"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_local_operationId_key" ON "subject_local"("operationId");

-- CreateIndex
CREATE INDEX "subject_local_tenantId_idx" ON "subject_local"("tenantId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTranslation" ADD CONSTRAINT "ClassTranslation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("classId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTranslation" ADD CONSTRAINT "SubjectTranslation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteTranslation" ADD CONSTRAINT "CompteTranslation_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_compteSourceId_fkey" FOREIGN KEY ("compteSourceId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_compteDestId_fkey" FOREIGN KEY ("compteDestId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
