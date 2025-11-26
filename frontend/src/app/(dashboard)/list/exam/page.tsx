"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { columns, Exams } from "./column";
import api from "@/lib/api";
import { fetchUser } from "@/lib/getRoleFromToken";

import dynamic from "next/dynamic";
const Calendar = dynamic(
    () => import("@/components/ui/calendar").then((mod) => mod.Calendar),
    { ssr: false }
);


export default function ExamList() {
    const [examName, setExamName] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(2025, 5, 12),
        to: new Date(2025, 6, 15),
    });

    // Data table states
    const [exams, setExams] = useState<Exams[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    const [selectedExam, setSelectedExam] = useState<Exams | null>(null);
    const [role, setRole] = useState<string | null>(null);

    // Helper function to format date as YYYY-MM-DD
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch exams
    const fetchExams = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/exam", {
                params: {
                    page,
                    limit: pageSize,
                    search: filterValue,
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
    };

    useEffect(() => {
        const loadUser = async () => {
            const user = await fetchUser();
            if (user) setRole(user.role);
        };
        loadUser();
    }, []);

    // Fetch exams on mount and when dependencies change
    useEffect(() => {
        fetchExams(currentPage);
    }, [currentPage, pageSize, filterValue]);

    // Handle edit
    const handleEdit = (exam: Exams) => {
        setSelectedExam(exam);
        setExamName(exam.examName);
        setDateRange({
            from: new Date(exam.dateStart),
            to: new Date(exam.dateEnd),
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Handle submit (create or update)
    const handleSubmit = async () => {
        if (!examName.trim()) {
            toast.error("Veuillez entrer le nom de l'examen.");
            return;
        }

        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Veuillez sélectionner la date de début et de fin.");
            return;
        }

        try {
            const examData = {
                examName: examName.trim(),
                dateStart: formatDate(dateRange.from),
                dateEnd: formatDate(dateRange.to),
                publish: selectedExam?.publish || false,
            };

            if (selectedExam) {
                // Update existing exam
                await api.put(`/exam/${selectedExam.id}`, examData, {
                    withCredentials: true,
                });
                toast.success("Examen mis à jour avec succès");
            } else {
                // Create new exam
                await api.post("/exam", examData, {
                    withCredentials: true,
                });
                toast.success("Examen créé avec succès");
            }

            // Reset form
            setExamName("");
            setDateRange({
                from: new Date(2025, 5, 12),
                to: new Date(2025, 6, 15),
            });
            setSelectedExam(null);

            // Refresh table
            fetchExams(currentPage);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(
                selectedExam
                    ? "Échec de la mise à jour de l'examen"
                    : "Échec de la création de l'examen"
            );
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setSelectedExam(null);
        setExamName("");
        setDateRange({
            from: new Date(2025, 5, 12),
            to: new Date(2025, 6, 15),
        });
    };

    return (
        <div className="bg-background p-4 rounded-md flex flex-col lg:flex-row w-full gap-4">
            {/* Left Panel: Form */}
            <Card className="lg:w-1/4 w-full">
                <CardHeader>
                    <CardTitle className="text-center text-lg">
                        {selectedExam ? "Modifier l'examen" : "Ajouter un nouvel examen"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="examName">Nom de l'examen</Label>
                        <Input
                            id="examName"
                            type="text"
                            placeholder="Ex: Examen du 1er trimestre"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="dateStart">Date commence/fin</Label>
                        <div className="flex justify-center">
                            <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                className="rounded-lg border shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleSubmit}>
                            {selectedExam ? "Mettre à jour" : "Enregistrer"}
                        </Button>
                        {selectedExam && (
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleCancelEdit}
                            >
                                Annuler
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Right Panel: Exam list */}
            <Card className="lg:w-3/4 w-full">
                <CardContent className="p-6">
                    <DataTable
                        title="Liste des examens"
                        columns={columns({
                            currentPage,
                            onRefresh: fetchExams,
                            totalCount,
                            pageSize,
                            onEdit: handleEdit,
                            role,
                        })}
                        data={exams}
                        loading={loading}
                        currentPage={currentPage}
                        totalCount={totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                        onRefresh={() => fetchExams(currentPage)}
                        onFilterChange={setFilterValue}
                        filterKey="examName"
                    />
                </CardContent>
            </Card>
        </div>
    );
}