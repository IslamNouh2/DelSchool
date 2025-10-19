"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type StudentAttendance = {
    id: number;
    num: number;
    name: string;
    code: string;
    status: "present" | "absent" | "late";
};

// This function returns your columns definition and a way to update status
export const getColumns = (
    setData: React.Dispatch<React.SetStateAction<StudentAttendance[]>>
): ColumnDef<StudentAttendance>[] => [
        {
            accessorKey: "num",
            header: "Num",
        },
        {
            accessorKey: "name",
            header: "Nom",
        },
        {
            accessorKey: "code",
            header: "Code Étudiant",
        },
        {
            accessorKey: "status",
            header: "Statut",
            cell: ({ row }) => {
                const status = row.original.status;
                const updateStatus = (newStatus: "present" | "absent" | "late") => {
                    setData((prev) =>
                        prev.map((r) =>
                            r.id === row.original.id ? { ...r, status: newStatus } : r
                        )
                    );
                };

                return (
                    <div className="flex gap-2">
                        {["present", "absent", "late"].map((st) => (
                            <Button
                                key={st}
                                size="sm"
                                variant={status === st ? "default" : "outline"}
                                onClick={() => updateStatus(st as "present" | "absent" | "late")}
                                className={`
        ${st === "present"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : st === "absent"
                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                            : "bg-black hover:bg-gray-800 text-white"
                                    }
        ${status !== st ? "opacity-70" : ""}
      `}
                            >
                                {st}
                            </Button>
                        ))}
                    </div>
                );
            },
        },
    ];
