/*
  Warnings:

  - A unique constraint covering the columns `[examId,studentClassId,subjectId]` on the table `grads` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "grads_examId_studentClassId_subjectId_key" ON "grads"("examId", "studentClassId", "subjectId");
