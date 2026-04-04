"use client"
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, FileText, Award,
    ClipboardCheck, DollarSign, User, Users, Heart, Download, Upload,
    TrendingUp, MessageSquare, Bell, Activity, BookOpen, Clock, Target,
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { useParams } from 'next/navigation';
import { useRouter, Link } from "@/i18n/routing";
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import StudentForm from '@/components/forms/StudentForm';
import { useSocket } from '@/providers/SocketProvider';
import AiRiskCard from '@/components/AiRiskCard';

const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'academics', label: 'Academics', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'behavior', label: 'Behavior', icon: Award },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
];

// Mock data for charts (to be replaced with real data aggregation later)
const gradeData = [
    { subject: 'Math', score: 92, previous: 88 },
    { subject: 'English', score: 87, previous: 85 },
    { subject: 'Science', score: 95, previous: 90 },
    { subject: 'History', score: 84, previous: 82 },
    { subject: 'Geography', score: 89, previous: 87 },
    { subject: 'PE', score: 96, previous: 94 },
];



interface Student {
    studentId: number;
    firstName: string;
    lastName: string;
    code: string;
    photoUrl: string | null;
    gender: string;
    address: string;
    dateOfBirth: string;
    phone?: string;
    email?: string;
    health?: string;
    nationality?: string;
    cid?: string;
    lieuOfBirth?: string;
    numNumerisation: string;
    dateInscription: string;
    studentClasses: { Class: { ClassName: string } }[];
    studentAttendance: { status: string }[];
    fatherName: string;
    motherName: string;
    fatherPhone: string;
    motherPhone: string;

}

interface Grade {
    id: number;
    grads: number;
    subject: { subjectName: string };
    exam: { examName: string; dateStart: string };
}

interface Attendance {
    id: number;
    date: string;
    status: string;
}

interface Payment {
    id: number;
    amount: number;
    date: string;
    method: string;
    status: string;
    fee: { title: string };
}

