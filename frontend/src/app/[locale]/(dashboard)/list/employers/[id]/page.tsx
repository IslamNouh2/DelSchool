"use client"
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, FileText, Award,
    ClipboardCheck, DollarSign, User, Users, Heart, Download, Upload,
    TrendingUp, MessageSquare, Bell, Activity, BookOpen, Clock, Target,
    Briefcase, GraduationCap, Shield, Star, Wallet, CreditCard, ChevronRight,
    ExternalLink, Menu, Globe
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import EmployerDialog from "@/components/forms/employerForm";
import { useTranslations } from 'next-intl';

const tabs = [
    { id: 'overview', label: 'profile.tabs.overview', icon: Activity },
    { id: 'personal', label: 'profile.tabs.personal', icon: User },
    { id: 'payroll', label: 'profile.tabs.financial', icon: DollarSign },
    { id: 'attendance', label: 'profile.tabs.attendance', icon: ClipboardCheck },
    { id: 'classes', label: 'profile.tabs.classes', icon: BookOpen },
    { id: 'timetable', label: 'profile.tabs.timetable', icon: Calendar },
];

interface Employer {
    employerId: number;
    firstName: string;
    lastName: string;
    code: string;
    type: string;
    photoFileName: string | null;
    gender: string;
    address: string;
    dateOfBirth: string;
    phone?: string;
    email?: string;
    dateInscription?: string;
    okBlock: boolean;
    carteNationale?: string;
    pereNom?: string;
    mereNom?: string;
    etatSante?: string;
    identifiantScolaire?: string;
    weeklyWorkload?: number;
    salary?: number;
    salaryBasis?: string;
    fatherName?: string;
    motherName?: string;
    nationality?: string;
    health?: string;
    bloodType?: string;
    cid?: string;
    etatCivil?: string;
    compte?: {
        id: number;
        name: string;
        okBlock: boolean;
    };
}

