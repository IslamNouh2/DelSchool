"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface Last7DaysAttendanceProps {
    type: "student" | "employer";
    classId?: number;
}

type PersonAttendance = {
    id: number;
    name: string;
    code: string;
    days: { [key: string]: string };
    absentCount: number;
};

export default function Last7DaysAttendance({ type, classId }: Last7DaysAttendanceProps) {
    const [data, setData] = useState<PersonAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [last7Days, setLast7Days] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        fetchData();
    }, [type, classId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let response;
            if (type === "student" && classId) {
                response = await api.get(`/attendance/student-last7days/${classId}`);
            } else {
                response = await api.get("/attendance/employer-last7days");
            }

            // Generate last 7 days dates
            const dates: string[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toISOString().split('T')[0]);
            }
            setLast7Days(dates);

            // Process the new data structure
            const personData: PersonAttendance[] = response.data.map((personData: any) => {
                const person = type === "student" ? personData.student : personData.employer;
                const attendanceRecords = personData.attendanceRecords;

                const personAttendance: PersonAttendance = {
                    id: person.studentId || person.employerId,
                    name: `${person.firstName} ${person.lastName}`,
                    code: person.code,
                    days: {},
                    absentCount: 0
                };

                // Process attendance records
                attendanceRecords.forEach((record: any) => {
                    const recordDate = new Date(record.date).toISOString().split('T')[0];
                    personAttendance.days[recordDate] = record.status;
                    if (record.status === 'ABSENT') {
                        personAttendance.absentCount++;
                    }
                });

                // Fill missing days with PRESENT (no record means PRESENT)
                dates.forEach((date) => {
                    if (!personAttendance.days[date]) {
                        personAttendance.days[date] = 'PRESENT';
                    }
                });

                return personAttendance;
            });

            setData(personData);
        } catch (error) {
            console.error("Error fetching last 7 days attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusCircle = (status: string) => {
        switch (status) {
            case "PRESENT":
                return <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>;
            case "ABSENT":
                return <div className="w-5 h-5 bg-red-500 rounded-full mx-auto"></div>;
            case "LATE":
                return <div className="w-5 h-5 bg-black rounded-full mx-auto"></div>;
            default:
                return <span className="text-gray-400">-</span>;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        return { day, month };
    };

    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-500" />
                <span className="text-gray-600">Loading...</span>
            </div>
        );
    }

    return (
        <div className="w-2/3 m-3 bg-card border border-border rounded-xl shadow-md ">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Attendance History - Last 7 Days
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                    Employee Name
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                    Code
                                </th>
                                {last7Days.map((date) => {
                                    const { day, month } = formatDate(date);
                                    return (
                                        <th key={date} className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-500">{month}</span>
                                                <span className="text-sm font-semibold text-gray-900">{day}</span>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                                    Absent Days
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((person, index) => (
                                <tr
                                    key={person.id}
                                    className={`border-b border-border hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                                        }`}
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                                                {person.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{person.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-600">{person.code}</td>
                                    {last7Days.map((date) => (
                                        <td key={date} className="py-4 px-2 text-center">
                                            {person.days[date] ? getStatusCircle(person.days[date]) : <span className="text-gray-400">-</span>}
                                        </td>
                                    ))}
                                    <td className="py-4 px-4 text-center">
                                        {person.absentCount > 0 ? (
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                                                {person.absentCount}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
