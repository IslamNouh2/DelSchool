"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { DataTable } from "@/components/DataTable";

type EmployerRow = {
    id: number;
    num: number;
    name: string;
    code: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    checkInTime?: string | null;
    checkOutTime?: string | null;
};

interface EmployerAttendanceFormProps {
    employers: any[];
    date: Date | undefined;
    existingAttendance: any[];
    hasExistingData: boolean;
    onClose: () => void;
}

export default function EmployerAttendanceForm({
    employers,
    date,
    existingAttendance,
    hasExistingData,
    onClose,
}: EmployerAttendanceFormProps) {
    const initialData: EmployerRow[] = useMemo(() => {
        return employers.map((e: any, index: number) => {
            const existing = existingAttendance.find((att: any) => att.employerId === e.employerId);
            const derivedStatus = existing
                ? (existing.checkInTime ? "PRESENT" : "ABSENT")
                : "PRESENT";
            return {
                id: e.employerId,
                num: index + 1,
                name: `${e.firstName} ${e.lastName}`,
                code: e.code,
                status: existing ? (existing.status || derivedStatus) : derivedStatus,
                checkInTime: existing?.checkInTime ?? null,
                checkOutTime: existing?.checkOutTime ?? null,
            };
        });
    }, [employers, existingAttendance]);

    const [data, setData] = useState<EmployerRow[]>(initialData);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalCount = data.length;
    const pagedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return data.slice(start, end);
    }, [data, currentPage, pageSize]);

    // Minimal columns inline to avoid creating a new columns file
    const columns = [
        { accessorKey: "num", header: "Num" },
        { accessorKey: "name", header: "Nom" },
        { accessorKey: "code", header: "Code" },
        {
            accessorKey: "status",
            header: "Statut",
            cell: ({ row }: any) => {
                const status = row.original.status;
                const updateStatus = (newStatus: "PRESENT" | "ABSENT" | "LATE") => {
                    setData((prev) => prev.map((r) => r.id === row.original.id ? { ...r, status: newStatus } : r));
                };
                return (
                    <div className="flex gap-2">
                        {["present", "absent", "late"].map((st) => {
                            const isSelected = status.toLowerCase() === st;
                            return (
                                <Button
                                    key={st}
                                    size="sm"
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() => updateStatus(st.toUpperCase() as "PRESENT" | "ABSENT" | "LATE")}
                                    className={`
                                    ${st === "present" ? "bg-green-600 hover:bg-green-700 text-white" : st === "absent" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-black hover:bg-gray-800 text-white"}
                                    ${!isSelected ? "opacity-70" : ""}
                                `}
                                >
                                    {st}
                                </Button>
                            );
                        })}
                    </div>
                );
            },
        },
    ];

    const getCurrentDateTime = () => {
        const now = new Date();
        return now.toISOString();
    };

    const handleSubmit = async () => {
        if (!date) {
            console.error("Date is required");
            return;
        }

        setSaving(true);
        try {
            if (hasExistingData) {
                // Delete existing employer attendance for this date
                const dateString = date.toLocaleDateString('en-CA');
                const ids = existingAttendance.map((att: any) => att.id);
                
                for (const id of ids) {
                    try {
                        await api.delete(`/attendance/employer/${id}`);
                    } catch (err) {
                        console.error(`Error deleting attendance record ${id}:`, err);
                    }
                }
            }

            // Process all records - PRESENT means no record in DB, others get saved
            const recordsToSave = data.filter(r => r.status !== "PRESENT");

            if (recordsToSave.length > 0) {
                for (const r of recordsToSave) {
                    const isLate = r.status === "LATE";
                    const isAbsent = r.status === "ABSENT";
                    // Format the date as YYYY-MM-DD
                    const dateString = date.toLocaleDateString('en-CA');
                    
                    await api.post("/attendance/employer", {
                        employerId: r.id,
                        date: dateString,
                        // For LATE: set checkInTime to current date/time; ABSENT: null
                        checkInTime: isLate ? getCurrentDateTime() : null,
                        checkOutTime: null,
                        status: r.status, // Explicitly set the status
                        remarks: null,
                        academicYear: "2024-2025",
                    });
                    //console.log(dateString);
                }
            }

            onClose();
        } catch (err) {
            console.error("Employer save error:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DataTable
                title=""
                columns={columns as any}
                data={pagedData}
                loading={false}
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
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
