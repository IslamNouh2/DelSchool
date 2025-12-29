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
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import StudentForm from '@/components/forms/StudentForm';

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

const radarData = [
    { subject: 'Math', score: 92, classAvg: 78 },
    { subject: 'English', score: 87, classAvg: 82 },
    { subject: 'Science', score: 95, classAvg: 75 },
    { subject: 'History', score: 84, classAvg: 80 },
    { subject: 'PE', score: 96, classAvg: 85 },
];

const performanceTrend = [
    { month: 'Sep', gpa: 3.5 },
    { month: 'Oct', gpa: 3.6 },
    { month: 'Nov', gpa: 3.8 },
    { month: 'Dec', gpa: 3.9 },
];

const recentActivities = [
    { id: 1, type: 'grade', title: 'Excellent score in Science Final Exam', detail: 'Scored 95/100 - Grade A+', date: '2 days ago', icon: Award, color: 'green' },
    { id: 2, type: 'attendance', title: 'Perfect Attendance - December', detail: '100% attendance for the month', date: '5 days ago', icon: ClipboardCheck, color: 'blue' },
    { id: 3, type: 'payment', title: 'Tuition Fee Payment Received', detail: '$500 paid via Bank Transfer', date: '1 week ago', icon: DollarSign, color: 'purple' },
];

const upcomingEvents = [
    { id: 1, title: 'Math Final Exam', date: 'Dec 28, 2025', time: '9:00 AM' },
    { id: 2, title: 'Parent-Teacher Meeting', date: 'Dec 30, 2025', time: '2:00 PM' },
];

