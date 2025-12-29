"use client";

import { useState, useEffect } from "react";
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
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { CustomTable } from "@/components/CustomTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComboboxDemo } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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

export default function ExamGradesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examIdParam = searchParams.get("examId");

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
  }, []);

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
  }, [formData.id, exams]);

  // ✅ Fetch grades when class or exam changes
  useEffect(() => {
    if (formData.classId > 0 && formData.id > 0) {
      fetchGrads();
    } else {
      setGrades([]);
      setSubjects([]);
    }
  }, [formData.classId, formData.id]);

  const fetchGrads = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/exam/subjects/${formData.classId}/${formData.id}`);
      setGrades(res.data);
      if (res.data.length > 0) {
        const allSubjects = res.data[0].subjects.map((s: any) => s.subjectName);
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
    } catch (err) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/list/exam"
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Saisie des Notes</h1>
            <p className="text-muted-foreground">Gérez les notes des étudiants par examen et par classe</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <Download className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">Examen</Label>
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
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">Classe</Label>
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
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">Chargement des données...</p>
          </div>
        ) : grades.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Search & Stats Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-foreground"
                />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Badge variant="secondary" className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 text-sm font-medium">
                  {grades.length} Étudiants
                </Badge>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{selectedExamsName}</span> • {selectedClassName}
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <CustomTable
              data={filteredGrades}
              loading={loading}
              rowKey={(item) => item.studentId}
              columns={[
                {
                  header: "Code",
                  key: "studentCode",
                  className: "font-mono text-xs text-gray-500 dark:text-slate-400",
                },
                {
                  header: "Nom de l'étudiant",
                  key: "studentName",
                  className: "font-medium text-gray-900 dark:text-slate-100",
                },
                ...subjects.map((subjectName) => ({
                  header: subjectName,
                  key: subjectName,
                  headerClassName: "text-center font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400",
                  render: (item: GradeRow) => {
                    const subject = item.subjects.find(s => s.subjectName === subjectName);
                    if (!subject) return <div className="text-center text-gray-300 dark:text-slate-700">—</div>;

                    const grade = subject.grade;
                    const isFailing = grade !== null && grade < 10;
                    const isExcellent = grade !== null && grade >= 16;

                    return (
                      <div className="flex justify-center">
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          value={subject.grade ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              handleGradeChange(item.studentId, subject.subjectId, num);
                            } else if (val === "") {
                              // Handle empty if needed
                            }
                          }}
                          className={`w-16 text-center h-9 transition-all duration-200 rounded-lg bg-white dark:bg-slate-900 text-foreground
                            ${isFailing ? "text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30" : ""}
                            ${isExcellent ? "text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30" : ""}
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 dark:border-slate-800
                          `}
                        />
                      </div>
                    );
                  }
                }))
              ]}
            />

            {/* Sticky Save Button */}
            <div className="fixed bottom-8 right-8 z-50">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all border-none flex items-center gap-3"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer les notes
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-80 text-center space-y-6 bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 p-12"
          >
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Aucune donnée affichée</h3>
              <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                {formData.id === 0 
                  ? "Veuillez sélectionner un examen pour commencer la saisie des notes." 
                  : formData.classId === 0 
                    ? "Veuillez sélectionner une classe pour afficher la liste des étudiants." 
                    : "Aucun étudiant trouvé pour cette classe."}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
