"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, Download, Eye, Edit, Trash2, Columns3 } from "lucide-react";
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
            setData(response.data.teachers || response.data.employers);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        } finally {
            setLoading(false);
        }
    }, [pageSize, debouncedFilterValue]);

    const handleDelete = useCallback(async (id: number) => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;
        try {
            await api.delete(`/employer/${id}`);
            fetchData(currentPage);
        } catch (error) {
            console.error("Error deleting teacher:", error);
        }
    }, [currentPage, fetchData]);

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
            header: "Photo",
            key: "photo",
            visible: columnVisibility.photo,
            render: (teacher: Employer) => (
                <img
                    src={teacher.photoFileName ? `http://localhost:47005/employer/photo/${teacher.photoFileName}` : "/avatar.png"}
                    alt={`${teacher.firstName} ${teacher.lastName}`}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                />
            ),
        },
        {
            header: "Code",
            key: "code",
            visible: columnVisibility.code,
            className: "font-medium text-foreground",
        },
        {
            header: "Name",
            key: "name",
            visible: columnVisibility.name,
            render: (teacher: Employer) => `${teacher.firstName} ${teacher.lastName}`,
            className: "text-foreground",
        },
        {
            header: "Type",
            key: "type",
            visible: columnVisibility.type,
            className: "text-muted-foreground capitalize",
        },
        {
            header: "Gender",
            key: "gender",
            visible: columnVisibility.gender,
            render: (teacher: Employer) => teacher.gender || "-",
            className: "text-muted-foreground",
        },
        {
            header: "Phone",
            key: "phone",
            visible: columnVisibility.phone,
            render: (teacher: Employer) => teacher.phone || "-",
            className: "text-muted-foreground",
        },
        {
            header: "Status",
            key: "status",
            visible: columnVisibility.status,
            render: (teacher: Employer) => (
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${teacher.okBlock ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                    {teacher.okBlock ? "Blocked" : "Active"}
                </span>
            ),
        },
        {
            header: "Actions",
            key: "actions",
            visible: columnVisibility.actions,
            headerClassName: "text-right",
            className: "text-right font-medium",
            render: (teacher: Employer) => (
                <div className="flex items-center justify-end gap-2">
                    <Link
                        href={`/list/employers/${teacher.employerId}`}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                    <button
                        onClick={() => handleUpdate(teacher.employerId)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                    >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                    <button 
                        onClick={() => handleDelete(teacher.employerId)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                    >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                    </button>
                </div>
            ),
        },
    ], [columnVisibility, handleUpdate, handleDelete]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-card-foreground mb-1">Teachers</h1>
                    <p className="text-gray-500">Manage all teacher records and information</p>
                </div>
                <Button 
                    onClick={handleAddTeacher}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Teacher
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-foreground"
                        />
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                <Columns3 className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                <span className="text-gray-600 dark:text-slate-400">Columns</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuCheckboxItem checked={columnVisibility.photo} onCheckedChange={() => toggleColumn('photo')}>Photo</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.code} onCheckedChange={() => toggleColumn('code')}>Code</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>Name</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.type} onCheckedChange={() => toggleColumn('type')}>Type</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.gender} onCheckedChange={() => toggleColumn('gender')}>Gender</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.phone} onCheckedChange={() => toggleColumn('phone')}>Phone</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.status} onCheckedChange={() => toggleColumn('status')}>Status</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        Filters
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
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
                            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> teachers
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg"
                            >
                                Previous
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
                                Next
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
        </div>
    );
}