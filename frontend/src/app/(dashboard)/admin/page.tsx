'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  GraduationCap, 
  UserRound, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  Bell,
  LayoutDashboard
} from "lucide-react";
import Announcement from "@/components/announcement";
import AttendanceCharts from "@/components/AttendanceCharts";
import CountChart from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import FinanceChart from "@/components/FinanceChart";
import FinanceStats from "@/components/FinanceStats";
import api from "@/lib/api";

interface CountData {
    studentCount: number;
    teacherCount: number;
    parentCount: number;
    staffCount: number;
}

const AdminPage = () => {
    const [counts, setCounts] = useState<CountData>({
        studentCount: 0,
        teacherCount: 0,
        parentCount: 0,
        staffCount: 0,
    });
    const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, late: 0 });
    const [loading, setLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [studentRes, teacherRes, parentRes, staffRes, attendanceRes] = await Promise.allSettled([
                api.get("/student/count"),
                api.get("/teacher/count"),
                api.get("/parent/count"),
                api.get("/staff/count"),
                api.get(`/attendance/global-daily-summary/${today}`)
            ]);

            setCounts({
                studentCount: studentRes.status === 'fulfilled' ? studentRes.value.data.total || 0 : 0,
                teacherCount: teacherRes.status === 'fulfilled' ? teacherRes.value.data.total || 0 : 0,
                parentCount: parentRes.status === 'fulfilled' ? parentRes.value.data.total || 0 : 0,
                staffCount: staffRes.status === 'fulfilled' ? staffRes.value.data.total || 0 : 0,
            });

            if (attendanceRes.status === 'fulfilled') {
                const summary = attendanceRes.value.data;
                const present = summary.find((i: any) => i.name === 'Present')?.value || 0;
                const absent = summary.find((i: any) => i.name === 'Absent')?.value || 0;
                const late = summary.find((i: any) => i.name === 'Late')?.value || 0;
                setAttendanceSummary({ present, absent, late });
            }
        } catch (err) {
            console.error("Failed to fetch counts", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const stats = useMemo(() => [
        { title: "Total Students", value: counts.studentCount, icon: <Users className="w-7 h-7" />, growth: 12, isHighlighted: false },
        { title: "Present Students", value: attendanceSummary.present, icon: <UserRound className="w-7 h-7" />, growth: 8, isHighlighted: true },
        { title: "Absent Students", value: attendanceSummary.absent, icon: <UserRound className="w-7 h-7" />, growth: -2, isHighlighted: false },
        { title: "Late Students Today", value: attendanceSummary.late, icon: <Calendar className="w-7 h-7" />, growth: 5, isHighlighted: false },
    ], [counts, attendanceSummary]);

    return (
        <div className='flex flex-col gap-8'>
            {/* Header / Title Row */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Wednesday 18 February
                    </h2>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">School Dashboard Overview</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <select className="bg-white dark:bg-[#1a1c2e] border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 outline-none shadow-sm dark:shadow-xl focus:ring-2 focus:ring-blue-500/20 transition-all uppercase tracking-wider cursor-pointer hover:border-blue-500/30">
                        <option>All Classes</option>
                    </select>
                    <select className="bg-white dark:bg-[#1a1c2e] border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 outline-none shadow-sm dark:shadow-xl focus:ring-2 focus:ring-blue-500/20 transition-all uppercase tracking-wider cursor-pointer hover:border-blue-500/30">
                        <option>Today</option>
                    </select>
                    <button className="bg-white dark:bg-[#1a1c2e] border border-gray-200 dark:border-white/5 rounded-xl px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#252839] flex items-center gap-2 shadow-sm dark:shadow-xl transition-all uppercase tracking-wider">
                        Download <span className="opacity-50">📊</span>
                    </button>
                    <button className="bg-[#0052cc] text-white rounded-xl px-7 py-2.5 text-xs font-black hover:bg-blue-700 flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all uppercase tracking-widest">
                        <LayoutDashboard className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* User Cards Section */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        className={`${stat.isHighlighted ? 'bg-[#0052cc] shadow-2xl shadow-blue-500/20' : 'bg-white dark:bg-[#1a1c2e] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-xl'} p-6 rounded-[32px] flex items-center justify-between group cursor-pointer transition-all h-[130px]`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${stat.isHighlighted ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>{stat.title}</span>
                            <div className="flex items-baseline gap-2">
                                <h1 className={`text-3xl font-black tracking-tighter ${stat.isHighlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{loading ? "..." : stat.value}</h1>
                                <span className={`text-[10px] font-bold ${stat.isHighlighted ? 'text-white/60' : 'text-blue-500 dark:text-blue-400'}`}>+{stat.growth}%</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.isHighlighted ? 'bg-white/10 text-white' : 'bg-blue-50 dark:bg-blue-500/10 text-[#0052cc] dark:text-blue-400'} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Visuals Section */}
            <div className='flex flex-col lg:flex-row gap-8'>
                {/* Left: Charts Column */}
                <div className='w-full lg:w-2/3 flex flex-col gap-8'>
                    {/* Count and Attendance row */}
                    <div className='flex flex-col md:flex-row gap-8 min-h-[450px]'>
                        <div className='w-full md:w-1/3 min-h-[450px]'>
                            <CountChart />
                        </div>
                        <div className='w-full md:w-2/3 min-h-[450px]'>
                            <AttendanceCharts />
                        </div>
                    </div>
                    
                    {/* Finance Stats Section */}
                    <div className="mt-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 bg-[#0052cc] rounded-full shadow-[0_0_15px_rgba(0,82,204,0.5)]"></div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Aperçu Financier</h2>
                        </div>
                        <FinanceStats />
                    </div>

                    {/* Full width finance chart */}
                    <div className='w-full h-[450px]'>
                        <FinanceChart />
                    </div>
                </div>

                {/* Right: Calendar & Announcements Column */}
                <div className='w-full lg:w-1/3 flex flex-col gap-8'>
                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 transition-all">
                        <EventCalendar />
                    </div>
                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 transition-all">
                        <Announcement />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;