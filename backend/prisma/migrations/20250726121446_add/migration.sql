/*
  Warnings:

  - You are about to drop the column `academicYear` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `TeaherClass` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employerId]` on the table `TeacherSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employerId]` on the table `TeaherClass` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TeacherSubject_employerId_academicYear_key";

-- DropIndex
DROP INDEX "TeaherClass_employerId_academicYear_key";

-- AlterTable
ALTER TABLE "TeacherSubject" DROP COLUMN "academicYear";

-- AlterTable
ALTER TABLE "TeaherClass" DROP COLUMN "academicYear";

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_employerId_key" ON "TeacherSubject"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeaherClass_employerId_key" ON "TeaherClass"("employerId");
