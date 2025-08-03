/*
  Warnings:

  - You are about to drop the `time_slots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable_templates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "timetable_entries" DROP CONSTRAINT "timetable_entries_classId_fkey";

-- DropForeignKey
ALTER TABLE "timetable_entries" DROP CONSTRAINT "timetable_entries_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "timetable_entries" DROP CONSTRAINT "timetable_entries_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "timetable_entries" DROP CONSTRAINT "timetable_entries_timeSlotId_fkey";

-- DropTable
DROP TABLE "time_slots";

-- DropTable
DROP TABLE "timetable_entries";

-- DropTable
DROP TABLE "timetable_templates";

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "timeSlotId" INTEGER NOT NULL,
    "employerId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_day_timeSlotId_classId_academicYear_key" ON "Timetable"("day", "timeSlotId", "classId", "academicYear");

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;
