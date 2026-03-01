"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  GraduationCap,
  ChevronLeft,
  Save,
  Loader2,
  Search,
  Filter,
  Download,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { CustomTable } from "@/components/CustomTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ComboboxDemo } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/providers/SocketProvider";
import { OfflineDB } from "@/lib/db";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAuth } from "@/components/contexts/AuthContext";

export type GradeRow = {
  studentId: number;
  studentCode: string;
  studentName: string;
  subjects: {
    subjectName: string;
    grade: number | null;
    subjectId: number;
  }[];
};

function ExamGradesContent() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examIdParam = searchParams.get("examId");
  const { refreshKey } = useSocket();

  const [classes, setClasses] = useState<{ classId: number; ClassName: string }[]>([]);
  const [exams, setExams] = useState<{ id: number; examName: string }[]>([]);
  const [formData, setFormData] = useState({
    id: examIdParam ? parseInt(examIdParam) : 0,
    classId: 0,
  });
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedExamsName, setSelectedExamsName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch exams on mount
  useEffect(() => {
    api.get("/exam/exams")
      .then((res) => setExams(res.data))
      .catch((err) => console.error(err));
  }, [refreshKey]);

  // ✅ Fetch classes when exam changes
  useEffect(() => {
    if (formData.id > 0) {
      api.get(`/class`)
        .then((res) => setClasses(res.data.classes))
        .catch((err) => console.error(err));
      
      const selected = exams.find(e => e.id === formData.id);
      if (selected) setSelectedExamsName(selected.examName);
    } else {
      setClasses([]);
      setFormData((prev) => ({ ...prev, classId: 0 }));
      setSelectedExamsName("");
    }
  }, [formData.id, exams, refreshKey]);

  // ✅ Fetch grades when class or exam changes
  useEffect(() => {
    if (formData.classId > 0 && formData.id > 0) {
      fetchGrads();
    } else {
      setGrades([]);
      setSubjects([]);
    }
  }, [formData.classId, formData.id, refreshKey]);

  const fetchGrads = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/exam/subjects/${formData.classId}/${formData.id}`);
      let serverGrades: GradeRow[] = res.data;

      // Merge offline data
      const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';
      const queue = await OfflineDB.getSyncQueue(tenantId);
      const pendingGrades = queue.filter(item => 
        (item.entity === 'exam' && item.url.includes('grades')) &&
        item.data.classId === formData.classId &&
        item.data.examId === formData.id
      );

      let mergedGrades = [...serverGrades];

      pendingGrades.forEach(item => {
        const itemGrades = item.data.grades;
        itemGrades.forEach((pg: any) => {
          const studentIndex = mergedGrades.findIndex(sg => sg.studentId === pg.studentId);
          if (studentIndex !== -1) {
            const subjectIndex = mergedGrades[studentIndex].subjects.findIndex(s => s.subjectId === pg.subjectId);
            if (subjectIndex !== -1) {
              mergedGrades[studentIndex].subjects[subjectIndex].grade = pg.grade;
              // we might want a flag for the specific cell, but for now we'll just merge
            }
          }
        });
      });

      setGrades(mergedGrades);
      if (mergedGrades.length > 0) {
        const allSubjects = mergedGrades[0].subjects.map((s: any) => s.subjectName);
        setSubjects(allSubjects);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: number, subjectId: number, newGrade: number) => {
    setGrades((prev) =>
      prev.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              subjects: row.subjects.map((subj) =>
                subj.subjectId === subjectId ? { ...subj, grade: newGrade } : subj
              ),
            }
          : row
      )
    );
  };

  const handleSaveAll = async () => {
    if (grades.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        classId: formData.classId,
        examId: formData.id,
        grades: grades.flatMap((row) =>
          row.subjects
            .filter((s) => s.grade !== null && s.grade !== undefined)
            .map((s) => ({
              studentId: row.studentId,
              subjectId: s.subjectId,
              grade: s.grade,
            }))
        ),
      };

      await api.post("exam/grades", payload);
      toast.success("✅ Notes enregistrées avec succès !");
    } catch (err: any) {
      if (err.isOffline) {
        toast.info("Enregistré localement (hors ligne) 📡");
        return;
      }
      console.error(err);
      toast.error("❌ Erreur lors de l’enregistrement des notes");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredGrades = grades.filter(g => 
    g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/list/exam"
                        className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm group"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Enter Grades
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage student results by exam and class
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                    >
                        <Download className="w-5 h-5 text-blue-600" />
                        <span>Export</span>
                    </Button>
                </div>
            </div>

            {/* Filters Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Evaluation / Exam</Label>
                        <ComboboxDemo
                            frameworks={exams.map((e) => ({
                                value: e.id.toString(),
                                label: e.examName,
                            }))}
                            type="Examen"
                            value={formData.id.toString()}
                            onChange={(val) => {
                                const examId = parseInt(val);
                                setFormData({ ...formData, id: examId });
                                const selectedExam = exams.find((e) => e.id === examId);
                                setSelectedExamsName(selectedExam ? selectedExam.examName : "");
                            }}
                            width="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Target Class</Label>
                        <ComboboxDemo
                            frameworks={classes.map((c) => ({
                                value: c.classId.toString(),
                                label: c.ClassName,
                            }))}
                            type="Classe"
                            value={formData.classId.toString()}
                            onChange={(val) => {
                                const classId = parseInt(val);
                                setFormData((prev) => ({ ...prev, classId }));
                                const selected = classes.find((c) => c.classId === classId);
                                setSelectedClassName(selected ? selected.ClassName : "");
                            }}
                            width="w-full"
                            disabled={formData.id === 0}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900/30 rounded-full animate-spin border-t-blue-600" />
                            <Loader2 className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">Loading grade records...</p>
                    </div>
                ) : grades.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        {/* Search & Stats Bar */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex-1 relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search student by name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Active Context</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {selectedExamsName} <span className="text-blue-600 px-1">•</span> {selectedClassName}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-none text-sm font-bold">
                                    {grades.length} Students
                                </Badge>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                            <CustomTable
                                data={filteredGrades}
                                loading={loading}
                                rowKey={(item) => item.studentId}
                                columns={[
                                    {
                                        header: "Code",
                                        key: "studentCode",
                                        className: "font-mono text-xs text-gray-400 dark:text-slate-500",
                                    },
                                    {
                                        header: "Student Name",
                                        key: "studentName",
                                        className: "font-bold text-gray-900 dark:text-white",
                                    },
                                    ...subjects.map((subjectName) => ({
                                        header: subjectName,
                                        key: subjectName,
                                        headerClassName: "text-center font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500",
                                        render: (item: GradeRow) => {
                                            const subject = item.subjects.find(s => s.subjectName === subjectName);
                                            if (!subject) return <div className="text-center text-gray-200 dark:text-slate-800 font-bold">—</div>;

                                            const grade = subject.grade;
                                            const isFailing = grade !== null && grade < 10;
                                            const isExcellent = grade !== null && grade >= 16;
                                            const isGood = grade !== null && grade >= 12 && grade < 16;

                                            return (
                                                <div className="flex justify-center py-1">
                                                    <div className="relative group">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={20}
                                                            step={0.25}
                                                            disabled={!hasPermission('grade:create')}
                                                            value={subject.grade ?? ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const num = parseFloat(val);
                                                                if (!isNaN(num)) {
                                                                    handleGradeChange(item.studentId, subject.subjectId, num);
                                                                } else if (val === "") {
                                                                    // allow empty
                                                                }
                                                            }}
                                                            className={`w-16 h-10 text-center font-bold text-sm transition-all duration-200 rounded-xl bg-gray-50 dark:bg-slate-800/50 outline-none border-2
                                                                ${!hasPermission('grade:create') ? "opacity-50 cursor-not-allowed border-gray-100" : ""}
                                                                ${isFailing ? "text-rose-600 border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10" : 
                                                                  isExcellent ? "text-emerald-600 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10" :
                                                                  isGood ? "text-blue-600 border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10" :
                                                                  "text-gray-900 dark:text-white border-transparent hover:border-gray-200 dark:hover:border-slate-700"}
                                                                focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10
                                                            `}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }))
                                ]}
                            />
                        </div>

                        {/* Sticky Save Button */}
                        <PermissionGuard permissions={['grade:create']}>
                            <div className="fixed bottom-10 right-10 z-50">
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        onClick={handleSaveAll}
                                        disabled={isSaving}
                                        size="lg"
                                        className="h-16 px-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all border-none flex items-center gap-4 text-base font-bold"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving Results...
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-white/20 rounded-full">
                                                    <Save className="w-5 h-5" />
                                                </div>
                                                Save All Grades
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </div>
                        </PermissionGuard>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-96 text-center space-y-6 bg-gray-50/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800 p-12"
                    >
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 transform -rotate-3">
                            <GraduationCap className="w-16 h-16 text-blue-500" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Start Recording Grades</h3>
                            <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                                {formData.id === 0 
                                    ? "Select an evaluation from the dropdown above to begin." 
                                    : formData.classId === 0 
                                        ? "Now select a class to load the student registry." 
                                        : "No students currently enrolled in this class."}
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function ExamGradesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">Chargement...</p>
        </div>
      }
    >
      <ExamGradesContent />
    </Suspense>
  );
}
