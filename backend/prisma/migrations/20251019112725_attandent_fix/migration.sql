/*
  Warnings:

  - You are about to drop the column `checkInTime` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutTime` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `StudentAttendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudentAttendance" DROP COLUMN "checkInTime",
DROP COLUMN "checkOutTime",
DROP COLUMN "remarks";
