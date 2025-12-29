"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  score: string;
  grade: string;
}

interface GradeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialExamId?: string;
  initialClassId?: string;
}

const getGradeColor = (grade: string) => {
  if (grade === "A+" || grade === "A") return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400";
  if (grade === "B+" || grade === "B") return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
  if (grade === "C+" || grade === "C") return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400";
  if (grade === "D") return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400";
  if (grade === "F") return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400";
  return "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400";
};

export default function GradeForm({ onSuccess, onCancel, initialExamId, initialClassId }: GradeFormProps) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    classId: initialClassId || "",
    subjectId: "",
    examId: initialExamId || "",
    assessmentName: "",
    assessmentType: "exam",
    date: new Date().toISOString().split("T")[0],
    maxScore: "100",
    passingScore: "50",
  });

  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, examsRes] = await Promise.all([
          api.get("/class"),
          api.get("/exam/exams"),
        ]);
        setClasses(classesRes.data.classes || []);
        setExams(examsRes.data || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load classes and exams");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.classId) {
      const fetchClassData = async () => {
        try {
          // Fetch subjects from timetable for this class
          const timetableRes = await api.get(`/timetable/class/${formData.classId}`);
          const timetableEntries = timetableRes.data || [];
          
          // Extract unique subjects
          const uniqueSubjects = Array.from(new Map(
            timetableEntries.map((entry: any) => [entry.subject.subjectId, entry.subject])
          ).values());
          
          setSubjects(uniqueSubjects);

          // Fetch students for this class
          const studentsRes = await api.get(`/student/list`, { params: { classId: formData.classId, limit: 100 } });
          const students = studentsRes.data.students || [];
          setAvailableStudents(students);

          // Auto-populate grade entries
          setGradeEntries(students.map((s: any) => ({
            id: s.studentId.toString(),
            studentId: s.studentId.toString(),
            studentName: `${s.firstName} ${s.lastName}`,
            score: "",
            grade: "",
          })));
        } catch (error) {
          console.error("Error fetching class data:", error);
          toast.error("Failed to load data for this class");
        }
      };
      fetchClassData();
    }
  }, [formData.classId]);

  const calculateGrade = (score: number) => {
    const max = parseFloat(formData.maxScore) || 100;
    const percentage = (score / max) * 100;

    if (percentage >= 95) return "A+";
    if (percentage >= 90) return "A";
    if (percentage >= 85) return "B+";
    if (percentage >= 80) return "B";
    if (percentage >= 75) return "C+";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const handleScoreChange = (id: string, newScore: string) => {
    setGradeEntries(
      gradeEntries.map((entry) => {
        if (entry.id === id) {
          const grade = newScore ? calculateGrade(parseFloat(newScore)) : "";
          return { ...entry, score: newScore, grade };
        }
        return entry;
      })
    );
  };

  const addGradeEntry = () => {
    setGradeEntries([
      ...gradeEntries,
      {
        id: `new-${Date.now()}`,
        studentId: "",
        studentName: "",
        score: "",
        grade: "",
      },
    ]);
  };

  const removeGradeEntry = (id: string) => {
    setGradeEntries(gradeEntries.filter((entry) => entry.id !== id));
  };

  const handleSave = async () => {
    if (!formData.classId || !formData.examId || !formData.subjectId) {
      toast.error("Please select class, exam, and subject");
      return;
    }

    const validGrades = gradeEntries
      .filter(e => e.studentId && e.score !== "")
      .map(e => ({
        studentId: parseInt(e.studentId),
        subjectId: parseInt(formData.subjectId),
        grade: parseFloat(e.score),
      }));

    if (validGrades.length === 0) {
      toast.error("No valid grades to save");
      return;
    }

    setLoading(true);
    try {
      await api.post("/exam/grades", {
        classId: parseInt(formData.classId),
        examId: parseInt(formData.examId),
        grades: validGrades,
      });
      toast.success("Grades saved successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Failed to save grades");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* Assessment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Class</label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-foreground"
          >
            <option value="">Select Class</option>
            {classes.map((c: any) => (
              <option key={c.classId} value={c.classId}>{c.ClassName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject</label>
          <select
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-foreground"
          >
            <option value="">Select Subject</option>
            {Array.isArray(subjects) && subjects.length > 0 ?
              (
                subjects.map((s: any) => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                ))
              )
              : (
                <option value="" disabled>No subjects available</option>
              )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Exam</label>
          <select
            value={formData.examId}
            onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-foreground"
          >
            <option value="">Select Exam</option>
            {exams.map((e: any) => (
              <option key={e.id} value={e.id}>{e.examName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-foreground"
          />
        </div>
      </div>

      {/* Grade Entry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Student Grades</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={addGradeEntry}
            className="h-8 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Student
          </Button>
        </div>

        <div className="border dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">Student</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">Score</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">Grade</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {gradeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2">
                    {entry.studentName ? (
                      <span className="font-medium">{entry.studentName}</span>
                    ) : (
                      <select
                        value={entry.studentId}
                        onChange={(e) => {
                          const student: any = availableStudents.find((s: any) => s.studentId.toString() === e.target.value);
                          setGradeEntries(gradeEntries.map(item =>
                            item.id === entry.id
                              ? { ...item, studentId: e.target.value, studentName: student ? `${student.firstName} ${student.lastName}` : "" }
                              : item
                          ));
                        }}
                        className="w-full px-2 py-1 border dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-foreground"
                      >
                        <option value="">Select Student</option>
                        {availableStudents.map((s: any) => (
                          <option key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={entry.score}
                      onChange={(e) => handleScoreChange(entry.id, e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1 border dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-foreground"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(entry.grade)}`}>
                      {entry.grade || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => removeGradeEntry(entry.id)}
                      className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Grades
        </Button>
      </div>
    </div>
  );
}
