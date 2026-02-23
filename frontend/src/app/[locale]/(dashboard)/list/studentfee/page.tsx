"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
    Plus, 
    CreditCard, 
    Users, 
    Settings, 
    ShieldCheck, 
    ShieldX,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight, 
    Filter,
    Search
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSocket } from "@/providers/SocketProvider";

// Components
import { StudentTable } from "@/components/finance/StudentTable";
import { FeeModal } from "@/components/finance/FeeModal";
import { BulkModal } from "@/components/finance/BulkModal";
import { PaymentModal } from "@/components/finance/PaymentModal";
import { HistoryDrawer } from "@/components/finance/HistoryDrawer";
import { 
    StudentWithFinance, 
    FeeTemplate, 
    TransactionHistory 
} from "@/components/finance/types";
import { Input } from "@/components/ui/input";

export default function StudentFinancialDashboard() {
    const t = useTranslations("finance.studentFees");
    const locale = useLocale();
    const isRtl = locale === 'ar';

    const [students, setStudents] = useState<StudentWithFinance[]>([]);
    const [templates, setTemplates] = useState<FeeTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSystemPaid, setIsSystemPaid] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { refreshKey } = useSocket();

    // Modals state
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const [selectedStudent, setSelectedStudent] = useState<StudentWithFinance | null>(null);
    const [history, setHistory] = useState<TransactionHistory[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Pagination & Filters State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [classId, setClassId] = useState<string>("all");
    const [status, setStatus] = useState<string>("ALL");
    const [classes, setClasses] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchClasses = async () => {
        try {
            const res = await api.get("/class?limit=100");
            // Handle different possible response structures
            if (res.data && Array.isArray(res.data.classes)) {
                setClasses(res.data.classes);
            } else if (Array.isArray(res.data)) {
                setClasses(res.data);
            } else {
                setClasses([]);
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
            setClasses([]);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [studentRes, templateRes, paidRes] = await Promise.all([
                api.get("/student/list", {
                    params: {
                        page,
                        limit,
                        classId: classId !== "all" ? classId : undefined,
                        status: status !== "ALL" ? status : undefined,
                    }
                }),
                api.get("/fees/templates"),
                api.get("/parameter/School_System_Paid"),
            ]);
            
            setStudents(studentRes.data.students);
            setTotalPages(studentRes.data.totalPages);
            setTemplates(templateRes.data);
            setIsSystemPaid(paidRes.data?.okActive || false);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            toast.error(t("messages.load_error"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchData();
    }, [refreshKey, page, limit, classId, status]);

    // Optimistic UI for students list (specifically for fee operations if needed, but easier to just refresh or use specific optimistic state)
    // The user asked to "use" or "use optimse" for "add fee if fee is add not add for second time"
    // This implies we should optimistically add the fee to the UI or at least disable the button.
    // Let's use `useOptimistic` to handle the history or the student's due amount.
    // Since `useOptimistic` works best with Server Actions or similar patterns, and here we are using client-side `api` calls,
    // we can still use it by manually updating the state before the API call returns.

    // However, `useOptimistic` expects to be driven by a state that is updated by the server (returns to source of truth).
    // Here we have `students` state.
    // Let's wrap `students` in `useOptimistic`.

    const [optimisticStudents, addOptimisticStudentOp] = React.useOptimistic(
        students,
        (state, action: { type: 'add_fee' | 'delete_fee', studentId: number, amount: number }) => {
            return state.map(s => {
                if (s.studentId === action.studentId) {
                    const newTotalDue = action.type === 'add_fee' 
                        ? s.financial.totalDue + action.amount 
                        : s.financial.totalDue - action.amount;
                    
                    return {
                        ...s,
                        financial: {
                            ...s.financial,
                            totalDue: newTotalDue,
                            balance: newTotalDue - s.financial.totalPaid
                        }
                    };
                }
                return s;
            });
        }
    );

    const handleNewFee = async (data: any) => {
        const amount = parseFloat(data.amount);
        const studentId = parseInt(data.studentId);
        
        // Optimistic update
        startTransition(() => {
            addOptimisticStudentOp({ type: 'add_fee', studentId, amount });
        });

        try {
            await api.post("/fees/manual", data);
            toast.success(t("messages.fee_assigned"));
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t("messages.assign_error"));
            // Revert is automatic when `students` state updates from fetchData, 
            // but if fetchData fails, we might need to rollback. 
            // In `useOptimistic`, the state resets when the underlying `students` state changes or if we don't commit.
            // Actually, if we just fetch data it will sync.
            // If error, we should probably fetch data to be sure.
             fetchData();
        }
    };

    const handleBulkSubscribe = async (data: { templateId: number, dueDate: string }) => {
        try {
            await api.post("/fees/subscribe-all", data);
            toast.success(t("messages.bulk_success"));
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t("messages.bulk_error"));
        }
    };

    const fetchHistory = async (studentId: number) => {
        setIsLoadingHistory(true);
        try {
            const res = await api.get(`/payments/student/${studentId}/history`);
            setHistory(res.data);
        } catch (error) {
            toast.error(t("messages.history_error"));
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleDeleteFee = async (feeId: number) => {
        // We need to know the amount to optimistically update. 
        // This is hard without passing the amount from the UI.
        // For now, let's just do standard update or try to find the fee in history if available.
        // The `HistoryDrawer` passes the ID.
        // Let's rely on standard fetch for delete to ensure accuracy, or pass amount if we update `HistoryDrawer`.
        // User asked for "add fee" check.
        try {
             await api.delete(`/fees/${feeId}`);
            toast.success(t("messages.delete_success"));
            if (selectedStudent) {
                fetchHistory(selectedStudent.studentId);
                fetchData();
            }
        } catch (error) {
            toast.error(t("messages.delete_error"));
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-8 space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className={cn("space-y-2", isRtl && "text-right")}>
                    <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                        <div className="w-12 h-12 bg-gray-900 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-[-5deg] hover:rotate-0 transition-transform cursor-pointer">
                            <CreditCard size={24} />
                        </div>
                        <h1 className="text-4xl font-[1000] tracking-tighter text-gray-900 dark:text-gray-100 uppercase">
                            {t("title_part1")} <span className="text-blue-600 dark:text-blue-400">{t("title_part2")}</span>
                        </h1>
                    </div>
                    <p className={cn("text-gray-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2", isRtl && "flex-row-reverse")}>
                        {t("subtitle")}
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-800" />
                        {t("subtitle_extra")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-2xl border-2 transition-all shadow-sm",
                        isRtl && "flex-row-reverse",
                        isSystemPaid 
                            ? "bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400" 
                            : "bg-gray-50 border-gray-100 text-gray-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500"
                    )}>
                        {isSystemPaid ? <ShieldCheck size={18} /> : <ShieldX size={18} />}
                        <span className="text-xs font-black uppercase tracking-widest">
                            {t("system_status.label")}: {isSystemPaid ? t("system_status.paid") : t("system_status.free")}
                        </span>
                    </div>

                    <Button 
                        onClick={() => setIsBulkModalOpen(true)}
                        variant="outline" 
                        className={cn("rounded-2xl h-12 px-6 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-100 dark:hover:border-amber-900/30 transition-all font-black text-xs uppercase tracking-widest gap-2 shadow-sm bg-white dark:bg-slate-900", isRtl && "flex-row-reverse")}
                    >
                        <Users size={18} />
                        {t("bulk_subscribe")}
                    </Button>

                    <Button 
                        onClick={() => {
                            setSelectedStudent(null);
                            setIsFeeModalOpen(true);
                        }}
                        variant="outline"
                        className={cn("rounded-2xl h-12 px-6 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all font-black text-xs uppercase tracking-widest gap-2 shadow-sm bg-white dark:bg-slate-900", isRtl && "flex-row-reverse")}
                    >
                        <Plus size={18} />
                        {t("new_fee")}
                    </Button>

                    {/* Floating Action Button (Optional for Mobile) */}
                        <Button
                            onClick={fetchData}
                            size="icon"
                            className="h-14 w-14 rounded-2xl bg-white border border-gray-100 shadow-2xl text-gray-400 hover:text-blue-600 group active:scale-95"
                        >
                            <RefreshCw className={cn("h-6 w-6 group-hover:rotate-180 transition-transform duration-500", isLoading && "animate-spin")} />
                        </Button>

                    <Button 
                        onClick={() => {
                            setIsPaymentModalOpen(true);
                        }}
                        className={cn("rounded-2xl h-12 px-8 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-all font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-gray-900/10 dark:shadow-blue-900/30 active:scale-95 border-none", isRtl && "flex-row-reverse")}
                    >
                        <CreditCard size={18} />
                        {t("collect_payment")}
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats (Optional but would look nice) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Quick summary cards could go here */}
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input 
                            placeholder={t("search_placeholder")} 
                            defaultValue={searchTerm}
                            onChange={(e) => {
                                const value = e.target.value;
                                startTransition(() => {
                                    setSearchTerm(value);
                                });
                            }}
                            className={cn("rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium", isRtl ? "pr-9 text-right" : "pl-9")}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {/* Indicate loading state during transition */}
                    {isPending && (
                        <div className="text-xs font-bold text-gray-400 animate-pulse uppercase tracking-widest whitespace-nowrap">
                            {t("status.updating")}
                        </div>
                    )}
                    <div className={cn("flex items-center gap-2 min-w-fit", isRtl && "flex-row-reverse")}>
                         <Filter className="text-gray-400" size={16} />
                         <span className="text-xs font-black uppercase tracking-widest text-gray-500">{t("filters.label")}</span>
                    </div>
                    
                    <Select value={classId} onValueChange={(v) => { setClassId(v); setPage(1); }}>
                        <SelectTrigger className={cn("w-[180px] rounded-xl border-gray-200 dark:border-slate-800 font-bold bg-gray-50/50 dark:bg-slate-950", isRtl && "flex-row-reverse")}>
                            <SelectValue placeholder={t("filters.all_classes")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <SelectItem value="all" className={cn("font-bold cursor-pointer", isRtl && "text-right")}>{t("filters.all_classes")}</SelectItem>
                            {classes.map((cls: any) => (
                                <SelectItem key={cls.id || cls.classId} value={String(cls.id || cls.classId)} className={cn("font-bold cursor-pointer", isRtl && "text-right")}>
                                    {cls.name || cls.ClassName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                        <SelectTrigger className={cn("w-[180px] rounded-xl border-gray-200 dark:border-slate-800 font-bold bg-gray-50/50 dark:bg-slate-950", isRtl && "flex-row-reverse")}>
                            <SelectValue placeholder={t("filters.all_status")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <SelectItem value="ALL" className={cn("font-bold cursor-pointer", isRtl && "text-right")}>{t("filters.all_status")}</SelectItem>
                            <SelectItem value="PAID" className={cn("font-bold cursor-pointer text-emerald-600", isRtl && "text-right")}>{t("status.paid")}</SelectItem>
                            <SelectItem value="PARTIAL" className={cn("font-bold cursor-pointer text-amber-600", isRtl && "text-right")}>{t("status.partial")}</SelectItem>
                            <SelectItem value="UNPAID" className={cn("font-bold cursor-pointer text-blue-600", isRtl && "text-right")}>{t("status.unpaid")}</SelectItem>
                             <SelectItem value="OVERDUE" className={cn("font-bold cursor-pointer text-rose-600", isRtl && "text-right")}>{t("status.overdue")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="relative">
                <StudentTable 
                    students={optimisticStudents.filter(s => 
                        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )}
                    loading={isLoading}
                    onSubscribe={(s) => {
                        setSelectedStudent(s);
                        setIsFeeModalOpen(true);
                    }}
                    onPay={(s) => {
                        setSelectedStudent(s);
                        setIsPaymentModalOpen(true);
                    }}
                    onViewHistory={(s) => {
                        setSelectedStudent(s);
                        setIsHistoryOpen(true);
                        fetchHistory(s.studentId);
                    }}
                />
                
                {isLoading && (
                    <div className="absolute inset-0 bg-white/20 dark:bg-slate-950/40 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center z-50 transition-all">
                         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-gray-50 dark:border-slate-800 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                            <p className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-[0.2em]">{t("status.loading")}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination (Bottom) */}
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                 <div className="text-gray-500 text-sm font-medium">
                    {t("pagination.showing")} <span className="font-bold text-gray-900 dark:text-gray-100">{students.length}</span> {t("pagination.of")} <span className="font-bold text-gray-900 dark:text-gray-100">{totalPages * limit}</span> {t("pagination.results")}
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {t("pagination.page")} {page} {t("pagination.of")} {totalPages || 1}
                     </span>
                     <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="rounded-xl w-10 h-10 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || isLoading}
                            className="rounded-xl w-10 h-10 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                            <ChevronRight size={16} />
                        </Button>
                     </div>
                 </div>
            </div>

            {/* Modals & Drawers */}
            <FeeModal 
                open={isFeeModalOpen}
                onOpenChange={setIsFeeModalOpen}
                templates={templates}
                students={students}
                initialStudent={selectedStudent}
                onConfirm={handleNewFee}
            />

            <BulkModal 
                open={isBulkModalOpen}
                onOpenChange={setIsBulkModalOpen}
                templates={templates}
                onConfirm={handleBulkSubscribe}
            />

            <PaymentModal 
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                student={selectedStudent}
                onSuccess={fetchData}
            />

            <HistoryDrawer 
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                student={selectedStudent}
                history={history}
                loading={isLoadingHistory}
                onDeleteFee={handleDeleteFee}
            />

            
        </div>
    );
}

// Utility to merge tailwind classes
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
