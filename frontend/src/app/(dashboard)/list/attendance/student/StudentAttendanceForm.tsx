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
    onClose: () => void;
}

export default function StudentAttendanceForm({
    students,
    classId,
    date,
    onClose,
}: StudentAttendanceFormProps) {
    const [data, setData] = useState<StudentAttendance[]>(
        students.map((s, i) => ({
            id: s.studentId,
            num: i + 1,
            name: `${s.firstName} ${s.lastName}`,
            code: s.code,
            status: "present",
        })));

    const [saving, setSaving] = useState(false);

    const columns = getColumns(setData);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            // Only keep records that are NOT "present"
            const filteredRecords = data.filter((record) => record.status !== "present");

            // If all students are present, nothing to save
            if (filteredRecords.length === 0) {
                console.log("No absences or late records to save.");
                onClose();
                return;
            }

            await api.post("http://localhost:47005/attendance/save", {
                classId,
                date,
                records: filteredRecords,
            });

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
                    {saving ? "Enregistrement..." : "Sauvegarder"}
                </Button>
            </div>
        </div>
    );
}
