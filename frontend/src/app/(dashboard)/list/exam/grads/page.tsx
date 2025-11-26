"use client";

import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { ComboboxDemo } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { Save, Loader2, BookOpen, GraduationCap, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { columns, GradeRow } from "./column";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function GradsList() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const examIdParam = searchParams.get("examId");

    const [classes, setClasses] = useState<{ classId: number; ClassName: string }[]>([]);
    const [exams, setExams] = useState<{ id: number; examName: string }[]>([]);
    const [formData, setFormData] = useState({ 
        id: examIdParam ? parseInt(examIdParam) : 0, 
        classId: 0 
    });
    const [selectedClassName, setSelectedClassName] = useState<string>("");
    const [selectedExamsName, setSelectedExamsName] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [grades, setGrades] = useState<GradeRow[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Handle grade change dynamically
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

    // ✅ Save all grades
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

    // ✅ Fetch grades
    const fetchGrads = async (page: number = 1) => {
        if (formData.classId > 0 && formData.id > 0) {
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
        }
    };

    // ✅ Fetch exams
    useEffect(() => {
        api.get("/exam/exams")
            .then((res) => setExams(res.data))
            .catch((err) => console.error(err));
    }, []);

    // ✅ Set selected exam name
    useEffect(() => {
        if (exams.length > 0 && formData.id > 0) {
            const selected = exams.find(e => e.id === formData.id);
            if (selected) {
                setSelectedExamsName(selected.examName);
            }
        }
    }, [exams, formData.id]);

    // ✅ Fetch classes when exam changes
    useEffect(() => {
        if (formData.id > 0) {
            api
                .get(`/class`)
                .then((res) => setClasses(res.data.classes))
                .catch((err) => console.error(err));
        } else {
            setClasses([]);
            setFormData((prev) => ({ ...prev, classId: 0 }));
        }
    }, [formData.id]);

    // ✅ Fetch grades when class or exam changes
    useEffect(() => {
        if (formData.classId > 0 && formData.id > 0) {
            fetchGrads(currentPage);
        } else {
            setGrades([]);
        }
    }, [formData.classId, formData.id, currentPage]);

    return (
        <div className="flex flex-col w-full space-y-6 p-2 md:p-4 max-w-8xl mx-auto">
            {/* Breadcrumb & Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Saisie des Notes</h1>
                        <p className="text-gray-500 mt-1">Gérez les notes des étudiants par examen et par classe.</p>
                    </div>
                    <Link href="/list/exam">
                        <Button variant="outline" className="gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            Retour aux examens
                        </Button>
                    </Link>
                </div>
            </div>

            <Separator />

            {/* Filters Card */}
            <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                        <BookOpen className="w-5 h-5" />
                        Sélection
                    </CardTitle>
                    <CardDescription>
                        Choisissez un examen et une classe pour commencer la saisie.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Examen combobox */}
                        <div className="flex flex-col space-y-2">
                            <Label className="font-medium text-gray-700">Examen</Label>
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

                        {/* Classe combobox */}
                        <div className="flex flex-col space-y-2">
                            <Label className="font-medium text-gray-700">Classe</Label>
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
                </CardContent>
            </Card>

            {/* Main Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <p className="text-gray-500">Chargement des données...</p>
                    </div>
                ) : grades.length > 0 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="overflow-hidden border-t-4 border-t-blue-600 shadow-lg">
                            <CardHeader className="bg-gray-50/50 border-b pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <GraduationCap className="w-6 h-6 text-blue-600" />
                                            Feuille de notes
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {selectedExamsName} • <span className="font-semibold text-gray-700">{selectedClassName}</span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                                        {grades.length} Étudiants
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <DataTable
                                    columns={columns({
                                        subjects,
                                        onGradeChange: handleGradeChange,
                                    })}
                                    data={grades}
                                    loading={loading}
                                    currentPage={currentPage}
                                    totalCount={totalCount}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setCurrentPage(1);
                                    }}
                                    onRefresh={() => fetchGrads(currentPage)}
                                />
                            </CardContent>
                        </Card>

                        {/* Sticky Bottom Action Bar */}
                        <div className="fixed bottom-6 right-6 z-50">
                            <Button
                                onClick={handleSaveAll}
                                disabled={isSaving}
                                size="lg"
                                className="shadow-xl bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 transition-all hover:scale-105"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Enregistrer les notes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="p-4 bg-card rounded-full shadow-sm">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium text-gray-900">Aucune donnée affichée</h3>
                            <p className="text-gray-500 max-w-sm">
                                {formData.id === 0 
                                    ? "Veuillez sélectionner un examen pour commencer." 
                                    : formData.classId === 0 
                                        ? "Veuillez sélectionner une classe." 
                                        : "Aucun étudiant trouvé pour cette classe."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

