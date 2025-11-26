-- CreateTable
CREATE TABLE "Exam" (
    "id" SERIAL NOT NULL,
    "examName" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "publish" TEXT NOT NULL DEFAULT 'N',
    "localId" INTEGER NOT NULL,
    "dateCreate" TIMESTAMP(3),
    "dateModif" TIMESTAMP(3),

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("localId") ON DELETE RESTRICT ON UPDATE CASCADE;
