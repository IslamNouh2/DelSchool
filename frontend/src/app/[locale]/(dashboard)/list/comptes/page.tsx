"use client";

import { useState, useEffect, useCallback, useMemo, useTransition, useOptimistic, Suspense } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, Edit, Trash2, Columns3, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { CustomTable } from "@/components/CustomTable";
import { useSocket } from "@/providers/SocketProvider";
import CompteForm from "@/components/forms/CompteForm";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Compte {
    id: number;
    name: string;
    parentId: number;
    BG: number;
    BD: number;
    level: number;
    category: string;
    nature: string;
    isPosted: boolean;
    parent?: {
        name: string;
    };
    employer?: {
        firstName: string;
        lastName: string;
        studentId: number;
    };
    student?: {
        firstName: string;
        lastName: string;
    };
}

export default function CompteListPage() {
    const [data, setData] = useState<Compte[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
    const { refreshKey } = useSocket();
    const t = useTranslations("finance.accounts");
    const tCommon = useTranslations("common");

    // Data Promises for CompteForm (React 19 pattern)
    const [formPromises, setFormPromises] = useState<{
        parents: Promise<any>;
        employers: Promise<any>;
        students: Promise<any>;
    } | null>(null);

    // Dynamic resource fetching
    const refreshFormPromises = useCallback(() => {
        setFormPromises({
            parents: api.get("/compte?limit=100").then(res => res.data),
            employers: api.get("/employer/list?limit=100").then(res => res.data),
            students: api.get("/student/list?limit=100").then(res => res.data)
        });
    }, []);

    // Enhanced Optimistic Data
    const [optimisticData, setOptimisticData] = useOptimistic(
        data,
        (state, { type, id, payload }: { type: 'delete' | 'update-status' | 'create' | 'update'; id?: number; payload?: any }) => {
            switch (type) {
                case 'delete':
                    return state.filter(item => item.id !== id);
                case 'update-status':
                    return state.map(item => item.id === id ? { ...item, isPosted: payload } : item);
                case 'create':
                    if (state.some(item => item.id === payload.id)) return state;
                    return [payload, ...state];
                case 'update':
                    return state.map(item => item.id === payload.id ? { ...item, ...payload } : item);
                default:
                    return state;
            }
        }
    );

    const [columnVisibility, setColumnVisibility] = useState({
        name: true,
        type: true,
        parent: true,
        isPosted: true,
        category: true,
        actions: true,
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedCompte, setSelectedCompte] = useState<Compte | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterValue(filterValue);
        }, 500);
        return () => clearTimeout(timer);
    }, [filterValue]);

    const fetchData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/compte", {
                params: {
                    page,
                    limit: pageSize,
                    name: debouncedFilterValue,
                },
            });
            setData(response.data.comptes);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        } finally {
            setLoading(false);
        }
    }, [pageSize, debouncedFilterValue]);

    const handleDelete = useCallback(async (id: number) => {
        if (!confirm(t("messages.delete_confirm"))) return;
        
        startTransition(async () => {
            // Optimistic delete
            setOptimisticData({ type: 'delete', id });
            try {
                await api.delete(`/compte/${id}`);
                toast.success(t("messages.delete_success"));
                fetchData(currentPage);
            } catch (error) {
                toast.error(t("messages.delete_error"));
            }
        });
    }, [currentPage, fetchData, setOptimisticData, t]);

    const togglePostedStatus = useCallback(async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        
        startTransition(async () => {
            // Optimistic update
            setOptimisticData({ type: 'update-status', id, payload: newStatus });
            try {
                await api.patch(`/compte/${id}`, { isPosted: newStatus });
                toast.success(newStatus ? t("messages.update_success") : t("messages.draft"));
                fetchData(currentPage);
            } catch (error) {
                toast.error(t("messages.save_error"));
            }
        });
    }, [currentPage, fetchData, setOptimisticData, t]);

    const handleFormSuccess = (newItem: any) => {
        startTransition(() => {
            setOptimisticData({ 
                type: formType === "create" ? "create" : "update", 
                payload: newItem 
            });
            fetchData(currentPage);
            refreshFormPromises(); // Update dependencies for future forms
        });
    };

    const handleUpdate = (compte: Compte) => {
        setSelectedCompte(compte);
        setFormType("update");
        refreshFormPromises();
        setIsDialogOpen(true);
    };

    const handleAddCompte = () => {
        setSelectedCompte(null);
        setFormType("create");
        refreshFormPromises();
        setIsDialogOpen(true);
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, debouncedFilterValue, fetchData, refreshKey]);

    const columns = useMemo(() => [
        {
            header: t("table.name"),
            key: "name",
            visible: columnVisibility.name,
            render: (compte: Compte) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter">{compte.name}</span>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest leading-none">{compte.nature}</span>
                </div>
            )
        },
        {
            header: t("table.parent"),
            key: "parent",
            visible: columnVisibility.parent,
            render: (compte: Compte) => (
                <span className="text-xs font-bold text-muted-foreground uppercase">{compte.parent?.name || "-"}</span>
            ),
        },
        {
            header: t("table.category"),
            key: "category",
            visible: columnVisibility.category,
            render: (compte: Compte) => {
                const isSystem = compte.employer || compte.student;
                let badgeColor = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
                
                if (compte.employer) {
                    badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
                } else if (compte.student) {
                    badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                } else if (compte.category === "CAISSE" || compte.category === "BANQUE") {
                    badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
                }

                return (
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${badgeColor}`}>
                            {compte.category}
                        </span>
                        {isSystem && (
                            <span className="text-[9px] font-bold text-gray-400 italic">
                                ({compte.employer ? t("types.employer") : t("types.student")})
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: t("table.status"),
            key: "isPosted",
            visible: columnVisibility.isPosted,
            render: (compte: Compte) => (
                <button 
                    onClick={() => togglePostedStatus(compte.id, compte.isPosted)}
                    disabled={isPending}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase transition-all hover:scale-105 ${compte.isPosted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' : 'bg-gray-50 text-gray-400 border border-gray-100 dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-800'}`}
                >
                    {compte.isPosted ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {compte.isPosted ? t("table.validated") : t("table.draft")}
                </button>
            ),
        },
        {
            header: t("table.actions"),
            key: "actions",
            visible: columnVisibility.actions,
            className: "text-right",
            render: (compte: Compte) => (
                <div className="flex items-center justify-end gap-2 text-blue-900/40 dark:text-blue-100/20">
                    <button onClick={() => handleUpdate(compte)} className="h-9 w-9 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl transition-all active:scale-90">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(compte.id)} className="h-9 w-9 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-xl transition-all active:scale-90">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        }
    ], [columnVisibility, togglePostedStatus, isPending, handleUpdate, handleDelete, t]);

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 dark:bg-slate-950">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-[1000] tracking-tight uppercase text-gray-900 dark:text-gray-100">
                        {t("title").split(" ")[0]} <span className="text-blue-600 font-black">{t("title").split(" ").slice(1).join(" ")}</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-12 bg-blue-600 rounded-full" />
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] dark:text-slate-500">{t("subtitle")}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => fetchData(currentPage)}
                        className="rounded-2xl border-gray-200 dark:border-slate-800 h-14 w-14 p-0 font-black shadow-sm group active:scale-95 bg-white dark:bg-slate-900"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleAddCompte} className="rounded-2xl gap-3 bg-blue-600 hover:bg-blue-700 h-14 px-8 font-black shadow-2xl shadow-blue-500/30 uppercase text-xs tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] text-white">
                        <Plus className="w-5 h-5" /> {t("new_account")}
                    </Button>
                </div>
            </div>

            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl border border-white/60 dark:border-slate-800/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-blue-500/10" />
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600/30" />
                        <input
                            type="text"
                            placeholder={t("filter_placeholder")}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full pl-16 pr-8 py-6 border-none bg-white/80 dark:bg-slate-950/80 rounded-[2rem] focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 font-black text-sm placeholder:text-blue-900/20 dark:placeholder:text-blue-100/20 shadow-xl shadow-blue-900/5 transition-all outline-none dark:text-gray-100"
                        />
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[3rem] overflow-hidden group">
                <CardContent className="p-0">
                    <CustomTable
                        data={optimisticData}
                        loading={loading}
                        rowKey={(compte) => compte.id}
                        columns={columns}
                    />
                </CardContent>
            </Card>

            {isDialogOpen && formPromises && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 animate-pulse">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            <span className="font-black text-xs uppercase tracking-widest text-gray-400">{t("messages.preparing_form")}</span>
                        </div>
                    </div>
                }>
                    <CompteForm
                        type={formType}
                        data={selectedCompte}
                        promises={formPromises}
                        setOpen={setIsDialogOpen}
                        onSuccess={handleFormSuccess}
                    />
                </Suspense>
            )}

            {isPending && (
                <div className="fixed bottom-12 right-12 bg-gray-900/90 dark:bg-slate-900/90 backdrop-blur-xl text-white px-10 py-5 rounded-[2.5rem] flex items-center gap-5 shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-500 border border-white/10 dark:border-slate-800">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur animate-ping opacity-20" />
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400 relative z-10" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-400">{t("messages.transaction")}</span>
                        <span className="font-bold text-xs uppercase tracking-widest">{t("messages.operation_in_progress")}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
