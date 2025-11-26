/*
  Warnings:

  - You are about to drop the `StudentLocal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentLocal" DROP CONSTRAINT "StudentLocal_localId_fkey";

-- DropForeignKey
ALTER TABLE "StudentLocal" DROP CONSTRAINT "StudentLocal_studentId_fkey";

-- DropTable
DROP TABLE "StudentLocal";

-- CreateTable
CREATE TABLE "student_classes" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grads" (
    "id" SERIAL NOT NULL,
    "grads" DOUBLE PRECISION NOT NULL,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),
    "examId" INTEGER NOT NULL,
    "studentClassId" INTEGER NOT NULL,

    CONSTRAINT "grads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_studentId_academicYear_key" ON "student_classes"("studentId", "academicYear");

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grads" ADD CONSTRAINT "grads_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grads" ADD CONSTRAINT "grads_studentClassId_fkey" FOREIGN KEY ("studentClassId") REFERENCES "student_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
