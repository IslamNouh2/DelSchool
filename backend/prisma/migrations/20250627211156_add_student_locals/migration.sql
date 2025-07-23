-- CreateTable
CREATE TABLE "StudentLocal" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "localId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentLocal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentLocal_studentId_academicYear_key" ON "StudentLocal"("studentId", "academicYear");

-- AddForeignKey
ALTER TABLE "StudentLocal" ADD CONSTRAINT "StudentLocal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLocal" ADD CONSTRAINT "StudentLocal_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("localId") ON DELETE RESTRICT ON UPDATE CASCADE;
