"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import LocalForm from "@/components/forms/LocalForm";
import { useSocket } from "@/providers/SocketProvider";


interface Local {
    localId: number;
    name: string;
    code: string;
    NumClass: number;
}

export default function LocalListPage() {
    const [data, setData] = useState<Local[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
    
    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState({
        code: true,
        name: true,
        capacity: true,
        actions: true,
    });

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
    const { refreshKey } = useSocket();


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterValue(filterValue);
        }, 500);
        return () => clearTimeout(timer);
    }, [filterValue]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedFilterValue]);

    const fetchData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/local", {
                params: {
                    page,
                    limit: pageSize,
                    sort: "name",
                    search: debouncedFilterValue || undefined,
                },
            });
            
            setData(response.data.locals);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching locals:", error);
            toast.error("Failed to fetch locals");
        } finally {
            setLoading(false);
        }
    }, [pageSize, debouncedFilterValue]);

    const handleDelete = useCallback(async (id: number) => {
        if (!confirm("Are you sure you want to delete this local?")) return;
        try {
            await api.delete(`/local/${id}`);
            toast.success("Local deleted successfully");
            fetchData(currentPage);
        } catch (error) {
            console.error("Error deleting local:", error);
            toast.error("Failed to delete local");
        }
    }, [currentPage, fetchData]);

    const handleUpdate = useCallback((local: Local) => {
        setSelectedLocal(local);
        setFormType("update");
        setIsDialogOpen(true);
    }, []);

    const handleAddLocal = useCallback(() => {
        setSelectedLocal(null);
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
        setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
    }, []);

    const columns = useMemo(() => [
        {
            header: "Code",
            key: "code",
            visible: columnVisibility.code,
            className: "font-medium text-gray-900 dark:text-slate-100",
        },
        {
            header: "Name",
            key: "name",
            visible: columnVisibility.name,
            className: "text-gray-900 dark:text-slate-100",
        },
        {
            header: "Capacity",
            key: "capacity",
            visible: columnVisibility.capacity,
            render: (item: Local) => item.NumClass || "-",
            className: "text-gray-600 dark:text-slate-400",
        },
        {
            header: "Actions",
            key: "actions",
            visible: columnVisibility.actions,
            headerClassName: "text-right",
            className: "text-right font-medium",
            render: (item: Local) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleUpdate(item)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors group"
                    >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                    <button 
                        onClick={() => handleDelete(item.localId)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                    >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                    </button>
                </div>
            ),
        },
    ], [columnVisibility, handleUpdate, handleDelete]);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Locals
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage school rooms and locations
                    </p>
                </div>
                <Button 
                    onClick={handleAddLocal}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 border-none"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Local</span>
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                                    <Columns3 className="w-4 h-4" />
                                    <span>Columns</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 rounded-xl">
                                <DropdownMenuCheckboxItem checked={columnVisibility.code} onCheckedChange={() => toggleColumn('code')}>Code</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>Name</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={columnVisibility.capacity} onCheckedChange={() => toggleColumn('capacity')}>Capacity</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5 border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Local Table */}
            <CustomTable
                data={data}
                loading={loading}
                rowKey={(item) => item.localId}
                columns={columns}
                footer={!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> locals
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

            {/* Local Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl">
                    <DialogHeader className="border-b border-gray-100 dark:border-slate-800 pb-4">
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            {formType === "create" ? "Add New Local" : "Update Local Details"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="pt-4">
                        <LocalForm
                            type={formType}
                            data={selectedLocal}
                            setOpen={setIsDialogOpen}
                            onSuccess={handleFormSuccess}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
