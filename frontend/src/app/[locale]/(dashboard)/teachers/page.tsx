'use client';

import { useTranslations, useFormatter } from "next-intl";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  TrendingUp,
  LayoutDashboard,
  ClipboardCheck
} from "lucide-react";
import EventCalendar from "@/components/EventCalendar";
import Announcement from "@/components/announcement";
import TimetableCalendar from "@/components/Timetable";
import { useAuth } from "@/components/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import TopStudentsChart from "@/components/TopStudentsChart";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TeacherDashboard = () => {
    const t = useTranslations("dashboard");
    const formatter = useFormatter();
    const now = new Date();
    const { user } = useAuth();

    const [teacherData, setTeacherData] = useState<any>(null);
    const [teacherClass, setTeacherClass] = useState<any>(null);
    const [timetable, setTimetable] = useState<any[]>([]);
    const [topStudents, setTopStudents] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!user?.profileId) return;
            try {
                setLoading(true);
                const [employerRes, classRes, timetableRes] = await Promise.all([
                    api.get(`/employer/${user.profileId}`),
                    api.get(`/employer/teacher-class/${user.profileId}`),
                    api.get(`/timetable/teacher/${user.profileId}`)
                ]);
                setTeacherData(employerRes.data);
                setTeacherClass(classRes.data);
                setTimetable(timetableRes.data);
            } catch (err) {
                console.error("Failed to fetch teacher data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, [user?.profileId]);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            if (!user?.profileId) return;
            try {
                setStatsLoading(true);
                const classParam = selectedClassId === "all" ? "" : `?classId=${selectedClassId}`;
                const topRes = await api.get(`/exam/dashboard/top-students${classParam}`);
                setTopStudents(topRes.data);
            } catch (err) {
                console.error("Failed to fetch performance data", err);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchPerformanceData();
    }, [user?.profileId, selectedClassId]);

    const assignedClasses = useMemo(() => {
        const classesMap = new Map();
        timetable.forEach(item => {
            if (item.Class) {
                classesMap.set(item.Class.classId, item.Class);
            }
        });
        if (teacherClass?.Class) {
            classesMap.set(teacherClass.Class.classId, teacherClass.Class);
        }
        return Array.from(classesMap.values()) as any[];
    }, [timetable, teacherClass]);

    const stats = useMemo(() => {
        if (!teacherData) return [
            { title: t("students") || "Total Students", value: "...", icon: <Users className="w-7 h-7" />, growth: 0, isHighlighted: true },
            { title: "Assigned Classes", value: "...", icon: <LayoutDashboard className="w-7 h-7" />, growth: 0, isHighlighted: false },
            { title: "Weekly Lessons", value: "...", icon: <BookOpen className="w-7 h-7" />, growth: 0, isHighlighted: false },
            { title: t("attendance") || "Attendance", value: "...", icon: <TrendingUp className="w-7 h-7" />, growth: 0, isHighlighted: false },
        ];

        const filteredTimetable = selectedClassId === "all" 
            ? timetable 
            : timetable.filter(item => item.classId === parseInt(selectedClassId));

        const studentCount = selectedClassId === "all"
            ? assignedClasses.reduce((acc, curr) => acc + (curr.NumStudent || 0), 0)
            : assignedClasses.find(c => c.classId === parseInt(selectedClassId))?.NumStudent || 0;

        return [
            { 
                title: t("students") || "Total Students", 
                value: studentCount.toString(), 
                icon: <Users className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: true 
            },
            { 
                title: "Assigned Classes", 
                value: assignedClasses.length.toString(), 
                icon: <LayoutDashboard className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: false 
            },
            { 
                title: "Weekly Lessons", 
                value: `${filteredTimetable.length}h`, 
                icon: <BookOpen className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: false 
            },
            { 
                title: t("attendance") || "Attendance", 
                value: "98%", 
                icon: <TrendingUp className="w-7 h-7" />, 
                growth: 0, 
                isHighlighted: false 
            },
        ];
    }, [teacherData, assignedClasses, timetable, selectedClassId, t]);

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
                        {teacherData ? `${teacherData.firstName} ${teacherData.lastName} - Professional Dashboard` : "Teacher Professional Dashboard"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filter by Class:</span>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="w-[180px] rounded-2xl border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1c2e] font-bold">
                            <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 dark:border-white/5">
                            <SelectItem value="all" className="font-bold">All Classes</SelectItem>
                            {assignedClasses.map((c) => (
                                <SelectItem key={c.classId} value={c.classId.toString()} className="font-bold">
                                    {c.ClassName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <div className="bg-white dark:bg-[#1a1c2e] p-8 rounded-[32px] shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 h-[600px] overflow-hidden flex flex-col">
                        <TimetableCalendar teacherId={user?.profileId} role="TEACHER" readOnly={true} />
                    </div>

                    <div className="h-[400px]">
                        <TopStudentsChart data={topStudents} loading={statsLoading} />
                    </div>
                </div>

                <div className='w-full lg:w-1/3 flex flex-col gap-8'>
                    <div className="bg-[#0052cc] p-8 rounded-[32px] shadow-2xl shadow-blue-500/20 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <ClipboardCheck className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Reminders</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                "Submit grade reports for Grade 10B",
                                "Parent-teacher meeting tomorrow",
                                "Update attendance for today's session"
                            ].map((task, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                                    <p className="text-sm font-bold text-white/90">{task}</p>
                                </div>
                            ))}
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

export default TeacherDashboard;
