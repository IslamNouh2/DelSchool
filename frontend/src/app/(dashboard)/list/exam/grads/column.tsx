"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

export type GradeRow = {
    studentId: number;
    studentCode: string;
    studentName: string;
    subjects: {
        subjectName: string;
        grade: number | null;
        subjectId: number;
    }[];
};

type ColumnProps = {
    subjects: string[]; // dynamic subject list
    onGradeChange: (studentId: number, subjectId: number, newGrade: number) => void;
};

export const columns = ({ subjects, onGradeChange }: ColumnProps): ColumnDef<GradeRow>[] => {
    const baseColumns: ColumnDef<GradeRow>[] = [
        {
            accessorKey: "studentCode",
            header: "Code",
            cell: ({ row }) => <span className="text-gray-500 font-mono text-xs">{row.original.studentCode}</span>,
        },
        {
            accessorKey: "studentName",
            header: "Nom de l'étudiant",
            cell: ({ row }) => (
                <span className="font-medium text-gray-800">{row.original.studentName}</span>
            ),
        },
    ];

    // Dynamically create a column per subject
    const subjectColumns = subjects.map(
        (subjectName) =>
            ({
                id: subjectName,
                header: () => (
                    <div className="text-center font-bold text-xs uppercase tracking-wider text-gray-500">{subjectName}</div>
                ),
                cell: ({ row }) => {
                    const subject = row.original.subjects.find(
                        (s) => s.subjectName === subjectName
                    );

                    if (!subject) return <div className="text-center text-gray-300">—</div>;

                    const grade = subject.grade;
                    const isFailing = grade !== null && grade < 10;
                    const isExcellent = grade !== null && grade >= 16;

                    return (
                        <div className="flex justify-center">
                            <Input
                                type="number"
                                min={0}
                                max={20}
                                value={subject.grade ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        // Handle empty string if needed, or just pass 0 or keep it null logic
                                        // For now, let's assume we pass the number, but we might need to handle deletion better
                                        // The original code passed parseFloat(e.target.value) which is NaN for empty string
                                        // Let's stick to original logic but maybe check for NaN
                                        const num = parseFloat(val);
                                        if (!isNaN(num)) {
                                            onGradeChange(row.original.studentId, subject.subjectId, num);
                                        }
                                    } else {
                                        onGradeChange(row.original.studentId, subject.subjectId, parseFloat(val));
                                    }
                                }}
                                className={`w-16 text-center h-9 transition-all duration-200 
                                    ${isFailing ? "text-red-600 font-semibold bg-red-50 border-red-200" : ""}
                                    ${isExcellent ? "text-green-600 font-semibold bg-green-50 border-green-200" : ""}
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                `}
                            />
                        </div>
                    );
                },
            }) as ColumnDef<GradeRow>
    );

    return [...baseColumns, ...subjectColumns];
};
