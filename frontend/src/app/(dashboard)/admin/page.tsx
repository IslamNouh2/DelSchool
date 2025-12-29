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
    const [loading, setLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        try {
            setLoading(true);
            const [studentRes, teacherRes, parentRes, staffRes] = await Promise.allSettled([
                api.get("/student/count"),
                api.get("/teacher/count"),
                api.get("/parent/count"),
                api.get("/staff/count"),
            ]);

            setCounts({
                studentCount: studentRes.status === 'fulfilled' ? studentRes.value.data.total || 0 : 0,
                teacherCount: teacherRes.status === 'fulfilled' ? teacherRes.value.data.total || 0 : 0,
                parentCount: parentRes.status === 'fulfilled' ? parentRes.value.data.total || 0 : 0,
                staffCount: staffRes.status === 'fulfilled' ? staffRes.value.data.total || 0 : 0,
            });
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
        {
            title: "Étudiants",
            value: counts.studentCount,
            icon: GraduationCap,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: "+2.5%",
            trendUp: true
        },
        {
            title: "Enseignants",
            value: counts.teacherCount,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
            trend: "+1.2%",
            trendUp: true
        },
        {
            title: "Parents",
            value: counts.parentCount,
            icon: UserRound,
            color: "text-green-600",
            bg: "bg-green-50",
            trend: "+0.8%",
            trendUp: true
        },
        {
            title: "Personnel",
            value: counts.staffCount,
            icon: Briefcase,
            color: "text-orange-600",
            bg: "bg-orange-50",
            trend: "-0.5%",
            trendUp: false
        }
    ], [counts]);

    return (
        <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <LayoutDashboard className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Admin</h1>
                    </div>
                    <p className="text-gray-500">Bienvenue sur votre espace de gestion scolaire</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="pr-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Aujourd&apos;hui</p>
                        <p className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-4 ${stat.bg} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                <TrendingUp className={`w-3 h-3 ${!stat.trendUp && 'rotate-180'}`} />
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">
                                {loading ? "..." : stat.value}
                            </h3>
                            <p className="text-gray-500 font-medium">{stat.title}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Charts */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Count Chart */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="md:col-span-1 h-[450px]"
                        >
                            <CountChart />
                        </motion.div>
                        {/* Attendance Chart */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="md:col-span-2 h-[450px]"
                        >
                            <AttendanceCharts />
                        </motion.div>
                    </div>

                    {/* Finance Chart */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="h-[500px]"
                    >
                        <FinanceChart />
                    </motion.div>
                </div>

                {/* Right Column - Calendar & Announcements */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-xl">
                                <Calendar className="w-5 h-5 text-orange-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Calendrier</h2>
                        </div>
                        <EventCalendar />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-pink-50 rounded-xl">
                                <Bell className="w-5 h-5 text-pink-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Annonces</h2>
                        </div>
                        <Announcement />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;