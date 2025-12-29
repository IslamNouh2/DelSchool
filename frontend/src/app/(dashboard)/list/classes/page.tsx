"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, Download, Eye, Edit, Trash2, Columns3 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomTable } from "@/components/CustomTable";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Class {
    classId: number;
    ClassName: string;
    NumStudent: number;
    localId: number;
    okBlock: string;
    local?: {
        name: string;
    };
}

export default function ClassListPage() {
    const [data, setData] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    
    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState({
        name: true,
        capacity: true,
        room: true,
        status: true,
        actions: true,
    });

    const fetchData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/class", {
                params: {
                    page,
                    limit: pageSize,
                    search: filterValue,
                },
            });
            setData(response.data.classes);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching classes:", error);
            toast.error("Failed to fetch classes");
        } finally {
            setLoading(false);
        }
    }, [pageSize, filterValue]);

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/class/${id}`);
            toast.success("Class deleted successfully");
            fetchData(currentPage);
        } catch (error) {
            console.error("Error deleting class:", error);
            toast.error("Failed to delete class");
        }
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [fetchData, currentPage]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const toggleColumn = (column: keyof typeof columnVisibility) => {
        setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">Classes</h1>
                    <p className="text-muted-foreground">Manage all school classes and rooms</p>
                </div>
                <Button 
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Class
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by class name..."
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
                            <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>Class Name</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.capacity} onCheckedChange={() => toggleColumn('capacity')}>Capacity</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.room} onCheckedChange={() => toggleColumn('room')}>Room</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.status} onCheckedChange={() => toggleColumn('status')}>Status</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        <span className="text-gray-600 dark:text-slate-400">Filters</span>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <Download className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        <span className="text-gray-600 dark:text-slate-400">Export</span>
                    </Button>
                </div>
            </div>

            {/* Class Table */}
            <CustomTable
                data={data}
                loading={loading}
                rowKey={(item) => item.classId}
                columns={[
                    {
                        header: "Class Name",
                        key: "name",
                        visible: columnVisibility.name,
                        render: (item) => item.ClassName,
                        className: "font-medium text-gray-900 dark:text-slate-100",
                    },
                    {
                        header: "Capacity",
                        key: "capacity",
                        visible: columnVisibility.capacity,
                        render: (item) => item.NumStudent,
                        className: "text-gray-600 dark:text-slate-400",
                    },
                    {
                        header: "Room",
                        key: "room",
                        visible: columnVisibility.room,
                        render: (item) => item.local?.name || "-",
                        className: "text-gray-600 dark:text-slate-400",
                    },
                    {
                        header: "Status",
                        key: "status",
                        visible: columnVisibility.status,
                        render: (item) => {
                            const isBlocked = item.okBlock === "Y";
                            return (
                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${isBlocked ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"}`}>
                                    {isBlocked ? "Blocked" : "Active"}
                                </span>
                            );
                        },
                    },
                    {
                        header: "Actions",
                        key: "actions",
                        visible: columnVisibility.actions,
                        headerClassName: "text-right",
                        className: "text-right font-medium",
                        render: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                <Link
                                    href={`/list/classes/${item.classId}`}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                                >
                                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                </Link>
                                <button
                                    className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors group"
                                >
                                    <Edit className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                                </button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group">
                                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. It will permanently remove this class.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(item.classId)}>
                                                Confirm
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ),
                    },
                ]}
                footer={!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> classes
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
        </div>
    );
}
