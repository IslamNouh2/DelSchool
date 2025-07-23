-- CreateTable
CREATE TABLE "employers" (
    "employerId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "lieuOfBirth" TEXT,
    "gender" TEXT NOT NULL,
    "address" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "code" TEXT NOT NULL,
    "health" TEXT,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),
    "bloodType" TEXT,
    "etatCivil" TEXT,
    "cid" TEXT,
    "nationality" TEXT,
    "observation" TEXT,
    "numNumerisation" TEXT,
    "dateInscription" TIMESTAMP(3),
    "okBlock" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "photoFileName" TEXT,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("employerId")
);

-- CreateTable
CREATE TABLE "TeaherClass" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeaherClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employers_code_key" ON "employers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TeaherClass_employerId_academicYear_key" ON "TeaherClass"("employerId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_employerId_academicYear_key" ON "TeacherSubject"("employerId", "academicYear");

-- AddForeignKey
ALTER TABLE "TeaherClass" ADD CONSTRAINT "TeaherClass_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaherClass" ADD CONSTRAINT "TeaherClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;
