"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type EmployerRow = {
    id: number;
    num: number;
    name: string;
    code: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
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
}: EmployerAttendanceFormProps): JSX.Element {
    const t = useTranslations("attendance.staff.form");
    const tTable = useTranslations("employers.table");
    const initialData: EmployerRow[] = useMemo(() => {
        return employers.map((e: any, index: number) => {
            const existing = existingAttendance.find((att: any) => att.employerId === e.employerId);
            return {
                id: e.employerId,
                num: index + 1,
                name: `${e.firstName} ${e.lastName}`,
                code: e.code,
                status: existing ? existing.status : "PRESENT",
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
    
    // Columns with better styling
    const columns = [
        { accessorKey: "num", header: "Num" },
        { accessorKey: "name", header: tTable("name") },
        { accessorKey: "code", header: tTable("code") },
        {
            accessorKey: "status",
            header: tTable("status"),
            cell: ({ row }: any) => {
                const status = row.original.status;
                const updateStatus = async (newStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
                    setData((prev) => prev.map((r) => r.id === row.original.id ? { ...r, status: newStatus } : r));
                };
                
                return (
                    <div className="flex gap-1">
                        {[
                            { id: "PRESENT", color: "bg-emerald-500", label: t("present") },
                            { id: "LATE", color: "bg-amber-500", label: t("late") },
                            { id: "ABSENT", color: "bg-rose-500", label: t("absent") },
                        ].map((st) => (
                            <Button
                                key={st.id}
                                size="sm"
                                variant={status === st.id ? "default" : "outline"}
                                onClick={() => updateStatus(st.id as any)}
                                className={`text-[10px] h-7 px-2 font-bold ${status === st.id ? `${st.color} text-white` : ""}`}
                            >
                                {st.label}
                            </Button>
                        ))}
                    </div>
                );
            },
        },
    ];

    const handleSubmit = async () => {
        if (!date) return;
        setSaving(true);
        try {
            // Bulk save logic
            for (const r of data) {
                // If there's an existing record, we might want to update or delete/re-create.
                // For simplicity and matching the previous logic:
                const existing = existingAttendance.find((att: any) => att.employerId === r.id);
                if (existing) {
                    await api.delete(`/attendance/employer/${existing.id}`).catch(() => {});
                }

                if (r.status !== "PRESENT") {
                    const dateString = date.toLocaleDateString('en-CA');
                    await api.post("/attendance/employer", {
                        employerId: r.id,
                        date: dateString,
                        status: r.status,
                        academicYear: "2024-2025",
                        checkInTime: r.status === "LATE" ? new Date().toISOString() : null
                    });
                }
            }
            toast.success(t("save_success"));
            onClose();
        } catch (err) {
            toast.error(t("save_error"));
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
                <Button onClick={handleSubmit} disabled={saving} className="rounded-xl px-8 py-6 font-bold">
                    {saving
                        ? t("loading")
                        : hasExistingData
                            ? t("update")
                            : t("save")
                    }
                </Button>
            </div>
                </div>
    );
}
