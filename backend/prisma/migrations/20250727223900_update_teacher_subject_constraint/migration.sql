/*
  Warnings:

  - A unique constraint covering the columns `[employerId,subjectId]` on the table `TeacherSubject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TeacherSubject_employerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_employerId_subjectId_key" ON "TeacherSubject"("employerId", "subjectId");
