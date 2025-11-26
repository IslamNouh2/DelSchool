"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getColumns, StudentAttendance } from "../columns";
import { DataTable } from "@/components/DataTable";

interface StudentAttendanceFormProps {
    students: any[];
    classId: number;
    date: Date | undefined;
    existingAttendance: any[];
    hasExistingData: boolean;
    onClose: () => void;
}

export default function StudentAttendanceForm({
    students,
    classId,
    date,
    existingAttendance,
    hasExistingData,
    onClose,
}: StudentAttendanceFormProps) {
    const [data, setData] = useState<StudentAttendance[]>(() => {
        return students.map((s, i) => {
            // Check if this student has existing attendance data
            const existingRecord = existingAttendance.find(att => att.studentId === s.studentId);
            return {
                id: s.studentId,
                num: i + 1,
                name: `${s.firstName} ${s.lastName}`,
                code: s.code,
                status: existingRecord ? existingRecord.status : "PRESENT",
            };
        });
    });

    const [saving, setSaving] = useState(false);

    const columns = getColumns(setData);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (hasExistingData) {
                // Delete existing student attendance for this date
                const existingIds = existingAttendance.map((att: any) => att.id);
                
                for (const id of existingIds) {
                    try {
                        await api.delete(`/attendance/student/${id}`);
                    } catch (err) {
                        console.error(`Error deleting attendance record ${id}:`, err);
                    }
                }
            }

            // Process all records - PRESENT means no record in DB, others get saved
            const recordsToSave = data.filter(r => r.status !== "PRESENT");

            if (recordsToSave.length > 0) {
                await api.post("/attendance/save", {
                    classId,
                    date: date?.toISOString(),
                    academicYear: "2024-2025",
                    records: recordsToSave.map((r) => ({
                        studentId: r.id,
                        status: r.status.toUpperCase(),
                    })),
                });
            }

            onClose();
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DataTable
                title= ""
                columns={columns}
                data={data}
                loading={false}
                currentPage={1}
                totalCount={data.length}
                pageSize={data.length}
            />
            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving 
                        ? "Enregistrement..." 
                        : hasExistingData 
                            ? "Mettre à jour" 
                            : "Sauvegarder"
                    }
                </Button>
            </div>
        </div>
    );
}
