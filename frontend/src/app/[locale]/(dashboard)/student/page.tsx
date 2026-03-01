'use client';

import { useTranslations, useFormatter } from "next-intl";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Star, 
  TrendingUp,
  ClipboardCheck
} from "lucide-react";
import EventCalendar from "@/components/EventCalendar";
import Announcement from "@/components/announcement";
import BigCalender from "@/components/BigCalender";
import { useAuth } from "@/components/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import GradesChart from "@/components/GradesChart";
import { 
  Badge 
} from "@/components/ui/badge";

const StudentDashboard = () => {
    const t = useTranslations("dashboard");
    const formatter = useFormatter();
    const now = new Date();
    const { user } = useAuth();
    
    const [studentData, setStudentData] = useState<any>(null);
    const [grades, setGrades] = useState<any[]>([]);
    const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user?.profileId) return;
            try {
                setLoading(true);
                const [studentRes, gradesRes, examsRes] = await Promise.all([
                    api.get(`/student/${user.profileId}`),
                    api.get(`/exam/student/${user.profileId}`),
                    api.get(`/exam/dashboard/upcoming`)
                ]);
                setStudentData(studentRes.data);
                setGrades(gradesRes.data);
                setUpcomingExams(examsRes.data);
            } catch (err) {
                console.error("Failed to fetch student data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [user?.profileId]);

    const performanceData = useMemo(() => {
        const subjectStats: Record<string, { total: number, count: number }> = {};
        grades.forEach((g: any) => {
            const subjectName = g.subject?.subjectName || "Unknown";
            if (!subjectStats[subjectName]) {
                subjectStats[subjectName] = { total: 0, count: 0 };
            }
            subjectStats[subjectName].total += g.grads;
            subjectStats[subjectName].count += 1;
        });

        return Object.entries(subjectStats).map(([name, stats]) => ({
            subject: name,
            grade: stats.total / stats.count
        }));
    }, [grades]);

    const avgGrade = useMemo(() => {
        if (grades.length === 0) return 0;
        return (grades.reduce((acc: number, curr: any) => acc + curr.grads, 0) / grades.length).toFixed(1);
    }, [grades]);

    const stats = useMemo(() => {
        if (!studentData) return [
            { title: t("present") || "Presence", value: "...", icon: <ClipboardCheck className="w-7 h-7" />, growth: 0, isHighlighted: false },
            { title: "Average Grade", value: "...", icon: <Star className="w-7 h-7" />, growth: 0, isHighlighted: true },
            { title: "Next Exam", value: "...", icon: <Calendar className="w-7 h-7" />, growth: 0, isHighlighted: false },
            { title: "Total Subjects", value: "...", icon: <BookOpen className="w-7 h-7" />, growth: 0, isHighlighted: false },
        ];

        const attendance = studentData.studentAttendance || [];
        const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length;
        const totalAttendance = attendance.length;
        const presenceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

        const nextExamDate = upcomingExams[0]?.dateStart 
            ? formatter.dateTime(new Date(upcomingExams[0].dateStart), { dateStyle: 'medium' })
            : "No exams";
        
        return [
            { 
                title: t("present") || "Presence", 
                value: `${presenceRate}%`, 
                icon: <ClipboardCheck className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: false 
            },
            { 
                title: "Average Grade", 
                value: avgGrade.toString(),
                icon: <Star className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: true 
            },
            { 
                title: "Next Exam", 
                value: nextExamDate,
                icon: <Calendar className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: false 
            },
            { 
                title: "Total Subjects", 
                value: studentData.studentClasses?.[0]?.Class?.subject_local?.length || "8", 
                icon: <BookOpen className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: false 
            },
        ];
    }, [studentData, avgGrade, upcomingExams, t, formatter]);

    return (
        <div className='flex flex-col gap-8 pb-10'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {formatter.dateTime(now, {
                            dateStyle: 'full'
                        })}
                    </h2>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                        {studentData ? `${studentData.firstName} ${studentData.lastName}'s Dashboard` : "Student Portal Dashboard"}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
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
                                <h1 className={`text-2xl font-black tracking-tighter ${stat.isHighlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{loading ? "..." : stat.value}</h1>
                                {stat.growth !== 0 && (
                                    <span className={`text-[10px] font-bold ${stat.isHighlighted ? 'text-white/60' : 'text-blue-500 dark:text-blue-400'}`}>+{stat.growth}%</span>
                                )}
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.isHighlighted ? 'bg-white/10 text-white' : 'bg-blue-50 dark:bg-blue-500/10 text-[#0052cc] dark:text-blue-400'} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className='flex flex-col lg:flex-row gap-8'>
                <div className='w-full lg:w-2/3 flex flex-col gap-8'>
                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 h-[600px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">My Class Schedule</h2>
                        </div>
                        <BigCalender userType="student" userId={user?.profileId} />
                    </div>

                    <div className="h-[450px]">
                        <GradesChart data={performanceData} loading={loading} />
                    </div>
                </div>

                <div className='w-full lg:w-1/3 flex flex-col gap-8'>
                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-[#0052cc] dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Upcoming Exams</h2>
                        </div>
                        <div className="space-y-4">
                            {upcomingExams.length > 0 ? upcomingExams.map((exam: any, i: number) => (
                                <div key={i} className="group p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase text-sm tracking-tight">{exam.examName}</h3>
                                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold border-blue-500/20 text-blue-500 uppercase">{new Date(exam.dateStart).toLocaleDateString()}</Badge>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                        Time: {new Date(exam.dateStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm font-bold text-gray-400 italic">No exams scheduled.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5">
                        <EventCalendar />
                    </div>
                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5">
                        <Announcement />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