const achievements = [
    { id: 1, title: 'Perfect Attendance', month: 'December 2025', icon: '🎯' },
    { id: 2, title: 'Top Performer - Science', month: 'November 2025', icon: '🏆' },
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
    studentClasses: { Class: { ClassName: string } }[];
    studentAttendance: { status: string }[];
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
                api.get(`payments/student/${id}`),
                api.get(`timetable/student/${id}`)
            ]);

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
    }, [id, fetchData]);

    const handleUpdate = useCallback(async (id: number) => {
        try {
            const response = await api.get(`/student/${id}`);
            const studentData = response.data;
            if (studentData.photoFileName) {
                studentData.photoUrl = `http://localhost:47005/student/photo/${studentData.photoFileName}`;
            }
            setSelectedStudent(studentData);
            setFormType("update");
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching student details:", error);
        }
    }, []);

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate.push('/students')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-gray-900 mb-1">Student Profile</h1>
                        <p className="text-gray-500">Complete student information and performance</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Bell className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={() => handleUpdate(student?.studentId || 0)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                        <Edit className="w-5 h-5" />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="relative h-40 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
                <div className="px-8 pb-8">
                    <div className="flex flex-col lg:flex-row gap-6 -mt-20">
                        <div className="relative">
                            <img src={student?.photoUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200"} alt="Student" className="w-40 h-40 rounded-2xl border-4 border-white object-cover shadow-xl" />
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        <div className="flex-1 pt-4 lg:pt-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div>
                                    <h2 className="text-gray-900 mb-2">{student?.firstName} {student?.lastName}</h2>
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm">{student?.code}</span>
                                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm">{student?.studentClasses?.[0]?.Class?.ClassName || 'No Class'}</span>
                                        <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            Active
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span className="text-sm">{student?.email || 'No Email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span className="text-sm">{student?.phone || 'No Phone'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Born: {new Date(student?.dateOfBirth || '').toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm">{student?.address}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col gap-3">
                                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                                        <Download className="w-4 h-4" />
                                        Report Card
                                    </button>
                                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                                        <Upload className="w-4 h-4" />
                                        Upload Doc
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-gray-200 dark:border-slate-800">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Overall GPA</p>
                                    <p className="text-gray-900">3.9/4.0</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-lg">
                                    <ClipboardCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Attendance</p>
                                    <p className="text-gray-900">{attendance.length > 0 ? `${(attendance.filter(a => a.status === 'PRESENT').length / attendance.length * 100).toFixed(1)}%` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Class Rank</p>
                                    <p className="text-gray-900">3rd of 45</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Fee Status</p>
                                    <p className="text-gray-900">Paid</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Performance Chart */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-gray-900">Academic Performance Trend</h3>
                                    <div className="flex items-center gap-2 text-green-600 text-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>+0.4 GPA</span>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={performanceTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" stroke="#9CA3AF" />
                                        <YAxis domain={[0, 4]} stroke="#9CA3AF" />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="gpa" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Upcoming Events */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-4">Upcoming Events</h3>
                                <div className="space-y-3">
                                    {upcomingEvents.map((event) => (
                                        <div key={event.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <p className="text-gray-900 text-sm mb-1">{event.title}</p>
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                <span>{event.date}</span>
                                                <Clock className="w-3 h-3 ml-1" />
                                                <span>{event.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Subject Performance */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-6">Subject Performance</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={gradeData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="subject" stroke="#9CA3AF" />
                                        <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Skills Radar */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-6">Skills vs Class Average</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#E5E7EB" />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis domain={[0, 100]} />
                                        <Radar name="Student" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.5} />
                                        <Radar name="Class Avg" dataKey="classAvg" stroke="#9CA3AF" fill="#9CA3AF" fillOpacity={0.3} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Activities */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-6">Recent Activities</h3>
                                <div className="space-y-4">
                                    {recentActivities.map((activity) => {
                                        const Icon = activity.icon;
                                        return (
                                            <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                                <div className={`p-2.5 bg-${activity.color}-50 rounded-lg flex-shrink-0`}>
                                                    <Icon className={`w-5 h-5 text-${activity.color}-600`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-900 mb-1">{activity.title}</p>
                                                    <p className="text-gray-500 text-sm">{activity.detail}</p>
                                                </div>
                                                <span className="text-gray-400 text-sm flex-shrink-0">{activity.date}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* Achievements */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-4">Achievements</h3>
                                <div className="space-y-3">
                                    {achievements.map((achievement) => (
                                        <div key={achievement.id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{achievement.icon}</span>
                                                <p className="text-gray-900">{achievement.title}</p>
                                            </div>
                                            <p className="text-gray-600 text-sm">{achievement.month}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {activeTab === 'academics' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-gray-900 mb-6">Academic Records</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-600">Subject</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Exam</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Date</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {grades.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-900">{item.subject.subjectName}</td>
                                            <td className="px-6 py-4 text-gray-900">{item.exam.examName}</td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(item.exam.dateStart).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-sm ${item.grads >= 90 ? 'bg-green-50 text-green-600' : item.grads >= 80 ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                    {item.grads}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'timetable' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-foreground">Weekly Timetable</h3>
                            <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                <Download className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                <span className="text-gray-600 dark:text-slate-400">Download</span>
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-4 bg-accent border border-border text-foreground min-w-[100px]">Time</th>
                                        {DAYS.map(day => <th key={day} className="p-4 bg-accent border border-border text-muted-foreground">{day}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map(slot => (
                                        <tr key={slot.id}>
                                            <td className="p-4 bg-accent border border-border text-foreground text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{slot.label}</span>
                                                </div>
                                            </td>
                                            {DAYS.map(day => {
                                                const entry = timetableMap[`${day}-${slot.id}`];
                                                if (!entry) return <td key={day} className="p-4 border border-border text-center text-muted-foreground">—</td>;
                                                if (entry.subject.subjectName.toLowerCase() === "break") {
                                                    return (
                                                        <td key={day} className="p-4 border border-border">
                                                            <div className="bg-muted rounded-xl py-3 text-center text-muted-foreground font-medium">🍽️ Lunch Break</div>
                                                        </td>
                                                    );
                                                }
                                                const colors = getRandomSubjectColor(entry.subject.subjectName);
                                                return (
                                                    <td key={day} className="p-4 border border-border">
                                                        <div className={`p-4 rounded-xl shadow-sm ${colors.bg}`}>
                                                            <p className={`font-medium mb-1 ${colors.text}`}>{entry.subject.subjectName}</p>
                                                            <p className={`text-sm ${colors.subText}`}>{entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : "—"}</p>
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

                {activeTab === 'attendance' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-gray-900 mb-6">Attendance Calendar</h3>
                            <div className="grid grid-cols-7 gap-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className="text-center text-gray-600 text-sm py-2">{day}</div>
                                ))}
                                {attendance.map((att) => {
                                    const date = new Date(att.date);
                                    const day = date.getDate();
                                    const isPresent = att.status === 'PRESENT';
                                    return (
                                        <div key={att.id} className={`aspect-square flex items-center justify-center rounded-lg text-sm ${isPresent ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} cursor-pointer transition-colors`}>
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-gray-900 mb-6">Summary</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <p className="text-gray-600 text-sm mb-1">Present</p>
                                    <p className="text-gray-900">{attendance.filter(a => a.status === 'PRESENT').length} days</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-xl">
                                    <p className="text-gray-600 text-sm mb-1">Absent</p>
                                    <p className="text-gray-900">{attendance.filter(a => a.status !== 'PRESENT').length} days</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-gray-600 text-sm mb-1">Total Rate</p>
                                    <p className="text-gray-900">{attendance.length > 0 ? `${(attendance.filter(a => a.status === 'PRESENT').length / attendance.length * 100).toFixed(1)}%` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'behavior' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-gray-900 mb-6">Behavior & Conduct</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-gray-900">Participation</h4>
                                    <span className="text-2xl">✨</span>
                                </div>
                                <div className="mb-2">
                                    <div className="w-full bg-green-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">Excellent - 95/100</p>
                            </div>
                            {/* Add more behavior cards here if needed */}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'financial' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-gray-900">Financial Records</h3>
                            <span className="px-4 py-2 bg-green-50 text-green-600 rounded-xl">All Paid</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-600">Date</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Description</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Amount</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Method</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-900">{new Date(payment.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-gray-600">{payment.fee.title}</td>
                                            <td className="px-6 py-4 text-gray-900">${payment.amount}</td>
                                            <td className="px-6 py-4 text-gray-600">{payment.method}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm">
                                                    Paid
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'documents' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-gray-900">Documents & Files</h3>
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <Upload className="w-5 h-5 text-gray-600" />
                                Upload
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Document items */}
                        </div>
                    </motion.div>
                )}
            </div>
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