type TimetableEntry = {
    day: string;
    subject: { subjectName: string };
    teacher: { firstName: string; lastName: string } | null;
    timeSlot: { id: number; label: string; startTime: string; endTime: string };
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECT_COLORS = [
    { bg: "bg-blue-50", text: "text-blue-900", subText: "text-blue-700" },
    { bg: "bg-green-50", text: "text-green-900", subText: "text-green-700" },
    { bg: "bg-purple-50", text: "text-purple-900", subText: "text-purple-700" },
];

export default function StudentProfileNew() {
    const navigate = useRouter();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const { refreshKey } = useSocket();

    // Data States
    const [student, setStudent] = useState<Student | null>(null);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [studentRes, gradesRes, attendanceRes, paymentsRes, timetableRes] = await Promise.all([
                api.get(`student/${id}`),
                api.get(`exam/student/${id}`),
                api.get(`attendance/student/${id}/history`),
                api.get(`payments/student/${id}/history`),
                api.get(`timetable/student/${id}`)
            ]);
console.log(studentRes.data);
            setStudent(studentRes.data);
            setGrades(gradesRes.data);
            setAttendance(attendanceRes.data);
            setPayments(paymentsRes.data);
            setTimetableData(timetableRes.data);
        } catch (error) {
            console.error("Error fetching student data:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData, refreshKey]);

    const handleUpdate = useCallback(async (sid: number) => {
        try {
            const response = await api.get(`/student/${sid}`);
            const detail = response.data;
            setSelectedStudent({
                ...detail,
                gender: detail.gender ?? student?.gender,
                bloodType: detail.bloodType ?? student?.bloodType,
                etatCivil: detail.etatCivil ?? student?.etatCivil,
            });
            setFormType("update");
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching student details:", error);
        }
    }, [student]);

    const handleFormSuccess = useCallback(() => {
        fetchData();
        setIsDialogOpen(false);
    }, [fetchData]);

    const timeSlots = Array.from(
        new Map(timetableData.map(t => [t.timeSlot.id, t.timeSlot])).values()
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const timetableMap = timetableData.reduce((acc, entry) => {
        acc[`${entry.day}-${entry.timeSlot.id}`] = entry;
        return acc;
    }, {} as Record<string, TimetableEntry>);

    const subjectColorMap = new Map<string, typeof SUBJECT_COLORS[number]>();

    function getRandomSubjectColor(subjectName: string) {
        if (!subjectColorMap.has(subjectName)) {
            const randomIndex = Math.floor(Math.random() * SUBJECT_COLORS.length);
            subjectColorMap.set(subjectName, SUBJECT_COLORS[randomIndex]);
        }
        return subjectColorMap.get(subjectName)!;
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const studentGrades = grades.length > 0 ? grades.map(g => ({
        subject: g.subject.subjectName.substring(0, 3).toUpperCase(), // Short name for x-axis
        fullSubject: g.subject.subjectName,
        score: g.grads
    })) : gradeData;

    return (
        <div className="flex flex-col gap-6 p-4">
            
            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 mb-6 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm font-medium
                                ${isActive 
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* OVERVIEW TAB CONTENT */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* LEFT MAIN COLUMN (Span 2) */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        {/* 1. Profile Section & Identification */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
                            {/* ID Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{student?.code || 'N/A'}</h2>
                                    <p className="text-sm text-gray-400">Student unique identifier</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 transition-colors text-gray-600 dark:text-gray-400">
                                        <Phone className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 transition-colors text-gray-600 dark:text-gray-400">
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="relative">
                                    <img    
                                        src={student?.photoUrl ? `http://localhost:47005${student.photoUrl}` : "/avatar.png"} 
                                        alt="Student" 
                                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 dark:border-slate-800"
                                    />
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-between items-start">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{student?.firstName} {student?.lastName}</h1>
                                            <p className="text-gray-400 text-sm">Student</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                onClick={() => navigate.push(`/report-card/${student?.studentId}/latest`)} 
                                                variant="outline"
                                                className="rounded-full border-purple-100 text-purple-600 hover:bg-purple-50 gap-2 h-9 px-4 font-bold"
                                            >
                                                <FileText className="w-4 h-4" />
                                                كشف النقاط
                                            </Button>
                                            <button onClick={() => handleUpdate(student?.studentId || 0)} className="p-2 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100 transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">ID</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student?.code}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">Number</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student?.phone || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">Email</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={student?.email}>{student?.email || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">Address</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={student?.address}>{student?.address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                    <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 rounded-full">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{attendance.length} Days</p>
                                        <p className="text-xs text-gray-400">Total Attendance</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                    <div className="p-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                            {attendance.length > 0 ? `${(attendance.filter(a => a.status === 'PRESENT').length)} Days` : '0 Days'}
                                        </p>
                                        <p className="text-xs text-gray-400">Present</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                    <div className="p-2.5 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-full">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                             {attendance.length > 0 ? `${(attendance.filter(a => a.status !== 'PRESENT').length)} Days` : '0 Days'}
                                        </p>
                                        <p className="text-xs text-gray-400">Total Absent</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Student Information Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                            <div className="flex items-start gap-6">                 
                                {/* Student Details Grid */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Registration Number */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Code</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.code || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Birth Date */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Birth date</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.dateOfBirth
                                                ? `${new Date(student.dateOfBirth).toLocaleDateString()} (${Math.floor((new Date().getTime() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old)`
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Lieu de naissance</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.lieuOfBirth || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Gender</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.gender || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Health</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.health || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">N°Carte Id</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.cid || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">nationality</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.nationality || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Admission Date */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Admission date</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.dateInscription ? new Date(student.dateInscription).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>

                                    

                                    {/* Address */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Address</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={student?.address || 'N/A'}>
                                            {student?.address || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Registration Number</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={student?.numNumerisation || 'N/A'}>
                                            {student?.numNumerisation || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Registration Date</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={student?.dateInscription || 'N/A'}>
                                            {student?.dateInscription ? new Date(student.dateInscription).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Phone Number */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Phone number</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {student?.phone || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Personal Email */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Personal email</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={student?.email || 'N/A'}>
                                            {student?.email || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Academic Performance Chart */}
                        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Academic Performance</h3>
                                <button className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                    All <ArrowLeft className="w-3 h-3 rotate-[-90deg]" />
                                </button>
                            </div>
                            
                            {/* Chart Area - Custom Visual to match design */}
                            <div className="relative h-64 w-full">
                                <div className="absolute inset-x-4 inset-y-0 flex items-end justify-between gap-2">
                                    {studentGrades.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-3 rounded-full mb-2 z-10 pointer-events-none whitespace-nowrap">
                                                {(item as any).fullSubject || item.subject} - {item.score}%
                                            </div>
                                            <div className="text-left w-full pl-2 mb-2">
                                                <p className="text-xs text-gray-400 truncate">{item.subject}</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.score} Grade</p>
                                            </div>
                                            {/* Gradient Bar representation */}
                                            <div className="w-full h-40 flex items-end relative">
                                                <div 
                                                    className="w-full bg-gradient-to-t from-cyan-100 to-cyan-400 dark:from-cyan-900/20 dark:to-cyan-500/50 rounded-t-lg transition-all duration-500 hover:to-cyan-500"
                                                    style={{ height: `${item.score}%` }}
                                                ></div>
                                                {/* Dashed line effect */}
                                                <div className="absolute right-0 top-0 bottom-0 w-px bg-dashed border-r border-gray-200 dark:border-slate-700 h-full last:border-r-0"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR COLUMN (Span 1) */}
                    <div className="space-y-6">
                        
                        {/* AI Risk Analysis Card */}
                        <AiRiskCard studentId={Number(id)} />

                        {/* Grades List Only (Assignments Removed) */}
                        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                             <div className="flex items-center justify-between mb-6">
                                 <h3 className="font-bold text-gray-900 dark:text-gray-100">Recent Grades</h3>
                                 <div className="flex gap-2">
                                     <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400"><Calendar className="w-4 h-4"/></button>
                                     <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400"><Users className="w-4 h-4"/></button>
                                 </div>
                             </div>
                             
                             <div className="space-y-5">
                                 <div className="grid grid-cols-4 text-xs text-gray-400 mb-2 px-2">
                                     <div className="col-span-1">Subject</div>
                                     <div className="text-center">Grade</div>
                                     <div className="text-center">Date</div>
                                     <div className="text-right">Status</div>
                                 </div>
                                 
                                 {grades.slice(0, 8).map((row, i) => (
                                     <div key={i} className="grid grid-cols-4 items-center px-2 py-1 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer group">
                                         <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 col-span-1 truncate">{row.subject.subjectName}</div>
                                         <div className="text-center font-bold text-gray-700 dark:text-gray-300 text-sm">{row.grads}</div>
                                         <div className="text-center font-bold text-gray-700 dark:text-gray-300 text-xs">{new Date(row.exam.dateStart).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                                         <div className={`text-right text-xs font-medium ${row.grads >= 80 ? 'text-cyan-400' : 'text-red-400'} flex justify-end items-center gap-2`}>
                                             {row.grads >= 80 ? 'Good' : 'Avg'}
                                             <div className="text-gray-300 group-hover:text-gray-500">⋮</div>
                                         </div>
                                     </div>
                                 ))}
                                 {grades.length === 0 && (
                                     <div className="text-center text-xs text-gray-400 py-4">No grades available</div>
                                 )}
                             </div>
                        </div>

                        {/* Parent's Information */}
                        <div className="bg-pink-50/50 dark:bg-pink-900/10 rounded-[20px] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Parent's Information</h3>
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-500">
                                    <User className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-lg">👩</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{student?.fatherName || 'N/A'}</p>
                                            <p className="text-xs text-gray-400">{student?.fatherPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                        <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-lg">👨</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{student?.motherName || 'N/A'}</p>
                                            <p className="text-xs text-gray-400">{student?.motherPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                        <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        <div className="bg-[#F8F7FF] dark:bg-slate-800/30 rounded-[20px] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Attendance Summary</h3>
                                <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative w-40 h-40 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full border-[12px] border-white dark:border-slate-800 shadow-sm relative overflow-hidden">
                                        {/* CSS Conic Gradient for simplified chart */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: `conic-gradient(#5EEAD4 0% ${attendance.length > 0 ? (attendance.filter(a => a.status === 'PRESENT').length / attendance.length * 100) : 0}%, #EF4444 ${attendance.length > 0 ? (attendance.filter(a => a.status === 'PRESENT').length / attendance.length * 100) : 0}% 100%)`
                                            }}
                                        ></div>
                                        <div className="absolute inset-[12px] bg-[#F8F7FF] dark:bg-slate-900 rounded-full flex flex-col items-center justify-center">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {attendance.length > 0 ? ((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100).toFixed(0) : 0}%
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium">Attendance</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-6 mt-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Present {attendance.filter(a => a.status === 'PRESENT').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Absent {attendance.filter(a => a.status !== 'PRESENT').length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Notice */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-center">Recent Notice</h3>
                            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                                 <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 font-bold">BR</div>
                                         <div>
                                             <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Barney Rojas</p>
                                             <p className="text-xs text-gray-400">English Teacher</p>
                                         </div>
                                     </div>
                                     <button className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1 hover:text-gray-600">
                                         + Comment
                                     </button>
                                 </div>
                                 
                                 <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
                                     <div className="flex justify-between items-center mb-2">
                                         <span className="text-xs font-bold text-cyan-500">Book Fair</span>
                                         <span className="text-[10px] text-gray-400">23, sep, 2025</span>
                                     </div>
                                     <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                         Your education path is an adventure filled with challenges, opportunities, and endless possibilities. Embrace each moment, stay focused.
                                     </p>
                                 </div>
                                 
                                 <div className="flex items-center justify-between text-xs text-gray-500">
                                     <div className="flex items-center gap-3">
                                         <span className="flex items-center gap-1">👍 10</span>
                                         <span className="flex items-center gap-1 text-red-500">❤️ 9</span>
                                     </div>
                                     <span>24 comments</span>
                                 </div>
                                 <div className="flex items-center -space-x-2 mt-3 justify-end">
                                     {[1,2,3].map(i => (
                                         <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-gray-300 dark:bg-slate-600"></div>
                                     ))}
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TIMETABLE TAB */}
            {activeTab === 'timetable' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-foreground">Weekly Schedule</h3>
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                            <Download className="w-4 h-4" /> Download PDF
                        </Button>
                    </div>
                    {/* Timetable Table Logic */}
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 bg-gray-50 dark:bg-slate-800 border-b border-r border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Time</th>
                                    {DAYS.map(day => (
                                        <th key={day} className="p-4 bg-gray-50 dark:bg-slate-800 border-b border-r border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 uppercase tracking-wider last:border-r-0">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map((slot, i) => (
                                    <tr key={slot.id} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/30 dark:bg-slate-800/30'}>
                                        <td className="p-3 border-r border-gray-200 dark:border-slate-800 text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span>{slot.label}</span>
                                            </div>
                                        </td>
                                        {DAYS.map(day => {
                                            const entry = timetableMap[`${day}-${slot.id}`];
                                            if (!entry) return <td key={day} className="p-2 border-r border-gray-200 dark:border-slate-800 last:border-r-0 text-center text-gray-300 dark:text-gray-600 text-xs">—</td>;
                                            
                                            if (entry.subject.subjectName.toLowerCase() === "break") {
                                                return <td key={day} className="p-2 border-r border-gray-200 dark:border-slate-800 last:border-r-0"><div className="w-full h-full bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-gray-500 py-2">☕ Break</div></td>;
                                            }

                                            const colors = getRandomSubjectColor(entry.subject.subjectName);
                                            return (
                                                <td key={day} className="p-2 border-r border-gray-200 dark:border-slate-800 last:border-r-0">
                                                    <div className={`p-3 rounded-xl shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all ${colors.bg}`}>
                                                        <p className={`font-semibold text-xs mb-1 ${colors.text}`}>{entry.subject.subjectName}</p>
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-3 h-3 text-current opacity-60" />
                                                            <p className={`text-[10px] ${colors.subText} truncate`}>{entry.teacher ? `${entry.teacher.firstName.charAt(0)}. ${entry.teacher.lastName}` : "TBA"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}


            {/* ACADEMICS TAB */}
            {activeTab === 'academics' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                    <h3 className="font-semibold text-foreground mb-6">Academic History</h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Exam Name</th>
                                    <th className="px-6 py-4 font-semibold">Subject</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-center">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.length > 0 ? grades.map((grade) => (
                                    <tr key={grade.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{grade.exam.examName}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{grade.subject.subjectName}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(grade.exam.dateStart).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${grade.grads >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                {grade.grads}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No academic records available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-foreground">Attendance History</h3>
                        <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Present: {attendance.filter(a => a.status === 'PRESENT').length}</span>
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Absent: {attendance.filter(a => a.status !== 'PRESENT').length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Day</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length > 0 ? attendance.map((record) => (
                                    <tr key={record.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">No attendance records available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* FINANCIAL TAB */}
            {activeTab === 'financial' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                    <h3 className="font-semibold text-foreground mb-6">Payment History</h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? payments.map((payment) => (
                                    <tr key={payment.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{payment.fee.title}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">${payment.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(payment.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No payment records available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* BEHAVIOR TAB */}
            {activeTab === 'behavior' && (
                <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 text-center">
                    <Award className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No behavior records found.</p>
                    <p className="text-xs text-gray-400 mt-1">N/A</p>
                </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
                <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No documents uploaded.</p>
                    <p className="text-xs text-gray-400 mt-1">N/A</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-2">
                        <Upload className="w-4 h-4" /> Upload Document
                    </Button>
                </div>
            )}
            {isDialogOpen && (
                <StudentForm
                    type={formType}
                    data={selectedStudent}
                    setOpen={setIsDialogOpen}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}