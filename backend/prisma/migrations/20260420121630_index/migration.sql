-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_lockUntil_idx" ON "User"("lockUntil");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
