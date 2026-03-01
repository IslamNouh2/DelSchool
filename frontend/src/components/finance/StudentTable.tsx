"use client";

import React from "react";
import { 
    Search, 
    MoreHorizontal, 
    History, 
    CreditCard, 
    Plus, 
    User
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudentWithFinance, FinancialStatus } from "./types";
import { cn } from "@/lib/utils";
import { SyncStatusBadge } from "@/components/pwa/SyncStatusBadge";

interface StudentTableProps {
    students: StudentWithFinance[];
    onSubscribe: (student: StudentWithFinance) => void;
    onPay: (student: StudentWithFinance) => void;
    onViewHistory: (student: StudentWithFinance) => void;
    loading?: boolean;
}

const statusConfig: Record<FinancialStatus, { key: string, color: string }> = {
    PAID: { key: "status.PAID", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50" },
    PARTIAL: { key: "status.PARTIAL", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50" },
    OVERDUE: { key: "status.OVERDUE", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/50" },
    UPCOMING: { key: "status.UPCOMING", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50" },
};

export function StudentTable({ students, onSubscribe, onPay, onViewHistory, loading }: StudentTableProps) {
    const t = useTranslations("finance.studentFees");
    const locale = useLocale();
    const isRtl = locale === 'ar';


    return (
        <div className="rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden transition-colors">
            <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-950/50">
                        <TableRow className="border-b border-gray-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className={cn("font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest py-4", isRtl ? "pr-8 text-right" : "pl-8 text-left")}>{t("table.student")}</TableHead>
                            <TableHead className={cn("font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest", isRtl ? "text-right" : "text-left")}>{t("table.class")}</TableHead>
                            <TableHead className={cn("font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest", isRtl ? "text-right" : "text-left")}>{t("table.subscriptions")}</TableHead>
                            <TableHead className={cn("font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-right", isRtl ? "text-left" : "text-right")}>{t("table.total_due")}</TableHead>
                            <TableHead className={cn("font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-right", isRtl ? "text-left" : "text-right")}>{t("table.paid")}</TableHead>
                            <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-center">{t("table.status")}</TableHead>
                            <TableHead className={cn("font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest pr-8", isRtl ? "pl-8 text-left" : "pr-8 text-right")}>{t("table.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={7} className="h-24 bg-gray-50/20 dark:bg-slate-800/20" />
                                </TableRow>
                            ))
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                                            <Search className="h-8 w-8 text-gray-200 dark:text-slate-700" />
                                        </div>
                                        <p className="font-bold uppercase text-xs tracking-widest">{t("empty_search")}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student) => (
                                <TableRow key={student.studentId} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0">
                                    <TableCell className={cn("py-5", isRtl ? "pr-8" : "pl-8")}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                {student.photoUrl ? (
                                                    <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-blue-300 dark:text-blue-900" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                                                      {student.lastName} {student.firstName}
                                                  </span>
                                                  <SyncStatusBadge id={student.studentId} isPending={!!student.pendingSync} />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-tighter">
                                                    {student.code}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-slate-400 font-black text-[10px] px-2 py-0.5 uppercase">
                                            {student.studentClasses?.[0]?.Class?.ClassName || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {student.financial.subscriptions.slice(0, 2).map((sub, i) => (
                                                <span key={i} className="text-[9px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-900/30">
                                                    {sub}
                                                </span>
                                            ))}
                                            {student.financial.subscriptions.length > 2 && (
                                                <span className="text-[9px] font-bold text-gray-400">
                                                    +{student.financial.subscriptions.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900 dark:text-gray-100 text-right">
                                        {student.financial.totalDue.toLocaleString()} <span className="text-[9px] text-gray-400 dark:text-slate-500 ml-0.5">DA</span>
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                        {student.financial.totalPaid.toLocaleString()} <span className="text-[9px] text-emerald-300 dark:text-emerald-900 ml-0.5">DA</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={cn(
                                            "rounded-full px-3 py-1 text-[9px] font-black border uppercase shadow-sm",
                                            statusConfig[student.financial.status].color
                                        )}>
                                            {t(statusConfig[student.financial.status].key)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={cn(isRtl ? "pl-8 text-left" : "pr-8 text-right")}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align={isRtl ? "start" : "end"} className="rounded-2xl p-2 border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900 dark:text-slate-300">
                                                <DropdownMenuLabel className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 px-3 py-2", isRtl && "text-right")}>{t("actions.finance")}</DropdownMenuLabel>
                                                <DropdownMenuItem 
                                                    onClick={() => onSubscribe(student)}
                                                    className={cn("rounded-xl px-3 py-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-600 dark:focus:text-blue-400 transition-colors", isRtl && "flex-row-reverse text-right")}
                                                >
                                                    <Plus className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                                                    <span className="font-bold text-xs uppercase">{t("actions.subscribe")}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => onPay(student)}
                                                    className={cn("rounded-xl px-3 py-2 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/30 focus:text-emerald-600 dark:focus:text-emerald-400 transition-colors", isRtl && "flex-row-reverse text-right")}
                                                >
                                                    <CreditCard className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                                                    <span className="font-bold text-xs uppercase">{t("actions.collect")}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-50 dark:bg-slate-800 my-1" />
                                                <DropdownMenuItem 
                                                    onClick={() => onViewHistory(student)}
                                                    className={cn("rounded-xl px-3 py-2 cursor-pointer focus:bg-gray-100 dark:focus:bg-slate-800 transition-colors", isRtl && "flex-row-reverse text-right")}
                                                >
                                                    <History className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                                                    <span className="font-bold text-xs uppercase">{t("actions.history")}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
    );
}
