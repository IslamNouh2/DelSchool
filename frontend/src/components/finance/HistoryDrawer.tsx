"use client";

import React from "react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle 
} from "@/components/ui/sheet";
import { 
    User, 
    Calendar,
    ArrowUpRight,
    Loader2,
    History as HistoryIcon,
    Trash2
} from "lucide-react";
import { format } from "date-fns";
import { fr, arDZ, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { TransactionHistory, StudentWithFinance } from "./types";
import { cn } from "@/lib/utils";

interface HistoryDrawerProps {
    student: StudentWithFinance | null;
    history: TransactionHistory[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading?: boolean;
    onDeleteFee?: (id: number) => void;
}

export function HistoryDrawer({ student, history, open, onOpenChange, loading, onDeleteFee }: HistoryDrawerProps) {
    const t = useTranslations("finance.studentFees.modals.history");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const dateLocale = locale === 'ar' ? arDZ : locale === 'fr' ? fr : enUS;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md rounded-l-[3.5rem] border-none shadow-2xl p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden flex flex-col">
                <div className="p-10 pb-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <HistoryIcon size={120} />
                    </div>
                    <SheetHeader className="text-left relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <SheetTitle className={cn("text-3xl font-black uppercase tracking-tighter text-white", isRtl && "text-right")}>
                                    {t("title")}
                                </SheetTitle>
                                <p className={cn("text-blue-100 font-bold text-xs uppercase tracking-widest mt-1 opacity-80", isRtl && "text-right")}>
                                    {student?.lastName} {student?.firstName}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar dark:bg-slate-950/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                            <p className="text-[10px] font-black uppercase text-blue-900 dark:text-blue-200 tracking-widest animate-pulse">{t("sync")}</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-100 dark:before:from-blue-900/30 before:via-blue-50 dark:before:via-blue-900/10 before:to-transparent">
                            {history.map((item, idx) => {
                                const isFee = item.type === 'FEE';
                                return (
                                    <div key={idx} className="relative pl-10 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className={cn(
                                            "absolute top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-md z-10",
                                            isRtl ? "right-0" : "left-0",
                                            isFee ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                        )}>
                                            {isFee ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                        </div>
                                        
                                        <div className="group bg-white dark:bg-slate-900 rounded-[1.75rem] border border-gray-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl dark:hover:shadow-blue-950/20 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    isRtl && "text-right block w-full",
                                                    isFee ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                                )}>
                                                    {isFee ? t("fee_created") : t("payment_received")}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-950 px-2 py-0.5 rounded-full">
                                                        #{item.id}
                                                    </span>
                                                    {isFee && onDeleteFee && (
                                                        <button 
                                                            onClick={() => {
                                                                if(confirm(t("delete_confirm"))) {
                                                                    onDeleteFee(item.id);
                                                                }
                                                            }}
                                                            className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                                                            title="Supprimer le frais"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <h4 className={cn("text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight", isRtl && "text-right")}>
                                                {item.title || `Par ${item.method}`}
                                            </h4>
                                            
                                            <div className="flex justify-between items-end mt-4">
                                                <div className={cn("flex items-center gap-2 text-gray-400 dark:text-slate-500", isRtl && "flex-row-reverse")}>
                                                    <Calendar size={12} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                                                        {format(new Date(item.date), 'dd MMMM yyyy', { locale: dateLocale })}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-xl font-black tracking-tighter",
                                                    isFee ? "text-gray-900 dark:text-gray-100" : "text-emerald-600 dark:text-emerald-400"
                                                )}>
                                                    {isFee ? "-" : "+"}{item.amount.toLocaleString()} <span className="text-xs ml-0.5">DA</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center text-gray-200 dark:text-slate-700">
                                <HistoryIcon size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-gray-300 dark:text-slate-600 tracking-widest">{t("no_transactions")}</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
