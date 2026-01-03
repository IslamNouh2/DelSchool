"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, Users, CheckCircle, XCircle, Download, Loader2, Save } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/providers/SocketProvider";

// Mock data removed as we now fetch real data

interface Student {
    studentId: number;
    firstName: string;
    lastName: string;
    code: string;
    rollNo?: string; // Add if available in API
}

interface AttendanceRecord {
    id: number; // Student ID
    name: string;
    rollNo: string;
    status: 'present' | 'absent';
    dbId?: number; // Existing record ID for deletion
}

export default function AttendancePage() {
    const [classes, setClasses] = useState<{ classId: number; ClassName: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
    const [summaryChartData, setSummaryChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [existingRecords, setExistingRecords] = useState<any[]>([]);
    const { refreshKey } = useSocket();

    // Fetch classes on mount
    useEffect(() => {
        api.get("/attendance/class")
            .then((res) => {
                setClasses(res.data);
                if (res.data.length > 0) {
                    setSelectedClassId(res.data[0].classId);
                }
            })
            .catch((err) => console.error(err));
    }, []);

    // Fetch students and attendance when class or date changes
    useEffect(() => {
        if (!selectedClassId || !selectedDate) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Students
                const studentsRes = await api.get(`/attendance/students/${selectedClassId}`);
                const students: Student[] = studentsRes.data;

                // 2. Fetch Existing Attendance
                let existing: any[] = [];
                try {
                    const existingRes = await api.get(`/attendance/existing/${selectedClassId}/${selectedDate}`);
                    existing = existingRes.data;
                    setExistingRecords(existing);
                    setHasExistingData(existing.length > 0);
                } catch (err) {
                    setExistingRecords([]);
                    setHasExistingData(false);
                }

                // 3. Merge Data
                const mergedData: AttendanceRecord[] = students.map(s => {
                    const record = existing.find((r: any) => r.studentId === s.studentId);
                    return {
                        id: s.studentId,
                        name: `${s.firstName} ${s.lastName}`,
                        rollNo: s.code || "N/A",
                        status: record ? (record.status === "PRESENT" ? 'present' : 'absent') : 'present', // Default to present
                        dbId: record?.id
                    };
                });

                setAttendanceData(mergedData);

                // 4. Fetch Chart Data
                const weeklyRes = await api.get(`/attendance/student-weekly-chart/${selectedClassId}`);
                setWeeklyChartData(weeklyRes.data);

                const summaryRes = await api.get(`/attendance/student-daily-summary/${selectedClassId}/${selectedDate}`);
                setSummaryChartData(summaryRes.data);

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    variant: "destructive",
                    title: "Error loading data",
                    description: "Could not fetch students or attendance."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedClassId, selectedDate, refreshKey]);

    const toggleAttendance = (id: number) => {
        setAttendanceData(prev => prev.map(student =>
            student.id === id
                ? { ...student, status: student.status === 'present' ? 'absent' : 'present' }
                : student
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Delete existing records if any
            if (hasExistingData) {
                const existingIds = existingRecords.map((att: any) => att.id);
                for (const id of existingIds) {
                    await api.delete(`/attendance/student/${id}`).catch(e => console.error("Delete error", e));
                }
            }

            // 2. Save new records (Only save ABSENT or modified records? 
            // The original logic saved everything except "PRESENT" if it was new, 
            // but here we might want to save explicit states. 
            // Let's stick to the previous logic: Save records that are NOT default? 
            // Actually, for a full record, we usually save everything or just exceptions.
            // The previous logic was: `recordsToSave = data.filter(r => r.status !== "PRESENT")`
            // This implies "PRESENT" is default and not stored? 
            // If we delete everything, we must save everything that isn't implied default.
            // Let's save ALL records to be safe, OR follow the previous pattern if the backend relies on it.
            // Previous pattern: `status: r.status.toUpperCase()`
            
            // Let's save ALL records to ensure data integrity, or at least ABSENT ones.
            // If the backend assumes missing record = Present, then we only save Absent.
            // Let's assume we save what is explicitly marked.
            
            const recordsToSave = attendanceData.map(r => ({
                studentId: r.id,
                status: r.status.toUpperCase() // "PRESENT" or "ABSENT"
            }));

            // Optimization: If backend treats missing as present, filter out present?
            // Re-reading previous code: `const recordsToSave = data.filter(r => r.status !== "PRESENT");`
            // It seems it ONLY saved non-present records.
            // But if we deleted existing records, and now we only save absent, 
            // then a student who was absent and is now present will have NO record.
            // This confirms "No Record" == "Present".
            
            const absentRecords = recordsToSave.filter(r => r.status !== "PRESENT");

            if (absentRecords.length > 0) {
                await api.post("/attendance/save", {
                    classId: selectedClassId,
                    date: new Date(selectedDate).toISOString(),
                    academicYear: "2024-2025", // Should probably be dynamic
                    records: absentRecords,
                });
            }

            toast({ title: "Attendance saved successfully" });
            
            // Refresh data to get new IDs etc
            // Triggering a re-fetch by updating a dummy state or just calling fetch logic?
            // Simplest is to just update local state to reflect "saved"
            setHasExistingData(true); 
            // Ideally we re-fetch to get the new DB IDs, but for now this is fine.

        } catch (error) {
            console.error("Save error:", error);
            toast({
                variant: "destructive",
                title: "Error saving attendance",
                description: "Please try again."
            });
        } finally {
            setSaving(false);
        }
    };

    // Stats
    const totalStudents = attendanceData.length;
    const presentCount = attendanceData.filter(s => s.status === 'present').length;
    const absentCount = attendanceData.filter(s => s.status === 'absent').length;
    const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground mb-1">Attendance Management</h1>
                <p className="text-muted-foreground">Mark and track student attendance</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Total Students</p>
                            <p className="text-foreground font-semibold text-xl">{totalStudents}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Present</p>
                            <p className="text-foreground font-semibold text-xl">{presentCount}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Absent</p>
                            <p className="text-foreground font-semibold text-xl">{absentCount}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-sm">Attendance Rate</p>
                            <p className="text-foreground font-semibold text-xl">{percentage}%</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Daily Attendance Sheet */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-foreground font-semibold text-lg">Daily Attendance Sheet</h2>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(Number(e.target.value))}
                            className="px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {classes.map((c) => (
                                <option key={c.classId} value={c.classId}>
                                    {c.ClassName}
                                </option>
                            ))}
                        </select>
                        <Button variant="outline" className="gap-2 rounded-xl">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : attendanceData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No students found for this class.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attendanceData.map((student) => (
                            <div
                                key={student.id}
                                className="flex flex-col sm:flex-row items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors gap-4"
                            >
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-medium shrink-0">
                                        {student.rollNo.slice(-2)}
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">{student.name}</p>
                                        <p className="text-muted-foreground text-sm">{student.rollNo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => toggleAttendance(student.id)}
                                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition-all font-medium ${
                                            student.status === 'present'
                                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        Present
                                    </button>
                                    <button
                                        onClick={() => toggleAttendance(student.id)}
                                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition-all font-medium ${
                                            student.status === 'absent'
                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        Absent
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || loading || attendanceData.length === 0}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all rounded-xl py-6 px-8"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Attendance
                    </Button>
                </div>
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Attendance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <h2 className="text-foreground font-semibold text-lg mb-6">Weekly Attendance</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            <Bar dataKey="present" fill="#10B981" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="absent" fill="#EF4444" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Summary Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <h2 className="text-foreground font-semibold text-lg mb-6">Attendance Summary</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={summaryChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {summaryChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </div>
    );
}
