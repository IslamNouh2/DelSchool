"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    examId: initialExamId || "",
    date: new Date().toISOString().split("T")[0],
  });

  // Matrix State: { [studentId]: { [subjectId]: score } }
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({});
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
          // Find the selected class to get its localId
          const selectedClass = classes.find((c: any) => c.classId.toString() === formData.classId);

          if (selectedClass && selectedClass.localId) {
            // Fetch subjects assigned to this local
            const subjectsRes = await api.get(`/subject-local/${selectedClass.localId}`);
            // The endpoint returns { subjects: [{ subject: { ... } }, ...] }
            const mappedSubjects = subjectsRes.data.subjects.map((entry: any) => entry.subject);
            setSubjects(mappedSubjects);
          } else {
            console.warn("Selected class or localId not found");
            setSubjects([]);
          }

          // Fetch students for this class
          const studentsRes = await api.get(`/student/list`, { params: { classId: formData.classId, limit: 100 } });
          const students = studentsRes.data.students || [];
          setAvailableStudents(students);
          
          // Clear grades when class changes
          setGrades({});
        } catch (error) {
          console.error("Error fetching class data:", error);
          toast.error("Failed to load data for this class");
        }
      };
      
      // Only fetch if classes are loaded
      if (classes.length > 0) {
        fetchClassData();
      }
    }
  }, [formData.classId, classes]);

  const calculateGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 95) return "A+";
    if (percentage >= 90) return "A";
    if (percentage >= 85) return "B+";
    if (percentage >= 80) return "B";
    if (percentage >= 75) return "C+";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const handleScoreChange = (studentId: string, subjectId: string, newScore: string) => {
    const subject = subjects.find((s: any) => s.subjectId.toString() === subjectId);
    const max = subject ? parseFloat(subject.totalGrads) || 100 : 100;

    if (newScore && parseFloat(newScore) > max) {
      toast.error(`Score cannot exceed ${max} for ${subject?.subjectName}`);
      return; 
    }

    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: newScore
      }
    }));
  };

  const handleSave = async () => {
    if (!formData.classId || !formData.examId) {
      toast.error("Please select class and exam");
      return;
    }

    // Flatten the matrix into an array of grade objects
    const validGrades: any[] = [];
    
    Object.entries(grades).forEach(([studentId, subjectGrades]) => {
      Object.entries(subjectGrades).forEach(([subjectId, score]) => {
        if (score && score !== "") {
           validGrades.push({
             studentId: parseInt(studentId),
             subjectId: parseInt(subjectId),
             grade: parseFloat(score),
           });
        }
      });
    });

    if (validGrades.length === 0) {
      toast.error("No valid grades to save");
      return;
    }

    setLoading(true);
    try {
      // The API endpoint seems to handle one subject at a time traditionally, 
      // but based on the code provided earlier, it takes an array of grades.
      // Assuming the backend handles multiple subjects correctly since the `grades` array contains `subjectId`.
      // If the backend restricts to one subject per call, we might need a loop, but let's try the bulk first.
      
      await api.post("/exam/grades", {
        classId: parseInt(formData.classId),
        examId: parseInt(formData.examId),
        grades: validGrades,
      });
      
      toast.success("Grades saved successfully");
      // if (onSuccess) onSuccess(); // Keep dialog open per user request
    } catch (error: any) {
      if (error.isOffline) {
        toast.info("Grades saved locally (offline) 📡");
        return;
      }
      console.error("Error saving grades:", error);
      toast.error("Failed to save grades");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-h-[85vh]">
      {/* Assessment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
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

      {/* Grade Entry Matrix */}
      <div className="flex-1 overflow-auto border dark:border-slate-800 rounded-xl relative">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-slate-400 border-b dark:border-slate-700 w-48 sticky left-0 bg-gray-50 dark:bg-slate-800 z-20">Student</th>
              {subjects.map((subject: any) => (
                <th key={subject.subjectId} className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-slate-400 border-b dark:border-slate-700 min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>{subject.subjectName}</span>
                    <span className="text-[10px] text-gray-400 font-normal">Max: {subject.totalGrads || 100}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {availableStudents.length > 0 ? (
              availableStudents.map((student: any) => (
                <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {student.firstName} {student.lastName}
                  </td>
                  {subjects.map((subject: any) => {
                    const score = grades[student.studentId]?.[subject.subjectId] || "";
                    const max = parseFloat(subject.totalGrads) || 100;
                    const grade = score ? calculateGrade(parseFloat(score), max) : "";
                    
                    return (
                      <td key={subject.subjectId} className="px-2 py-2 text-center border-l border-dashed border-gray-100 dark:border-slate-800">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            value={score}
                            onChange={(e) => handleScoreChange(student.studentId.toString(), subject.subjectId.toString(), e.target.value)}
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center border dark:border-slate-800 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-foreground"
                          />
                          {score && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getGradeColor(grade)}`}>
                              {grade}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={subjects.length + 1} className="px-4 py-8 text-center text-gray-500">
                  {formData.classId ? "No students found in this class" : "Select a class to view grading sheet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800 shrink-0">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Grades
        </Button>
      </div>
    </div>
  );
}
