"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, Download, Eye, Edit, Trash2, Columns3, Briefcase, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import EmployerDialog from "@/components/forms/employerForm";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomTable } from "@/components/CustomTable";
import { useSocket } from "@/providers/SocketProvider";
import { OfflineDB } from "@/lib/db";
import { SyncStatusBadge } from "@/components/pwa/SyncStatusBadge";
import { useTranslations } from "next-intl";
import { useTranslateError } from "@/hooks/useTranslateError";
import { toast } from "sonner";
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

interface Employer {
    employerId: number;
    firstName: string;
    lastName: string;
    code: string;
    type: string;
    photoFileName?: string;
    gender?: string;
    phone?: string;
    address?: string;
    okBlock: boolean;
    dateOfBirth?: string;
    dateInscription?: string;
    cid?: string;
    numNumerisation?: string;
    pendingSync?: boolean;
    operationId?: string;
}

export default function TeacherListPage() {
    const [data, setData] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
    const { refreshKey } = useSocket();
    const t = useTranslations("employers");
    const tActions = useTranslations("actions");
    const { translateError } = useTranslateError();

    // Delete confirmation state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [employerToDelete, setEmployerToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('teacherColumnVisibility');
            return saved ? JSON.parse(saved) : {
                photo: true,
                code: true,
                name: true,
                type: true,
                gender: true,
                phone: true,
                status: true,
                actions: true,
            };
        }
        return {
            photo: true,
            code: true,
            name: true,
            type: true,
            gender: true,
            phone: true,
            status: true,
            actions: true,
        };
    });

    useEffect(() => {
        localStorage.setItem('teacherColumnVisibility', JSON.stringify(columnVisibility));
    }, [columnVisibility]);

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);

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
            const response = await api.get("/employer", {
                params: {
                    page,
                    limit: pageSize,
                    search: debouncedFilterValue,
                    type: "teacher", // Specifically for teachers list
                },
            });
            const fetched = response.data.teachers || response.data.employers || [];
            
            // Merge offline data
            const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';
            const queue = await OfflineDB.getSyncQueue(tenantId);
            const pendingEmployers = queue.filter(item => item.entity === 'employer' || item.url.includes('employer'));

            let mergedData = [...fetched];

            pendingEmployers.forEach(item => {
                if (item.type === 'CREATE' || (item.method === 'POST' && item.url.includes('/create'))) {
                    // Check idempotency via operationId
                    if (!mergedData.some(e => e.operationId === item.operationId)) {
                        // Reconstruct employer from FormData or object
                        const d = item.data instanceof FormData ? Object.fromEntries(item.data.entries()) : item.data;
                        mergedData.unshift({
                            ...d,
                            employerId: item.operationId as any,
                            pendingSync: true,
                            operationId: item.operationId
                        } as any);
                    }
                } else if (item.type === 'UPDATE' || item.method === 'PUT') {
                    const id = parseInt(item.url.split('/').pop() || '0');
                    const index = mergedData.findIndex(e => e.employerId === id);
                    if (index !== -1) {
                        const d = item.data instanceof FormData ? Object.fromEntries(item.data.entries()) : item.data;
                        mergedData[index] = { ...mergedData[index], ...d, pendingSync: true };
                    }
                } else if (item.type === 'DELETE' || item.method === 'DELETE') {
                    const id = parseInt(item.url.split('/').pop() || '0');
                    mergedData = mergedData.filter(e => e.employerId !== id);
                }
            });

            setData(mergedData);
            setTotalCount(response.data.total || mergedData.length);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        } finally {
            setLoading(false);
        }
    }, [pageSize, debouncedFilterValue]);

    const handleDelete = useCallback(async (id: number) => {
        setEmployerToDelete(id);
        setIsDeleteDialogOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (!employerToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/employer/${employerToDelete}`);
            toast.success(t("messages.delete_success"));
            fetchData(currentPage);
        } catch (error) {
            toast.error(translateError(error) || t("messages.delete_error"));
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setEmployerToDelete(null);
        }
    };

    const handleUpdate = useCallback(async (id: number) => {
        try {
            const response = await api.get(`/employer/${id}`);
            const employerData = response.data;
            setSelectedEmployer(employerData);
            setFormType("update");
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching teacher details:", error);
        }
    }, []);

    const handleAddTeacher = useCallback(() => {
        setSelectedEmployer(null);
        setFormType("create");
        setIsDialogOpen(true);
    }, []);

    const handleFormSuccess = useCallback(() => {
        fetchData(currentPage);
        setIsDialogOpen(false);
    }, [currentPage, fetchData]);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, fetchData, refreshKey]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const toggleColumn = useCallback((column: keyof typeof columnVisibility) => {
        setColumnVisibility((prev: any) => ({ ...prev, [column]: !prev[column] }));
    }, []);

    const columns = useMemo(() => [
        {
            header: t("table.photo"),
            key: "photo",
            visible: columnVisibility.photo,
            render: (teacher: Employer) => (
                <div className="relative w-10 h-10">
                    <Image
                        src={
                            teacher.photoFileName
                                ? `${process.env.NEXT_PUBLIC_API_URL}/api/employer/photo/${teacher.photoFileName}`
                                : "/avatar.png"
                        }
                        alt={`${teacher.firstName} ${teacher.lastName}`}
                        fill
                        className="rounded-full object-cover border border-border"
                    />
                </div>
            ),
        },
        {
            header: t("table.code"),
            key: "code",
            visible: columnVisibility.code,
            className: "font-medium text-foreground",
        },
        {
            header: t("table.name"),
            key: "name",
            visible: columnVisibility.name,
            render: (teacher: Employer) => (
                <div className="flex items-center gap-2">
                    <span>{teacher.firstName} {teacher.lastName}</span>
                    <SyncStatusBadge id={teacher.employerId} isPending={!!teacher.pendingSync} />
                </div>  
            ),
            className: "text-foreground",
        },
        {
            header: t("table.type"),
            key: "type",
            visible: columnVisibility.type,
            className: "text-muted-foreground capitalize",
        },
        {
            header: t("table.gender"),
            key: "gender",
            visible: columnVisibility.gender,
            render: (teacher: Employer) => {
                if (!teacher.gender) return "-";
                return teacher.gender.toLowerCase() === "male" ? t("form.labels.gender_male") : t("form.labels.gender_female");
            },
            className: "text-muted-foreground",
        },
        {
            header: t("table.phone"),
            key: "phone",
            visible: columnVisibility.phone,
            render: (teacher: Employer) => teacher.phone || "-",
            className: "text-muted-foreground",
        },
        {
            header: t("table.status"),
            key: "status",
            visible: columnVisibility.status,
            render: (teacher: Employer) => (
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${teacher.okBlock ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"}`}>
                    {teacher.okBlock ? t("table.blocked") : t("table.active")}
                </span>
            ),
        },
        {
            header: t("table.actions"),
            key: "actions",
            visible: columnVisibility.actions,
            headerClassName: "text-right",
            className: "text-right font-medium",
            render: (teacher: Employer) => (
                <div className="flex items-center justify-end gap-2">
                    <Link
                        href={`/list/employers/${teacher.employerId}`}
                        className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                    >
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <button
                        onClick={() => handleUpdate(teacher.employerId)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors group"
                    >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                    <button 
                        onClick={() => handleDelete(teacher.employerId)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                    >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                    </button>
                </div>
            ),
        },
    ], [columnVisibility, handleUpdate, handleDelete, t]);

    return (
        <div className="space-y-6 p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="p-3 bg-lamaPurple rounded-2xl shadow-lg shadow-purple-500/20 text-white">
                        <Briefcase size={24} />
                    </div>
                        {t("title")}
                    <span className="text-sm font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
                    {t("total_count", { count: totalCount })}
                    </span>
                </h1>
                <p className="text-gray-500 font-medium mt-2 max-w-lg">
                    {t("subtitle")}
                </p>
                </div>
                <Button
                    onClick={handleAddTeacher}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 border-none"
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
                            className="w-full ps-10 pe-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-foreground"
                        />
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-auto">
                                <Columns3 className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                <span className="text-gray-600 dark:text-slate-400">{tActions("columns")}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuCheckboxItem checked={columnVisibility.photo} onCheckedChange={() => toggleColumn('photo')}>{t("table.photo")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.code} onCheckedChange={() => toggleColumn('code')}>{t("table.code")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>{t("table.name")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.type} onCheckedChange={() => toggleColumn('type')}>{t("table.type")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.gender} onCheckedChange={() => toggleColumn('gender')}>{t("table.gender")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.phone} onCheckedChange={() => toggleColumn('phone')}>{t("table.phone")}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.status} onCheckedChange={() => toggleColumn('status')}>{t("table.status")}</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-auto">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        Filters
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-auto">
                        <Download className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Teacher Table */}
            <CustomTable
                data={data}
                loading={loading}
                rowKey={(teacher) => teacher.employerId}
                columns={columns}
                footer={!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4">
                        <p className="text-sm text-muted-foreground">
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
                                className="rounded-lg"
                            >
                                {tActions("previous")}
                            </Button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        size="sm"
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className="w-8 h-8 p-0 rounded-lg"
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
                                className="rounded-lg"
                            >
                                {tActions("next")}
                            </Button>
                        </div>
                    </div>
                )}
            />
            {/* Employer Form Dialog */}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            {tActions("confirm")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            {t("messages.delete_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            {tActions("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={isDeleting}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all font-semibold"
                        >
                            {isDeleting ? tActions("updating") : tActions("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}