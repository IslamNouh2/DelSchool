"use client"
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, FileText, Award,
    ClipboardCheck, DollarSign, User, Users, Heart, Download, Upload,
    TrendingUp, MessageSquare, Bell, Activity, BookOpen, Clock, Target,
    Briefcase, GraduationCap
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import EmployerDialog from "@/components/forms/employerForm";

const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
];

// Mock data for charts
const performanceTrend = [
    { month: 'Sep', rating: 4.5 },
    { month: 'Oct', rating: 4.6 },
    { month: 'Nov', rating: 4.8 },
    { month: 'Dec', rating: 4.9 },
];

const workloadData = [
    { subject: 'Math 101', hours: 12 },
    { subject: 'Math 202', hours: 10 },
    { subject: 'Physics', hours: 8 },
    { subject: 'Mentoring', hours: 5 },
];

const recentActivities = [
    { id: 1, type: 'class', title: 'Completed Math 101 Syllabus', detail: 'Chapter 12: Calculus finished', date: '2 days ago', icon: BookOpen, color: 'blue' },
    { id: 2, type: 'attendance', title: 'Perfect Attendance - December', detail: '100% attendance for the month', date: '5 days ago', icon: ClipboardCheck, color: 'green' },
    { id: 3, type: 'payment', title: 'Salary Credited', detail: 'December Salary processed', date: '1 week ago', icon: DollarSign, color: 'purple' },
];

const upcomingEvents = [
    { id: 1, title: 'Staff Meeting', date: 'Dec 28, 2025', time: '9:00 AM' },
    { id: 2, title: 'Parent-Teacher Conference', date: 'Dec 30, 2025', time: '2:00 PM' },
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
    const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const employerRes = await api.get(`employer/${id}`);
            setEmployer(employerRes.data);
            
            // Mock timetable fetch - replace with real API when available
            // const timetableRes = await api.get(`timetable/teacher/${id}`);
            // setTimetableData(timetableRes.data);
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
            const employerData = response.data;
            setSelectedEmployer(employerData);
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
                    <button onClick={() => navigate.push('/list/employers')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-gray-900 mb-1">Staff Profile</h1>
                        <p className="text-gray-500">Manage staff information and performance</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Bell className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={() => handleUpdate(employer?.employerId || 0)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                        <Edit className="w-5 h-5" />
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="relative h-40 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
                <div className="px-8 pb-8">
                    <div className="flex flex-col lg:flex-row gap-6 -mt-20">
                        <div className="relative">
                            <img 
                                src={employer?.photoFileName ? `http://localhost:47005/employer/photo/${employer.photoFileName}` : "/avatar.png"} 
                                alt="Employer" 
                                className="w-40 h-40 rounded-2xl border-4 border-white object-cover shadow-xl" 
                            />
                            <div className={`absolute bottom-2 right-2 w-5 h-5 border-2 border-white rounded-full ${employer?.okBlock ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        </div>

                        <div className="flex-1 pt-4 lg:pt-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div>
                                    <h2 className="text-gray-900 mb-2">{employer?.firstName} {employer?.lastName}</h2>
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm">{employer?.code}</span>
                                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm capitalize">{employer?.type}</span>
                                        <span className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${employer?.okBlock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            <div className={`w-2 h-2 rounded-full ${employer?.okBlock ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                            {employer?.okBlock ? 'Blocked' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span className="text-sm">{employer?.email || 'No Email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span className="text-sm">{employer?.phone || 'No Phone'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Joined: {employer?.dateInscription ? new Date(employer.dateInscription).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm">{employer?.address || 'No Address'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col gap-3">
                                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                                        <Download className="w-4 h-4" />
                                        Export Info
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
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Experience</p>
                                    <p className="text-gray-900">5 Years</p>
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
                                    <p className="text-gray-900">98%</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Students</p>
                                    <p className="text-gray-900">120+</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-lg">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Rating</p>
                                    <p className="text-gray-900">4.8/5.0</p>
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
                                    <h3 className="text-gray-900">Performance Rating</h3>
                                    <div className="flex items-center gap-2 text-green-600 text-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>+0.2</span>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={performanceTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" stroke="#9CA3AF" />
                                        <YAxis domain={[0, 5]} stroke="#9CA3AF" />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="rating" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Upcoming Events */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-4">Upcoming Schedule</h3>
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
                            {/* Workload Distribution */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-gray-900 mb-6">Workload Distribution (Hours/Week)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={workloadData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="subject" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip />
                                        <Bar dataKey="hours" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Recent Activities */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
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
                        </div>
                    </>
                )}

                {activeTab === 'classes' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-gray-900 mb-6">Assigned Classes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Mathematics 101</h4>
                                            <p className="text-sm text-gray-500">Class 10-A</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>30 Students</span>
                                        <span>4 Hours/Week</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'timetable' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-center h-64 text-gray-500 flex-col gap-2">
                            <Calendar className="w-10 h-10 opacity-20" />
                            <p>Timetable integration coming soon</p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'attendance' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-gray-900">Attendance Record</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Present (95%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Absent (5%)</span>
                                </div>
                            </div>
                        </div>
                        {/* Placeholder for calendar/list */}
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">Detailed attendance log will be displayed here.</p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'financial' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-gray-900">Payroll & Financials</h3>
                            {employer?.compte ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-sm font-medium">Linked Account: {employer.compte.name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-sm font-medium">No Financial Account Linked</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-600">Month</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Date</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Amount</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-left text-gray-600">Slip</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {[1, 2, 3].map((i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-900">December 2025</td>
                                            <td className="px-6 py-4 text-gray-600">Dec 25, 2025</td>
                                            <td className="px-6 py-4 text-gray-900">$3,500.00</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm">Paid</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-blue-600 hover:underline text-sm">Download</button>
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
                            <h3 className="text-gray-900">Documents</h3>
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <Upload className="w-5 h-5 text-gray-600" />
                                Upload
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Contract.pdf', 'ID_Card.jpg', 'Resume.pdf'].map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <span className="text-gray-900 font-medium">{doc}</span>
                                    </div>
                                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                                        <Download className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
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
