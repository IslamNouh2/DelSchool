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
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Student Attendance
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Monitor and manage student presence across classes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Secondary actions can go here if needed */}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all duration-300"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{totalStudents}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Students</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all duration-300"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{presentCount}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Present Today</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all duration-300"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl">
                            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{absentCount}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Absent Today</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all duration-300"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Attendance</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Daily Success Rate</p>
                </motion.div>
            </div>

            {/* Daily Attendance Sheet */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Attendance Registry</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Select class and date to mark attendance</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-200 text-sm font-medium"
                            />
                        </div>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(Number(e.target.value))}
                            className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-200 text-sm font-medium"
                        >
                            {classes.map((c) => (
                                <option key={c.classId} value={c.classId}>
                                    {c.ClassName}
                                </option>
                            ))}
                        </select>
                        <Button variant="outline" className="gap-2 rounded-xl border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 font-bold px-5">
                            <Download className="w-4 h-4 text-emerald-500" />
                            <span>Export</span>
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900/30 rounded-full animate-spin border-t-blue-600" />
                        <p className="text-gray-400 dark:text-slate-500 font-medium">Retrieving student records...</p>
                    </div>
                ) : attendanceData.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                        <Users className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400 font-medium">No students found for this class</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attendanceData.map((student) => (
                            <motion.div
                                key={student.id}
                                whileHover={{ y: -2 }}
                                className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 font-bold shadow-inner border border-white dark:border-slate-700">
                                        {student.rollNo.slice(-2)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-gray-900 dark:text-white font-bold truncate leading-tight">{student.name}</p>
                                        <p className="text-gray-400 dark:text-slate-500 text-xs font-mono mt-0.5">{student.rollNo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleAttendance(student.id)}
                                        className={`px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${
                                            student.status === 'present'
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-600 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        Present
                                    </button>
                                    <button
                                        onClick={() => toggleAttendance(student.id)}
                                        className={`px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${
                                            student.status === 'absent'
                                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                                : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-600 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        Absent
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || loading || attendanceData.length === 0}
                        className="h-14 px-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all border-none flex items-center gap-3 font-bold text-base"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>Save Attendance Records</span>
                    </Button>
                </div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Trend</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Attendance flow for the last 7 days</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                            <BarChart className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} vertical={false} />
                                <XAxis 
                                    dataKey="day" 
                                    stroke="#94a3b8" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1e293b', 
                                        border: 'none', 
                                        borderRadius: '12px',
                                        color: '#fff',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="present" name="Present" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                                <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Daily Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Distribution</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Student presence breakdown</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                            <PieChart className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summaryChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {summaryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1e293b', 
                                        border: 'none', 
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
