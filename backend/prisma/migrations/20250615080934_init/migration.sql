-- CreateTable
CREATE TABLE "Parent" (
    "parentId" SERIAL NOT NULL,
    "father" TEXT,
    "mother" TEXT,
    "fatherJob" TEXT,
    "motherJob" TEXT,
    "motherNumber" TEXT,
    "fatherNumber" TEXT,
    "kafil" INTEGER NOT NULL DEFAULT 0,
    "fatherCid" TEXT,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("parentId")
);

-- CreateTable
CREATE TABLE "Student" (
    "studentId" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "parentId" INTEGER NOT NULL,
    "code" TEXT,
    "health" TEXT,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),
    "lieuOfBirth" TEXT,
    "bloodType" TEXT,
    "etatCivil" TEXT,
    "cid" TEXT,
    "nationality" TEXT,
    "observation" TEXT,
    "numNumerisation" TEXT NOT NULL DEFAULT '0',
    "dateInscription" TIMESTAMP(3) NOT NULL,
    "photo" BYTEA,
    "okBlock" TEXT NOT NULL DEFAULT 'N',

    CONSTRAINT "Student_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "Local" (
    "localId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),
    "NumClass" INTEGER,

    CONSTRAINT "Local_pkey" PRIMARY KEY ("localId")
);

-- CreateTable
CREATE TABLE "classes" (
    "classId" SERIAL NOT NULL,
    "ClassName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),
    "NumStudent" INTEGER NOT NULL,
    "localId" INTEGER NOT NULL,
    "okBlock" TEXT NOT NULL DEFAULT 'N',

    CONSTRAINT "classes_pkey" PRIMARY KEY ("classId")
);

-- CreateTable
CREATE TABLE "subject" (
    "subjectId" SERIAL NOT NULL,
    "subjectName" TEXT NOT NULL,
    "totalGrads" DOUBLE PRECISION NOT NULL,
    "parentId" INTEGER NOT NULL,
    "BG" INTEGER NOT NULL,
    "BD" INTEGER NOT NULL,
    "level" INTEGER,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),
    "okBlock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("subjectId")
);

-- CreateTable
CREATE TABLE "parameter" (
    "paramId" SERIAL NOT NULL,
    "paramName" TEXT NOT NULL,
    "okActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "parameter_pkey" PRIMARY KEY ("paramId")
);

-- CreateTable
CREATE TABLE "subject_local" (
    "subjectLocalId" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "localId" INTEGER NOT NULL,
    "cloture" BOOLEAN NOT NULL DEFAULT false,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),

    CONSTRAINT "subject_local_pkey" PRIMARY KEY ("subjectLocalId")
);

-- CreateIndex
CREATE UNIQUE INDEX "parameter_paramName_key" ON "parameter"("paramName");

-- CreateIndex
CREATE UNIQUE INDEX "subject_local_subjectId_localId_key" ON "subject_local"("subjectId", "localId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("parentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("localId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "subject"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_local" ADD CONSTRAINT "subject_local_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_local" ADD CONSTRAINT "subject_local_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("localId") ON DELETE RESTRICT ON UPDATE CASCADE;
