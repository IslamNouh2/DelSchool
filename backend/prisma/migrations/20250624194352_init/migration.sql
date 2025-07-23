/*
  Warnings:

  - You are about to drop the `Parent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropTable
DROP TABLE "Parent";

-- DropTable
DROP TABLE "Student";

-- CreateTable
CREATE TABLE "students" (
    "studentId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT,
    "parentId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "health" TEXT,
    "dateCreate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModif" TIMESTAMP(3) NOT NULL,
    "lieuOfBirth" TEXT,
    "bloodType" TEXT,
    "etatCivil" TEXT,
    "cid" TEXT,
    "nationality" TEXT,
    "observation" TEXT,
    "numNumerisation" TEXT,
    "dateInscription" TIMESTAMP(3) NOT NULL,
    "okBlock" BOOLEAN NOT NULL DEFAULT false,
    "photoFileName" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "parents" (
    "parentId" SERIAL NOT NULL,
    "father" TEXT,
    "mother" TEXT,
    "fatherJob" TEXT,
    "motherJob" TEXT,
    "fatherNumber" TEXT,
    "motherNumber" TEXT,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("parentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_code_key" ON "students"("code");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("parentId") ON DELETE CASCADE ON UPDATE CASCADE;