interface TimetableEntry {
    day: string;
    subject: { subjectName: string };
    class: { className: string };
    timeSlot: { id: number; label: string; startTime: string; endTime: string };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECT_COLORS = [
    { bg: "bg-blue-50", text: "text-blue-900", subText: "text-blue-700" },
    { bg: "bg-green-50", text: "text-green-900", subText: "text-green-700" },
    { bg: "bg-purple-50", text: "text-purple-900", subText: "text-purple-700" },
];

export default function EmployerProfile() {
    const navigate = useRouter();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data States
    const [employer, setEmployer] = useState<Employer | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [assignedClass, setAssignedClass] = useState<any>(null);
    const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);
    const t = useTranslations("employers");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                employerRes,
                statsRes,
                payrollRes,
                classRes,
                subjectsRes
            ] = await Promise.all([
                api.get(`employer/${id}`),
                api.get(`attendance/employer/${id}/stats`),
                api.get(`payroll/employer/${id}`),
                api.get(`employer/teacher-class/${id}`),
                api.get(`teacher-subject/${id}`)
            ]);

            setEmployer(employerRes.data);
            setStats(statsRes.data);
            setPayrollHistory(payrollRes.data);
            setAssignedClass(classRes.data);
            setAssignedSubjects(subjectsRes.data);
        } catch (error) {
            console.error("Error fetching employer data:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    const handleUpdate = useCallback(async (id: number) => {
        try {
            const response = await api.get(`/employer/${id}`);
            setSelectedEmployer(response.data);
            setFormType("update");
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching employer details:", error);
        }
    }, []);

    const handleFormSuccess = useCallback(() => {
        fetchData();
        setIsDialogOpen(false);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    const isTeacher = employer?.type === 'teacher';

    return (
        <div className="min-h-screen bg-[#060b18] text-slate-400 pb-20 space-y-8 p-4 md:p-8">
            {/* Main Profile Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl"
            >
                <div className="relative px-8 pt-12 pb-14">
                    <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10">
                        {/* Profile Photo */}
                        <div className="relative">
                            <div className="relative w-40 h-40 rounded-full border-[5px] border-slate-800 bg-slate-900 overflow-hidden">
                                <img 
                                    src={employer?.photoFileName ? `http://localhost:47005/employer/photo/${employer.photoFileName}` : "/avatar.png"} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute bottom-2 right-2 w-8 h-8 border-[6px] border-[#111827] bg-[#10b981] rounded-full shadow-lg"></div>
                        </div>

                        {/* Identity & Actions */}
                        <div className="flex-1 text-center lg:text-left space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-bold tracking-tight text-white">
                                        {employer?.firstName} {employer?.lastName}
                                    </h1>
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                            <Award className="w-3.5 h-3.5" />
                                            {employer?.type || 'Staff'}
                                        </span>
                                        {assignedClass && (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 text-xs font-bold tracking-wide">
                                                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                                {assignedClass.Class?.ClassName}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 text-xs font-bold tracking-wide">
                                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                                            {employer?.address || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    <button className="flex items-center gap-2 px-6 py-3 bg-[#1f2937] hover:bg-slate-800 border border-slate-700/50 text-white rounded-xl transition-all font-bold text-sm">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Message</span>
                                    </button>
                                    <button 
                                        onClick={() => handleUpdate(employer?.employerId || 0)}
                                        className="flex items-center gap-2 px-8 py-3 bg-[#3b82f6] hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 font-bold text-sm"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Ribbon (Bottom of Header) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 bg-transparent">
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-500">Attendance</p>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-white leading-none">{stats?.attendanceRate || 0}%</span>
                                <div className="flex items-center gap-1 text-[#10b981] text-xs font-bold mt-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+0%</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-500">Absent Days</p>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-white leading-none">{stats?.absentDays || 0}</span>
                                <span className="text-xs font-medium text-slate-500 mt-1">This Year</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-500">Net Salary</p>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-white leading-none">${Number(employer?.salary || 0).toLocaleString()}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${payrollHistory[0]?.status === 'PAID' ? 'text-[#10b981]' : 'text-orange-400'}`}>
                                    {payrollHistory[0]?.status === 'PAID' ? 'Paid' : 'Pending'}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-500">{isTeacher ? "Assigned Classes" : "Department"}</p>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-white leading-none">
                                    {isTeacher ? (assignedClass ? "1" : "0") : (employer?.department || "Admin")}
                                </span>
                                <span className="text-xs font-medium text-slate-500 mt-1">{isTeacher ? "Active" : "Department"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-800 px-2">
                <div className="flex gap-10 max-w-7xl mx-auto px-4">
                    {tabs
                        .filter(tab => {
                            if (tab.id === 'classes' || tab.id === 'timetable') return isTeacher;
                            return true;
                        })
                        .map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative py-4 text-sm font-semibold transition-all group ${isActive ? 'text-[#3b82f6]' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t(tab.label) || tab.label}
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabProfile" 
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6]" 
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto space-y-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'payroll' && (
                        <motion.div 
                            key="payroll"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Left Sidebar */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Personal Information Card */}
                                <div className="p-8 bg-[#111827] rounded-[2rem] border border-slate-800 relative group">
                                    <button className="absolute top-8 right-8 text-[#3b82f6]">
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-xl font-bold text-white mb-8">Personal Information</h3>
                                    <div className="space-y-6">
                                        {[
                                            { label: "Date of Birth", value: employer?.dateOfBirth ? new Date(employer.dateOfBirth).toLocaleDateString() : 'N/A', icon: Calendar },
                                            { label: "Phone Number", value: employer?.phone || 'N/A', icon: Phone },
                                            { label: "Nationality", value: employer?.nationality || 'N/A', icon: Globe },
                                            { label: "Address", value: employer?.address || 'N/A', icon: MapPin },
                                        ].map((item) => (
                                            <div key={item.label} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0">
                                                    <item.icon className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-sm font-bold text-white whitespace-pre-line">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Emergency Contact Card */}
                                <div className="p-8 bg-[#111827] rounded-[2rem] border border-slate-800 relative">
                                    <h3 className="text-lg font-bold text-white mb-6">Emergency Contact</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase">
                                            {employer?.fatherName?.substring(0, 2) || 'EC'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold">{employer?.fatherName || 'Not Set'}</p>
                                            <p className="text-xs text-slate-500 font-medium">Relative</p>
                                        </div>
                                        <button className="p-2 text-[#3b82f6]">
                                            <Phone className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Finance Account Card (Blue Card) */}
                                <div className="p-8 bg-[#2563eb] rounded-[2rem] text-white space-y-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                                    <h3 className="text-lg font-bold">Finance Account</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-white/70">Linked Account</p>
                                            <p className="font-bold flex items-center gap-2">
                                                {employer?.compte?.name || 'No Linked Account'} 
                                            </p>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-xs font-medium text-white/70">Annual Salary</p>
                                            <p className="text-4xl font-black">${Number(employer?.salary || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-white/60 mt-2 font-medium">Monthly payout based on attendance</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Top Row Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: "Academic Year", val: "2023-2024", icon: Calendar, color: "blue" },
                                        { label: "Designation", val: employer?.type || 'Staff', icon: Award, color: "purple" },
                                        { label: "Salary Basis", val: employer?.salaryBasis || 'Monthly', icon: FileText, color: "orange" },
                                    ].map((item) => (
                                        <div key={item.label} className="p-6 bg-[#111827] rounded-2xl border border-slate-800 flex items-center gap-4">
                                            <div className={`p-3 rounded-xl bg-${item.color}-500/10`}>
                                                <item.icon className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                                                <p className="text-white font-bold">{item.val}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Payroll History Table */}
                                <div className="bg-[#111827] rounded-[2rem] border border-slate-800 overflow-hidden">
                                    <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">Payroll History</h3>
                                        <div className="flex items-center gap-3">
                                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-bold text-xs border border-slate-700/50">
                                                <Menu className="w-3.5 h-3.5" />
                                                Filter
                                            </button>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-bold text-xs border border-slate-700/50">
                                                <Download className="w-3.5 h-3.5" />
                                                Download Report
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-transparent border-b border-slate-800/50">
                                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Month</th>
                                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Base Salary</th>
                                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Deductions</th>
                                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Tax</th>
                                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Net Salary</th>
                                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {payrollHistory.length > 0 ? payrollHistory.map((row, i) => (
                                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                                                        <td className="px-8 py-5 font-bold text-white text-sm">
                                                            {new Date(row.period_start).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-8 py-5 font-bold text-white text-sm text-right">${Number(row.baseSalary).toLocaleString()}</td>
                                                        <td className={`px-8 py-5 font-bold text-sm text-right ${Number(row.deductions) > 0 ? 'text-red-400' : 'text-white'}`}>
                                                            -${Number(row.deductions).toLocaleString()}
                                                        </td>
                                                        <td className="px-8 py-5 font-bold text-white text-sm text-right">-$0.00</td>
                                                        <td className="px-8 py-5 font-bold text-white text-sm text-right">${Number(row.netSalary).toLocaleString()}</td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded bg-${row.status === 'PAID' ? 'green' : row.status === 'APPROVED' ? 'blue' : 'orange'}-500/10 text-${row.status === 'PAID' ? 'green' : row.status === 'APPROVED' ? 'blue' : 'orange'}-400 text-[10px] font-black uppercase tracking-widest`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-medium">
                                                            No payroll records found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button className="w-full py-4 text-xs font-bold text-slate-500 hover:text-white transition-all border-t border-slate-800">
                                        View All Transactions →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'overview' && (
                        <motion.div 
                            key="overview" 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="bg-[#111827] border border-slate-800 rounded-[2.5rem] overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Performance Overview</h3>
                                        <p className="text-slate-500 font-medium mt-1">Attendance consistency over the last 30 days</p>
                                    </div>
                                    <div className="px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-400/20">
                                        <span className="text-sm font-bold text-blue-400">{stats?.attendanceRate || 0}% Completion</span>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats?.records?.slice(0, 15).reverse().map((r: any) => ({
                                            date: new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                                            status: r.status === 'PRESENT' ? 100 : r.status === 'LATE' ? 50 : 0
                                        }))}>
                                            <defs>
                                                <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                            <XAxis 
                                                dataKey="date" 
                                                stroke="#475569" 
                                                fontSize={10} 
                                                fontWeight="bold" 
                                                axisLine={false} 
                                                tickLine={false} 
                                            />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px' }}
                                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="status" 
                                                stroke="#3b82f6" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#colorStatus)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'personal' && (
                        <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center bg-[#111827] border border-slate-800 rounded-[3rem]">
                            <User className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-white">Detailed Personal Data</h3>
                            <p className="text-slate-500 mt-2 font-medium">Coming soon with more details</p>
                        </motion.div>
                    )}

                     {activeTab === 'attendance' && (
                        <motion.div 
                            key="attendance" 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="space-y-6"
                        >
                            <div className="bg-[#111827] border border-slate-800 rounded-[2rem] overflow-hidden">
                                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Attendance Logs</h3>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                            <span className="text-xs font-bold text-slate-300">Present: {stats?.presentDays || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <span className="text-xs font-bold text-slate-300">Absent: {stats?.absentDays || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-800/50">
                                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Day</th>
                                                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {stats?.records?.length > 0 ? stats.records.map((record: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-white text-sm">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-5 text-slate-400 text-sm font-medium">
                                                        {new Date(record.date).toLocaleDateString('default', { weekday: 'long' })}
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                            record.status === 'PRESENT' ? 'bg-[#10b981]/10 text-[#10b981]' : 
                                                            record.status === 'ABSENT' ? 'bg-red-400/10 text-red-400' : 
                                                            'bg-orange-400/10 text-orange-400'
                                                        }`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-20 text-center text-slate-500 font-medium">
                                                        No attendance records found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'classes' && (
                        <motion.div 
                            key="classes" 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {assignedClass ? (
                                <div className="p-8 bg-[#111827] border border-slate-800 rounded-[2rem] flex flex-col gap-6 group hover:border-[#3b82f6]/50 transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <GraduationCap className="w-8 h-8 text-[#3b82f6]" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned Class</h4>
                                        <h3 className="text-2xl font-black text-white">{assignedClass.Class?.ClassName}</h3>
                                        <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-red-500/50" />
                                            {assignedClass.Class?.local?.name || 'Main Hall'}
                                        </p>
                                    </div>
                                    <div className="pt-6 border-t border-slate-800 flex items-center justify-between mt-auto">
                                        <span className="text-xs font-bold text-slate-500">AY: 2023-2024</span>
                                        <span className="text-xs font-bold text-[#3b82f6] uppercase tracking-tighter">Current Class</span>
                                    </div>
                                </div>
                            ) : (
                                !isTeacher && (
                                    <div className="col-span-full p-20 text-center bg-[#111827] border border-slate-800 rounded-[3rem]">
                                        <Users className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                                        <h3 className="text-xl font-black text-white">No Assigned Classes</h3>
                                        <p className="text-slate-500 mt-2 font-medium">This employer is not currently assigned to any classes.</p>
                                    </div>
                                )
                            )}

                            {assignedSubjects?.map((sub: any, idx: number) => (
                                <div key={idx} className="p-8 bg-[#111827] border border-slate-800 rounded-[2rem] flex flex-col gap-6 group hover:border-purple-500/50 transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                        <BookOpen className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned Subject</h4>
                                        <h3 className="text-2xl font-black text-white">{sub.subject?.subjectName}</h3>
                                        <p className="text-slate-400 mt-2 font-medium">Full Subject Course</p>
                                    </div>
                                    <div className="pt-6 border-t border-slate-800 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Active Semester</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'timetable' && (
                        <motion.div 
                            key="timetable" 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="p-20 text-center bg-[#111827] border border-slate-800 rounded-[3rem]"
                        >
                            <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-white">Class Schedule</h3>
                            <p className="text-slate-500 mt-2 font-medium">Detailed weekly timetable coming soon.</p>
                            <div className="mt-8">
                                <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    Coming in Beta 2.0
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {isDialogOpen && (
                <EmployerDialog
                    type={formType}
                    data={selectedEmployer}
                    onOpenChange={setIsDialogOpen}
                    open={isDialogOpen}
                    onSuccess={handleFormSuccess}
                    hideButton={true}
                />
            )}
        </div>
    );
}
