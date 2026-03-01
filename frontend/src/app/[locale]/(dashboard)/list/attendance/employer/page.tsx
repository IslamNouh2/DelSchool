"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, Users, CheckCircle, XCircle, Download, 
    Loader2, Save, BarChart as BarChartIcon, Clock, 
    MoreVertical, UserCheck, UserMinus, AlertCircle,
    PieChart as PieChartIcon
} from "lucide-react";
import { 
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/providers/SocketProvider";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OfflineDB, SyncRecord } from "@/lib/db";
import { SyncStatusBadge } from "@/components/pwa/SyncStatusBadge";
import Cookies from "js-cookie";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAuth } from "@/components/contexts/AuthContext";

interface Employer {
    employerId: number;
    firstName: string;
    lastName: string;
    code: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
}

interface AttendanceRecord {
    id: number; // Employer ID
    name: string;
    code: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    checkInTime?: string | null;
    checkOutTime?: string | null;
    configCheckIn?: string | null;
    configCheckOut?: string | null;
    dbId?: number; // Existing record ID
}

export default function EmployerAttendancePage() {
    const { hasPermission } = useAuth();
    const t = useTranslations("attendance.staff");
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
    const [summaryChartData, setSummaryChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [threshold, setThreshold] = useState({ hours: 8, minutes: 10 });
    const [syncQueue, setSyncQueue] = useState<SyncRecord[]>([]);
    const { refreshKey } = useSocket();
    const tenantId = Cookies.get("tenantId") as string;

    const isToday = useMemo(() => {
        return selectedDate === new Date().toISOString().split('T')[0];
    }, [selectedDate]);

    useEffect(() => {
        if (!selectedDate) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Employers & Existing Attendance in parallel
                const [employersRes, existingRes] = await Promise.all([
                    api.get("/attendance/employers"),
                    api.get(`/attendance/employer-existing?date=${selectedDate}`).catch(() => ({ data: [] }))
                ]);

                const employers: Employer[] = employersRes.data;
                const existing = existingRes.data;

                // 3. Get Offline Data
                const queue = await OfflineDB.getSyncQueue(tenantId);
                setSyncQueue(queue);

                // 4. Merge Data
                const mergedData: AttendanceRecord[] = employers.map(e => {
                    const record = existing.find((r: any) => r.employerId === e.employerId);
                    
                    // Possible pending changes: DELETE /attendance/employer/:id or POST /attendance/employer
                    const pendingPost = queue.find((q: SyncRecord) => 
                        q.url === '/attendance/employer' && 
                        q.data?.employerId === e.employerId &&
                        q.data?.date === selectedDate
                    );
                    
                    const isPendingDelete = queue.some((q: SyncRecord) => 
                        q.method === 'DELETE' && 
                        q.url === `/attendance/employer/${record?.id}`
                    );

                    let status = record ? record.status : 'PRESENT';
                    let checkInTime = record?.checkInTime;
                    let dbId = record?.id;

                    if (pendingPost) {
                        status = pendingPost.payload.status;
                        checkInTime = pendingPost.payload.checkInTime;
                    } else if (isPendingDelete) {
                        status = 'PRESENT';
                        checkInTime = null;
                        dbId = undefined;
                    }

                    return {
                        id: e.employerId,
                        name: `${e.firstName} ${e.lastName}`,
                        code: e.code || "N/A",
                        status,
                        checkInTime,
                        checkOutTime: record?.checkOutTime,
                        configCheckIn: e.checkInTime,
                        configCheckOut: e.checkOutTime,
                        dbId
                    };
                });

                setAttendanceData(mergedData);

                // 5. Fetch Chart Data
                const [weeklyRes, summaryRes] = await Promise.all([
                    api.get("/attendance/employer-weekly-chart"),
                    api.get(`/attendance/employer-daily-summary/${selectedDate}`)
                ]);
                setWeeklyChartData(weeklyRes.data);
                setSummaryChartData(summaryRes.data);

                // 6. Fetch Threshold
                const thresholdRes = await api.get("/parameter/Attendance_Late_Threshold").catch(() => null);
                if (thresholdRes?.data?.paramValue) {
                    const [h, m] = thresholdRes.data.paramValue.split(':').map(Number);
                    setThreshold({ hours: isNaN(h) ? 8 : h, minutes: isNaN(m) ? 10 : m });
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    variant: "destructive",
                    title: "Error loading data",
                    description: "Could not fetch employers or attendance."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, refreshKey]);

    const handleAction = async (employerId: number, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', checkInTime?: string) => {
        // Optimistic Update
        setAttendanceData(prev => prev.map(item => 
            item.id === employerId ? { ...item, status, checkInTime: checkInTime || item.checkInTime } : item
        ));

        try {
            // Find if record exists
            const record = attendanceData.find(a => a.id === employerId);
            
            if (record?.dbId) {
                // Update existing or Delete if back to PRESENT (DRAFT state logic)
                // In our backend, PRESENT often means "no record", but let's just use POST/PUT logic.
                await api.delete(`/attendance/employer/${record.dbId}`);
            }

            if (status !== 'PRESENT') {
                await api.post("/attendance/employer", {
                    employerId,
                    date: selectedDate,
                    checkInTime: checkInTime || null,
                    status,
                    academicYear: "2024-2025", // Hardcoded for now, should be dynamic
                });
            }
            
            // Re-fetch existing for this date to get correct dbIds without full page reload
            const exRes = await api.get(`/attendance/employer-existing?date=${selectedDate}`);
            const updatedRecord = exRes.data.find((r: any) => r.employerId === employerId);
            setAttendanceData(prev => prev.map(item => 
                item.id === employerId ? { ...item, dbId: updatedRecord?.id } : item
            ));

        } catch (error) {
            toast({ variant: "destructive", title: "Action failed" });
        }
    };

    const handleCheckIn = (employerId: number) => {
        const emp = attendanceData.find(e => e.id === employerId);
        const now = new Date();
        const checkInIso = now.toISOString();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // Logic: use employer's threshold if available, otherwise global
        let h = threshold.hours;
        let m = threshold.minutes;
        if (emp?.configCheckIn) {
            const [ch, cm] = emp.configCheckIn.split(':').map(Number);
            h = ch;
            m = cm;
        }

        const status = (hours > h || (hours === h && minutes > m)) ? 'LATE' : 'PRESENT';
        handleAction(employerId, status, checkInIso);
    };

    const handleCheckOut = async (employerId: number, dbId: number) => {
        const now = new Date();
        try {
            await api.patch(`/attendance/employer/${dbId}`, {
                checkOutTime: now.toISOString()
            });
            setAttendanceData(prev => prev.map(item => 
                item.id === employerId ? { ...item, checkOutTime: now.toISOString() } : item
            ));
            toast({ title: "Checked out successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Check out failed" });
        }
    };

    // Stats
    const stats = useMemo(() => {
        const total = attendanceData.length;
        const present = attendanceData.filter(e => e.status === 'PRESENT' || e.status === 'LATE').length;
        const absent = attendanceData.filter(e => e.status === 'ABSENT').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        return { total, present, absent, rate };
    }, [attendanceData]);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-8 space-y-10">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                    >
                        {t("title")}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-blue-900 dark:text-blue-100 font-bold text-sm"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t("stats.total_staff"), value: stats.total, icon: Users, color: "blue" },
                    { label: t("stats.present_today"), value: stats.present, icon: CheckCircle, color: "emerald" },
                    { label: t("stats.absent_today"), value: stats.absent, icon: XCircle, color: "rose" },
                    { label: t("stats.success_rate"), value: `${stats.rate}%`, icon: BarChartIcon, color: "indigo" }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500"
                    >
                        <div className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/10 rounded-[1.5rem] w-fit mb-6 group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon className={`w-7 h-7 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{stat.label}</h4>
                        <div className="text-4xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Registry Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Attendance List */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="xl:col-span-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t("registry.title")}</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{t("registry.subtitle")}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-6">
                            <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/20 rounded-full animate-spin border-t-blue-600" />
                            <p className="text-slate-400 font-bold text-lg animate-pulse">{t("loading")}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {attendanceData.map((employer) => (
                                    <motion.div
                                        key={employer.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-14 h-14 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-xl shadow-inner border border-white dark:border-slate-600">
                                                    {employer.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                                                    employer.status === 'PRESENT' ? 'bg-emerald-500' : 
                                                    employer.status === 'LATE' ? 'bg-amber-500' : 
                                                    employer.status === 'ABSENT' ? 'bg-rose-500' : 'bg-slate-400'
                                                }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-slate-900 dark:text-white font-black text-lg">{employer.name}</p>
                                                    {syncQueue.some((q: SyncRecord) => 
                                                        (q.url === '/attendance/employer' && q.data?.employerId === employer.id) ||
                                                        (q.method === 'DELETE' && q.url === `/attendance/employer/${employer.dbId}`)
                                                    ) && <SyncStatusBadge id={employer.id} isPending={true} />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-tighter">{employer.code}</span>
                                                    {employer.checkInTime && (
                                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-400">
                                                            <Clock className="w-2.5 h-2.5 mr-1" />
                                                            {new Date(employer.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-slate-100 dark:bg-slate-800 text-slate-400 border-none">
                                                        {t("registry.shift")}: {employer.configCheckIn || '--:--'} - {employer.configCheckOut || '--:--'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                                            <AnimatePresence mode="wait">
                                                {employer.status === 'PRESENT' && !employer.checkInTime && isToday ? (
                                                    <motion.div
                                                        key="checkin-btn"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                    >
                                                        <Button 
                                                            disabled={!hasPermission('attendance:create')}
                                                            onClick={() => handleCheckIn(employer.id)}
                                                            className={`rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 shadow-lg shadow-blue-500/25 ${!hasPermission('attendance:create') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            Check In
                                                        </Button>
                                                    </motion.div>
                                                ) : employer.checkInTime && !employer.checkOutTime && isToday ? (
                                                    <motion.div
                                                        key="checkout-btn"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                    >
                                                        <Button 
                                                            disabled={!hasPermission('attendance:create')}
                                                            onClick={() => employer.dbId && handleCheckOut(employer.id, employer.dbId)}
                                                            className={`rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 shadow-lg shadow-emerald-500/25 ${!hasPermission('attendance:create') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <Clock className="w-4 h-4 mr-2" />
                                                            {t("registry.check_out")}
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div 
                                                        key="status-badge"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <button 
                                                            disabled={!hasPermission('attendance:create')}
                                                            onClick={() => handleAction(employer.id, 'ABSENT')}
                                                            className={`p-3 rounded-2xl transition-all ${
                                                                employer.status === 'ABSENT' 
                                                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                                                                : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-rose-50'
                                                            } ${!hasPermission('attendance:create') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <UserMinus className="w-5 h-5" />
                                                        </button>
                                                        
                                                        {employer.status !== 'ABSENT' && (
                                                            <div className={`px-4 py-2.5 rounded-2xl font-black text-sm border ${
                                                                employer.status === 'LATE' 
                                                                ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/50' 
                                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50'
                                                            }`}>
                                                                {employer.status}
                                                            </div>
                                                        )}

                                                        <Button 
                                                            disabled={!hasPermission('attendance:create')}
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="rounded-xl"
                                                            onClick={() => handleAction(employer.id, 'PRESENT')}
                                                        >
                                                            <AlertCircle className="w-4 h-4 text-slate-300" />
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                {/* Right Column: Mini Charts & Utils */}
                <div className="space-y-8">
                    {/* Daily Progress Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm"
                    >
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-indigo-500" />
                            {t("charts.daily_distribution")}
                        </h3>
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summaryChartData.length ? summaryChartData : [{ name: 'Empty', value: 1, color: '#f1f5f9' }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {summaryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            {summaryChartData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-bold text-slate-500">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Weekly Insight */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20"
                    >
                        <BarChartIcon className="w-10 h-10 mb-6 text-white/40" />
                        <h3 className="text-2xl font-black mb-2">{t("charts.weekly_trend")}</h3>
                        <p className="text-indigo-100 font-medium text-sm mb-6 leading-relaxed">
                            {t("charts.weekly_subtitle")}
                        </p>
                        <div className="h-[120px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyChartData}>
                                    <Bar dataKey="present" fill="#fff" radius={[4, 4, 4, 4]} barSize={12} fillOpacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <Separator className="my-6 bg-white/10" />
                        <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl h-12">
                            <Download className="w-4 h-4 mr-2" />
                            Full Insight
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
