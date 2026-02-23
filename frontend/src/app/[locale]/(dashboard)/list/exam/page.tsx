"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { Plus, Search, Eye, Edit, Trash2, Calendar, BookOpen, TrendingUp, Award, AlertCircle, Download } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { CustomTable } from "@/components/CustomTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { fetchUser } from "@/lib/getRoleFromToken";
import { useSocket } from "@/providers/SocketProvider";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import GradeForm from "@/components/forms/GradeForm";

interface Exam {
  id: number;
  examName: string;
  dateStart: string;
  dateEnd: string;
  publish: boolean;
}

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const { refreshKey } = useSocket();

  // Dashboard state
  const [stats, setStats] = useState({
    averageGrade: 0,
    totalStudents: 0,
    examsCount: 0,
    passRate: 0,
  });
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [prefilledExamId, setPrefilledExamId] = useState<string | undefined>(undefined);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "update">("create");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    examName: "",
    dateStart: "",
    dateEnd: "",
    publish: false,
  });

  useEffect(() => {
    const loadUser = async () => {
      const user = await fetchUser();
      if (user) setRole(user.role);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, perfRes, distRes] = await Promise.all([
        api.get("/exam/dashboard/stats"),
        api.get("/exam/dashboard/subject-performance"),
        api.get("/exam/dashboard/distribution"),
      ]);

      setStats(statsRes.data);
      setSubjectPerformance(perfRes.data);
      setGradeDistribution(distRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, []);

  const fetchExams = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get("/exam", {
        params: {
          page,
          limit: pageSize,
          search: debouncedSearchTerm,
        },
        withCredentials: true,
      });
      setExams(response.data.exams || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      toast.error("Échec du chargement des examens");
    } finally {
      setLoading(false);
    }
  }, [pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchExams(currentPage);
    fetchDashboardData();
  }, [currentPage, fetchExams, fetchDashboardData, refreshKey]);

  const handleAddExam = useCallback(() => {
    setFormType("create");
    setSelectedExam(null);
    setFormData({
      examName: "",
      dateStart: "",
      dateEnd: "",
      publish: false,
    });
    setIsDialogOpen(true);
  }, []);

  const handleEditExam = useCallback((exam: Exam) => {
    setFormType("update");
    setSelectedExam(exam);
    setFormData({
      examName: exam.examName,
      dateStart: exam.dateStart.split("T")[0],
      dateEnd: exam.dateEnd.split("T")[0],
      publish: exam.publish,
    });
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.examName.trim()) {
      toast.error("Veuillez entrer le nom de l'examen");
      return;
    }

    if (!formData.dateStart || !formData.dateEnd) {
      toast.error("Veuillez sélectionner les dates");
      return;
    }

    try {
      const examData = {
        examName: formData.examName.trim(),
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd,
        publish: formData.publish,
      };

      if (formType === "update" && selectedExam) {
        await api.put(`/exam/${selectedExam.id}`, examData, {
          withCredentials: true,
        });
        toast.success("Examen mis à jour avec succès");
      } else {
        await api.post("/exam", examData, {
          withCredentials: true,
        });
        toast.success("Examen créé avec succès");
      }

      setIsDialogOpen(false);
      fetchExams(currentPage);
      fetchDashboardData();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        formType === "update"
          ? "Échec de la mise à jour de l'examen"
          : "Échec de la création de l'examen"
      );
    }
  }, [formData, formType, selectedExam, currentPage, fetchExams, fetchDashboardData]);

  const handleDelete = useCallback(async (examId: number) => {
    try {
      await api.delete(`/exam/${examId}`, { withCredentials: true });
      toast.success("Examen supprimé avec succès");

      const newTotal = totalCount - 1;
      const newTotalPages = Math.ceil(newTotal / pageSize);
      const newPage = currentPage > newTotalPages ? newTotalPages : currentPage;

      fetchExams(Math.max(newPage, 1));
      fetchDashboardData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Échec de la suppression de l'examen");
    }
  }, [totalCount, pageSize, currentPage, fetchExams, fetchDashboardData]);

  const handleTogglePublish = useCallback(async (exam: Exam, checked: boolean) => {
    try {
      await api.patch(
        `/exam/${exam.id}/publish`,
        { publish: checked },
        { withCredentials: true }
      );
      toast.success(
        checked
          ? "Examen publié avec succès"
          : "Examen dépublié avec succès"
      );
      fetchExams(currentPage);
    } catch (error) {
      console.error("Toggle publish error:", error);
      toast.error("Échec de la mise à jour du statut");
    }
  }, [currentPage, fetchExams]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const statsCards = useMemo(() => [
    {
      title: "Moyenne Générale",
      value: `${stats.averageGrade.toFixed(1)}%`,
      change: "+2.3%",
      trend: "up",
      icon: BookOpen,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Étudiants",
      value: stats.totalStudents.toString(),
      change: "+5.2%",
      trend: "up",
      icon: Award,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Taux de Réussite",
      value: `${stats.passRate.toFixed(1)}%`,
      change: "+1.8%",
      trend: "up",
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Total Examens",
      value: stats.examsCount.toString(),
      change: "-3.1%",
      trend: "down",
      icon: AlertCircle,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ], [stats]);

  const columns = useMemo(() => [
    {
      header: "Nom de l'examen",
      key: "examName",
      className: "font-medium text-gray-900 dark:text-slate-100",
    },
    {
      header: "Date début",
      key: "dateStart",
      render: (item: Exam) => new Date(item.dateStart).toLocaleDateString("fr-FR"),
      className: "text-gray-600 dark:text-slate-400",
    },
    {
      header: "Date fin",
      key: "dateEnd",
      render: (item: Exam) => new Date(item.dateEnd).toLocaleDateString("fr-FR"),
      className: "text-gray-600 dark:text-slate-400",
    },
    {
      header: "Statut",
      key: "publish",
      render: (item: Exam) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={item.publish}
            onCheckedChange={(checked) => handleTogglePublish(item, checked)}
            disabled={role?.toLowerCase() !== "admin"}
            className="data-[state=checked]:bg-green-500"
          />
          <span
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              item.publish
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {item.publish ? "Publié" : "Non publié"}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (item: Exam) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setPrefilledExamId(item.id.toString());
              setIsGradeDialogOpen(true);
            }}
            className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors group"
            title="Saisir les notes"
          >
            <Award className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
          </button>
          {role?.toLowerCase() === "admin" && (
            <>
              <button
                onClick={() => handleEditExam(item)}
                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                title="Modifier"
              >
                <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900 dark:text-slate-100">Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500 dark:text-slate-400">
                      Cette action supprimera définitivement cet examen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-800">Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700 text-white">
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      ),
    },
  ], [role, handleTogglePublish, handleEditExam, handleDelete]);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Exams & Results
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage exams and visualize academic performance
                    </p>
                </div>
                {role?.toLowerCase() === "admin" && (
                    <div className="flex flex-wrap items-center gap-3">
                        <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                                >
                                    <Award className="w-5 h-5 text-blue-600" />
                                    <span>Enter Grades</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent 
                                onPointerDownOutside={(e) => e.preventDefault()}
                                className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-3xl bg-white dark:bg-slate-900"
                            >
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                            <Award className="w-6 h-6 text-white" />
                                            Record New Grades
                                        </DialogTitle>
                                        <p className="text-blue-100 mt-1">Enter student results for a specific evaluation</p>
                                    </DialogHeader>
                                </div>
                                <div className="p-6 flex-1 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
                                    <GradeForm 
                                        initialExamId={prefilledExamId}
                                        onSuccess={() => {
                                            setIsGradeDialogOpen(false);
                                            setPrefilledExamId(undefined);
                                            fetchDashboardData();
                                            fetchExams(currentPage);
                                        }} 
                                        onCancel={() => {
                                            setIsGradeDialogOpen(false);
                                            setPrefilledExamId(undefined);
                                        }} 
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            onClick={handleAddExam}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 border-none"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Exam</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 ${stat.bgColor} dark:bg-slate-800/50 rounded-2xl`}>
                                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                            </div>
                            <div
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    stat.trend === "up"
                                        ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>{stat.change}</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{stat.title}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Performance by Subject</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Average</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Success Rate</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} vertical={false} />
                                <XAxis 
                                    dataKey="subject" 
                                    stroke="#94a3b8" 
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: '#fff',
                                        padding: '12px'
                                    }}
                                />
                                <Bar
                                    dataKey="average"
                                    fill="#3b82f6"
                                    radius={[6, 6, 0, 0]}
                                    name="Average"
                                    barSize={24}
                                />
                                <Bar
                                    dataKey="passing"
                                    fill="#10b981"
                                    radius={[6, 6, 0, 0]}
                                    name="Success Rate %"
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Grade Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
                >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Grade Distribution</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={gradeDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} vertical={false} />
                                <XAxis 
                                    dataKey="grade" 
                                    stroke="#94a3b8" 
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: '#fff',
                                        padding: '12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    dot={{ fill: "#6366f1", r: 5, strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by exam name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Exam Table */}
            <CustomTable
                data={exams}
                loading={loading}
                rowKey={(item) => item.id}
                columns={columns}
                footer={
                    !loading && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4">
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                                <span className="text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
                                <span className="text-gray-900 dark:text-white">{totalCount}</span> exams
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="border-gray-200 dark:border-slate-700 dark:text-gray-300 rounded-lg h-9"
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                        {currentPage}
                                    </span>
                                    <span className="text-sm text-gray-400 mx-1">/</span>
                                    <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                                        {totalPages}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="border-gray-200 dark:border-slate-700 dark:text-gray-300 rounded-lg h-9"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )
                }
            />

      {/* Exam Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-slate-100">
              {formType === "create" ? "Ajouter un nouvel examen" : "Modifier l'examen"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="examName" className="text-gray-700 dark:text-slate-300">Nom de l'examen</Label>
              <Input
                id="examName"
                type="text"
                placeholder="Ex: Examen du 1er trimestre"
                value={formData.examName}
                onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                className="mt-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="dateStart" className="text-gray-700 dark:text-slate-300">Date de début</Label>
              <Input
                id="dateStart"
                type="date"
                value={formData.dateStart}
                onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                className="mt-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="dateEnd" className="text-gray-700 dark:text-slate-300">Date de fin</Label>
              <Input
                id="dateEnd"
                type="date"
                value={formData.dateEnd}
                onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                className="mt-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="publish"
                checked={formData.publish}
                onCheckedChange={(checked) => setFormData({ ...formData, publish: checked })}
              />
              <Label htmlFor="publish" className="cursor-pointer text-gray-700 dark:text-slate-300">
                Publier l'examen
              </Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-gray-200 dark:border-slate-800 dark:text-slate-100"
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-white hover:bg-primary/90">
                {formType === "create" ? "Créer" : "Mettre à jour"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}