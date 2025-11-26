"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ArrowDownWideNarrow } from "lucide-react";
import UserCard from "@/components/UserCard";
import StudentForm from "@/components/forms/StudentForm";

interface Student {
    studentId: number;
    code: string;
    firstName: string;
    lastName: string;
    email?: string;
    photoFileName?: string;
    dateOfBirth?: string;
    dateInscription?: string;
    lieuOfBirth?: string;
    nationality?: string;
    gender?: string;
    bloodType?: string;
    cid?: string;
    etatCivil?: string;
    health?: string;
    numNumerisation?: string;
    address?: string;
    observation?: string;
}

export default function StudentListPage() {
    const [data, setData] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    
    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const fetchData = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/student/list", {
                params: {
                    page,
                    limit: pageSize,
                    search: filterValue,
                },
            });
            setData(response.data.students);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/student/${id}`);
            fetchData(currentPage);
        } catch (error) {
            console.error("Error deleting student:", error);
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            // Fetch full student details
            const response = await api.get(`/student/${id}`);
            const studentData = response.data;
            
            // Construct photo URL if photoFileName exists
            if (studentData.photoFileName) {
                studentData.photoUrl = `http://localhost:47005/student/photo/${studentData.photoFileName}`;
            }
            
            setSelectedStudent(studentData);
            setFormType("update");
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching student details:", error);
        }
    };

    const handleAddStudent = () => {
        setSelectedStudent(null);
        setFormType("create");
        setIsDialogOpen(true);
    };

    const handleFormSuccess = () => {
        fetchData(currentPage);
        setIsDialogOpen(false);
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, pageSize, filterValue]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="container mx-auto px-4 py-6">
            <Card className="mb-6">
                <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Students</h1>
                            <p className="text-sm text-muted-foreground">Manage your students directory</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <ArrowDownWideNarrow className="w-4 h-4 mr-2" />
                                Sort
                            </Button>
                            <Button size="sm" className="flex-1 sm:flex-none" onClick={handleAddStudent}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Student
                            </Button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-muted-foreground">Loading students...</div>
                        </div>
                    ) : (
                        <>
                            {/* Student Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                {data.map((student) => (
                                    <UserCard
                                        key={student.studentId}
                                        id={student.studentId}
                                        code={student.code}
                                        firstName={student.firstName}
                                        lastName={student.lastName}
                                        email={student.email}
                                        photoUrl={student.photoFileName ? `http://localhost:47005/student/photo/${student.photoFileName}` : undefined}
                                        userType="student"
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Student Form Dialog */}
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

