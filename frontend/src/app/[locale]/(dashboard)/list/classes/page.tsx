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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClassForm from "@/components/forms/ClassForm";
import { useSocket } from "@/providers/SocketProvider";
import { useTranslateError } from "@/hooks/useTranslateError";


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

import { useTranslations } from "next-intl";

export default function ClassListPage() {
    const t = useTranslations("classes");
    const commonT = useTranslations("common");
    const actionsT = useTranslations("actions");

    const [data, setData] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const { refreshKey } = useSocket();


    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState({
        name: true,
        capacity: true,
        room: true,
        status: true,
        actions: true,
    });

    const { translateError } = useTranslateError();

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
            toast.error(translateError(error));
        } finally {
            setLoading(false);
        }
    }, [pageSize, filterValue, translateError]);

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/class/${id}`);
            toast.success(t("messages.delete_success"));
            fetchData(currentPage);
        } catch (error) {
            console.error("Error deleting class:", error);
            toast.error(translateError(error));
        }
    };

    const handleFormSuccess = useCallback(() => {
        fetchData(currentPage);
        setIsDialogOpen(false);
    }, [currentPage, fetchData]);

    const handleAddClass = useCallback(() => {
        setSelectedClass(null);
        setFormType("create");
        setIsDialogOpen(true);
    }, []);

    useEffect(() => {
        fetchData(currentPage);
    }, [fetchData, currentPage, refreshKey]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const toggleColumn = (column: keyof typeof columnVisibility) => {
        setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t("subtitle")}
                    </p>
                </div>
                <Button
                    onClick={handleAddClass}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 border-none"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t("add_title")}</span>
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder={t("search_placeholder")}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full ps-10 pe-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                                    <Columns3 className="w-4 h-4" />
                                    <span>{actionsT("columns")}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 rounded-xl">
                                <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>{t("table.name")}</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={columnVisibility.capacity} onCheckedChange={() => toggleColumn('capacity')}>{t("table.capacity")}</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={columnVisibility.room} onCheckedChange={() => toggleColumn('room')}>{t("table.room")}</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={columnVisibility.status} onCheckedChange={() => toggleColumn('status')}>{t("table.status")}</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                            <Filter className="w-4 h-4" />
                            <span>{actionsT("filter")}</span>
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                            <Download className="w-4 h-4" />
                            <span>{actionsT("export")}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Class Table */}
            <CustomTable
                data={data}
                loading={loading}
                rowKey={(item) => item.classId}
                columns={[
                    {
                        header: t("table.name"),
                        key: "name",
                        visible: columnVisibility.name,
                        render: (item) => item.ClassName,
                        className: "font-medium text-gray-900 dark:text-slate-100",
                    },
                    {
                        header: t("table.capacity"),
                        key: "capacity",
                        visible: columnVisibility.capacity,
                        render: (item) => item.NumStudent,
                        className: "text-gray-600 dark:text-slate-400",
                    },
                    {
                        header: t("table.room"),
                        key: "room",
                        visible: columnVisibility.room,
                        render: (item) => item.local?.name || "-",
                        className: "text-gray-600 dark:text-slate-400",
                    },
                    {
                        header: t("table.status"),
                        key: "status",
                        visible: columnVisibility.status,
                        render: (item) => {
                            const isBlocked = item.okBlock === "Y";
                            return (
                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${isBlocked ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"}`}>
                                    {isBlocked ? t("table.blocked") : t("table.active")}
                                </span>
                            );
                        },
                    },
                    {
                        header: actionsT("actions"),
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
                                            <AlertDialogTitle>{t("messages.delete_confirm_title")}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t("messages.delete_confirm_desc")}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{actionsT("cancel")}</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(item.classId)}>
                                                {actionsT("confirm")}
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
                                {actionsT("previous")}
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
                                {actionsT("next")}
                            </Button>
                        </div>
                    </div>
                )}
            />
            {/* Local Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl">
                    <DialogHeader className="border-b border-gray-100 dark:border-slate-800 pb-4">
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            {formType === "create" ? t("add_dialog_title") : t("update_dialog_title")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="pt-4">
                        <ClassForm
                            type={formType}
                            data={selectedClass}
                            setOpen={setIsDialogOpen}
                            onSuccess={handleFormSuccess}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
