-- AddForeignKey
ALTER TABLE "grads" ADD CONSTRAINT "grads_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;
