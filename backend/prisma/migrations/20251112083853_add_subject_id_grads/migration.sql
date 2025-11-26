/*
  Warnings:

  - Added the required column `subjectId` to the `grads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "grads" ADD COLUMN     "subjectId" INTEGER NOT NULL;
