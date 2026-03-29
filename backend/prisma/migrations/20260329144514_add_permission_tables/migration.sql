/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[operationId]` on the table `student_classes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TimetableMode" AS ENUM ('MANUAL', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "semesterId" INTEGER;

-- AlterTable
ALTER TABLE "Local" ADD COLUMN     "weeklyHours" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "aiOptimizationScore" DOUBLE PRECISION,
ADD COLUMN     "mode" "TimetableMode" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockUntil" TIMESTAMP(3),
ADD COLUMN     "roleId" INTEGER,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "student_classes" ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "subject" ADD COLUMN     "coff" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "subject_local" ALTER COLUMN "tenantId" DROP NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "operationId" TEXT,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRiskProfile" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "attendance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageGrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behaviorScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "homeworkCompletion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "recommendation" TEXT,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "operationId" TEXT,

    CONSTRAINT "StudentRiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherEvaluation" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "improvementProbability" DOUBLE PRECISION NOT NULL,
    "weakAreas" TEXT[],
    "trainingPlan" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "TeacherEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" SERIAL NOT NULL,
    "weekStartDay" "WeekDay" NOT NULL DEFAULT 'SUNDAY',
    "firstHour" TEXT NOT NULL DEFAULT '08:00',
    "lastHour" TEXT NOT NULL DEFAULT '16:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "operationId" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_operationId_key" ON "Semester"("operationId");

-- CreateIndex
CREATE INDEX "Semester_tenantId_idx" ON "Semester"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRiskProfile_studentId_key" ON "StudentRiskProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRiskProfile_operationId_key" ON "StudentRiskProfile"("operationId");

-- CreateIndex
CREATE INDEX "StudentRiskProfile_tenantId_idx" ON "StudentRiskProfile"("tenantId");

-- CreateIndex
CREATE INDEX "TeacherEvaluation_teacherId_idx" ON "TeacherEvaluation"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherEvaluation_tenantId_idx" ON "TeacherEvaluation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_tenantId_key" ON "SystemSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_operationId_key" ON "SystemSettings"("operationId");

-- CreateIndex
CREATE INDEX "SystemSettings_tenantId_idx" ON "SystemSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_operationId_key" ON "student_classes"("operationId");

-- CreateIndex
CREATE INDEX "student_classes_tenantId_idx" ON "student_classes"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRiskProfile" ADD CONSTRAINT "StudentRiskProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherEvaluation" ADD CONSTRAINT "TeacherEvaluation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "employers"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;
