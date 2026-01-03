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

    const fetchData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/local", {
                params: {
                    page,
                    limit: pageSize,
                    sort: "name", // Default sort
                },
            });
            
            let locals = response.data.locals;
            if (debouncedFilterValue) {
                locals = locals.filter((l: Local) => 
                    l.name.toLowerCase().includes(debouncedFilterValue.toLowerCase()) || 
                    l.code.toLowerCase().includes(debouncedFilterValue.toLowerCase())
                );
            }
            setData(locals);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">Locals</h1>
                    <p className="text-muted-foreground">Manage school rooms and locations</p>
                </div>
                <Button 
                    onClick={handleAddLocal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Local
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
                            <DropdownMenuCheckboxItem checked={columnVisibility.code} onCheckedChange={() => toggleColumn('code')}>Code</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.name} onCheckedChange={() => toggleColumn('name')}>Name</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={columnVisibility.capacity} onCheckedChange={() => toggleColumn('capacity')}>Capacity</DropdownMenuCheckboxItem>
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
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{formType === "create" ? "Add New Local" : "Update Local"}</DialogTitle>
                    </DialogHeader>
                    <LocalForm
                        type={formType}
                        data={selectedLocal}
                        setOpen={setIsDialogOpen}
                        onSuccess={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
