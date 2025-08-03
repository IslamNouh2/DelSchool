-- CreateTable
CREATE TABLE "time_slots" (
    "timeSlotId" SERIAL NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "dateCreate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModif" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("timeSlotId")
);

-- CreateTable
CREATE TABLE "timetable_entries" (
    "timetableId" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "teacherId" INTEGER NOT NULL,
    "timeSlotId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "room" TEXT,
    "notes" TEXT,
    "dateCreate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModif" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_entries_pkey" PRIMARY KEY ("timetableId")
);

-- CreateTable
CREATE TABLE "timetable_templates" (
    "templateId" SERIAL NOT NULL,
    "templateName" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT NOT NULL,
    "dateCreate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModif" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_templates_pkey" PRIMARY KEY ("templateId")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_startTime_endTime_key" ON "time_slots"("startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_entries_classId_timeSlotId_dayOfWeek_academicYear_key" ON "timetable_entries"("classId", "timeSlotId", "dayOfWeek", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_templates_templateName_key" ON "timetable_templates"("templateName");

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("subjectId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "employers"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slots"("timeSlotId") ON DELETE RESTRICT ON UPDATE CASCADE;
