"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, Download, Eye, Edit, Trash2, ArrowDownWideNarrow, Columns3, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import StudentForm from "@/components/forms/StudentForm";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomTable } from "@/components/CustomTable";
import { useSocket } from "@/providers/SocketProvider";
import { useTranslations } from "next-intl";
import { useTranslateError } from "@/hooks/useTranslateError";
import { toast } from "sonner";
import { SyncStatusBadge } from "@/components/pwa/SyncStatusBadge";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { OfflineDB } from "@/lib/db";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";


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
    studentClasses?: {
        classId: number;
        Class: {
            ClassName: string;
        };
    }[];
}

export default function StudentListPage() {
    const t = useTranslations("students");
    const actionsT = useTranslations("actions");
    const commonT = useTranslations("common");
    const { translateError } = useTranslateError();

    const [data, setData] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
    const { refreshKey } = useSocket();

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('studentColumnVisibility');
            return saved ? JSON.parse(saved) : {
                photo: true,
                code: true,
                name: true,
                gender: true,
                class: true,
                status: true,
                actions: true,
                custom: true,
            };
        }
        return {
            photo: true,
            code: true,
            name: true,
            gender: true,
            class: true,
            status: true,
            actions: true,
            custom: true,
        };
    });

    useEffect(() => {
        localStorage.setItem('studentColumnVisibility', JSON.stringify(columnVisibility));
    }, [columnVisibility]);


    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedFilterValue]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterValue(filterValue);
        }, 500);
        return () => clearTimeout(timer);
    }, [filterValue]);

    const fetchData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';
            const response = await api.get("/student/list", {
                params: {
                    page,
                    limit: pageSize,
                    search: debouncedFilterValue,
                },
            });
            
            let students = response.data.students;
            
            // Merge pending offline student creations
            const pendingMutations = await OfflineDB.getSyncQueue(tenantId);
            const pendingStudents = pendingMutations
                .filter(m => m.entity === 'student' && m.type === 'CREATE')
                .map(m => ({
                    ...m.data,
                    studentId: `pending-${m.operationId}`,
                    isPending: true
                }));

            setData([...pendingStudents, ...students]);
            setTotalCount(response.data.total + pendingStudents.length);
        } catch (error: any) {
            console.error("Error fetching students:", error);
            
            // If offline, try to load from cache or at least show pending
            const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';
            if (!navigator.onLine || error.isOffline) {
                 const pendingMutations = await OfflineDB.getSyncQueue(tenantId);
                 const pendingStudents = pendingMutations
                    .filter(m => m.entity === 'student' && m.type === 'CREATE')
                    .map(m => ({
                        ...m.data,
                        studentId: `pending-${m.operationId}`,
                        isPending: true
                    }));
                setData(pendingStudents);
            }
            if (!error.isOffline) {
                toast.error(translateError(error));
            }
        } finally {
            setLoading(false);
        }
    }, [pageSize, debouncedFilterValue, translateError]);


    const handleDeleteClick = (id: number) => {
        setStudentToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;
        try {
            await api.delete(`/student/${studentToDelete}`);
            toast.success(t("messages.delete_success"));
            fetchData(currentPage);
        } catch (error) {
            console.error("Error deleting student:", error);
            toast.error(translateError(error));
        } finally {
            setIsDeleteDialogOpen(false);
            setStudentToDelete(null);
        }
    };

    const handleUpdate = useCallback(async (id: number) => {
        try {
            const response = await api.get(`/student/${id}`);
            const studentData = response.data;
            setSelectedStudent(studentData);
            setFormType("update");
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching student details:", error);
            toast.error(translateError(error));
        }
    }, [translateError]);

    const handleAddStudent = useCallback(() => {
        setSelectedStudent(null);
        setFormType("create");
        setIsDialogOpen(true);
    }, []);

    const handleFormSuccess = useCallback(() => {
        fetchData(currentPage);
        setIsDialogOpen(false);
    }, [currentPage, fetchData]);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, debouncedFilterValue, fetchData, refreshKey]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const toggleColumn = useCallback((column: keyof typeof columnVisibility) => {
        setColumnVisibility((prev: any) => ({ ...prev, [column]: !prev[column] }));
    }, []);

    const getPhotoUrl = (filename?: string) =>
        filename ? `http://localhost:47005/api/student/photo/${filename}` : "/avatar.png";

    const columns = useMemo(() => [
        {
            header: t("table.photo"),
            key: "photo",
            visible: columnVisibility.photo,
            render: (student: Student) => (
                <img
                    src={getPhotoUrl(student.photoFileName)}
                    alt={`${student.firstName} ${student.lastName}`}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/avatar.png";
                    }}
                />
            ),
        },
        {
            header: t("table.code"),
            key: "code",
            visible: columnVisibility.code,
            className: "font-medium text-muted-foreground",
        },
        {
            header: t("table.name"),
            key: "name",
            visible: columnVisibility.name,
            render: (student: Student & { isPending?: boolean }) => (
                <div className="flex items-center gap-2">
                    <span>{student.firstName} {student.lastName}</span>
                    {student.isPending && <SyncStatusBadge id={student.studentId} isPending={true} />}
                </div>
            ),
            className: "text-muted-foreground",
        },

        {
            header: t("table.gender"),
            key: "gender",
            visible: columnVisibility.gender,
            render: (student: Student) => {
                if (student.gender === "Male") return t("form.labels.gender_male");
                if (student.gender === "Female") return t("form.labels.gender_female");
                return student.gender || "-";
            },
            className: "text-foreground",
        },
        {
            header: t("table.class"),
            key: "class",
            visible: columnVisibility.class,
            render: (student: Student) => student.studentClasses?.[0]?.Class?.ClassName || "-",
            className: "text-foreground",
        },
        {
            header: t("table.custom"),
            key: "custom",
            visible: columnVisibility.custom,
            render: (student: Student) => student.numNumerisation || "-",
            className: "text-foreground",
        },
        {
            header: t("table.status"),
            key: "status",
            visible: columnVisibility.status,
            render: () => (
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium dark:bg-green-500/10 dark:text-green-400">
                    {t("table.active")}
                </span>
            ),
        },
        {
            header: t("table.actions"),
            key: "actions",
            visible: columnVisibility.actions,
            headerClassName: "text-right",
            className: "text-right font-medium",
            render: (student: Student) => (
                <div className="flex items-center justify-end gap-2">
                    <Link
                        href={`/list/students/${student.studentId}`}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors group"
                    >
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </Link>
                    <button
                        onClick={() => handleUpdate(student.studentId)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors group"
                    >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(student.studentId)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group"
                    >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                    </button>
                </div>
            ),
        },
    ], [columnVisibility, handleUpdate, t]);

    return (
        <div className="space-y-6 p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                      <div className="p-3 bg-lamaYellow rounded-2xl shadow-lg shadow-yellow-500/20 text-white">
                          <GraduationCap size={24} />
                      </div>
                      {t("title")}
                      <span className="text-sm font-bold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                           {t("total_count", { count: totalCount })}
                      </span>
                   </h1>
                   <p className="text-gray-500 font-medium mt-2 max-w-lg">
                      {t("subtitle")}
                   </p>
                </div>
                <Button
                    onClick={handleAddStudent}
                    className="flex items-center gap-2 px-6 py-3 bg-lamaSky hover:bg-lamaSkyLight text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none font-bold"
                >
                    <Plus className="w-5 h-5" />
                    {t("add_title")}
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder={t("search_placeholder")}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full ps-10 pe-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-foreground"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-auto">
                                <Columns3 className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                <span className="text-gray-600 dark:text-slate-400">{actionsT("columns")}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuCheckboxItem checked={columnVisibility.photo} onCheckedChange={() => toggleColumn('photo')}>{t("table.photo")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.code} onCheckedChange={() => toggleColumn('code')}>{t("table.code")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>{t("table.name")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.gender} onCheckedChange={() => toggleColumn('gender')}>{t("table.gender")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.class} onCheckedChange={() => toggleColumn('class')}>{t("table.class")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.custom} onCheckedChange={() => toggleColumn('custom')}>{t("table.custom")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.status} onCheckedChange={() => toggleColumn('status')}>{t("table.status")}</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline"
                        className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-auto"
                    >
                        <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        {actionsT("filter")}
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-auto">
                        <Download className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        {actionsT("export")}
                    </Button>
                </div>
            </div>

            {/* Student Table */}
            <CustomTable
                data={data}
                loading={loading}
                rowKey={(student) => student.studentId}
                columns={columns}
                footer={!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            {t("table.table_info", {
                                start: (currentPage - 1) * pageSize + 1,
                                end: Math.min(currentPage * pageSize, totalCount),
                                total: totalCount
                            })}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border-gray-200 dark:border-slate-800"
                            >
                                {actionsT("previous")}
                            </Button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        size="sm"
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className="w-8 h-8 p-0 rounded-lg border-gray-200 dark:border-slate-800"
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border-gray-200 dark:border-slate-800"
                            >
                                {actionsT("next")}
                            </Button>
                        </div>
                    </div>
                )}
            />
            {/* Student Form Dialog */}
            {isDialogOpen && (
                <StudentForm
                    type={formType}
                    data={selectedStudent}
                    setOpen={setIsDialogOpen}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl dark:bg-[#1a1c2e]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold dark:text-white">{actionsT("delete")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            {t("messages.delete_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-gray-200 dark:border-white/10 dark:text-gray-300 font-bold">{actionsT("cancel")}</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-none font-bold"
                        >
                            {actionsT("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
