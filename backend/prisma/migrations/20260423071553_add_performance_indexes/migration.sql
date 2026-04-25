-- DropIndex
DROP INDEX "EmployerAttendance_tenantId_idx";

-- DropIndex
DROP INDEX "Payment_tenantId_idx";

-- DropIndex
DROP INDEX "StudentAttendance_tenantId_idx";

-- DropIndex
DROP INDEX "students_tenantId_idx";

-- CreateIndex
CREATE INDEX "EmployerAttendance_tenantId_date_status_idx" ON "EmployerAttendance"("tenantId", "date", "status");

-- CreateIndex
CREATE INDEX "Payment_tenantId_status_date_idx" ON "Payment"("tenantId", "status", "date");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "StudentAttendance_tenantId_date_status_idx" ON "StudentAttendance"("tenantId", "date", "status");

-- CreateIndex
CREATE INDEX "StudentAttendance_tenantId_classId_date_idx" ON "StudentAttendance"("tenantId", "classId", "date");

-- CreateIndex
CREATE INDEX "students_tenantId_gender_idx" ON "students"("tenantId", "gender");
