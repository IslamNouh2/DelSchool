"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Wallet, Banknote, Landmark, Globe, Loader2, ArrowRight } from "lucide-react";
import { StudentWithFinance } from "./types";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: StudentWithFinance | null;
    onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, student, onSuccess }: PaymentModalProps) {
    const t = useTranslations("finance.studentFees.modals.payment");
    const locale = useLocale();
    const isRtl = locale === 'ar';

    const paymentMethods = [
        { id: "CASH", label: t("methods.CASH"), icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
        { id: "BANK_TRANSFER", label: t("methods.BANK_TRANSFER"), icon: Landmark, color: "text-blue-600 bg-blue-50" },
        { id: "CARD", label: t("methods.CARD"), icon: Wallet, color: "text-indigo-600 bg-indigo-50" },
        { id: "ONLINE", label: t("methods.ONLINE"), icon: Globe, color: "text-amber-600 bg-amber-50" },
    ];

    const [amount, setAmount] = React.useState<string>("");
    const [method, setMethod] = React.useState<string>("CASH");
    const [reference, setReference] = React.useState<string>("");
    const [loading, setLoading] = React.useState(false);
    const [pendingFees, setPendingFees] = React.useState<any[]>([]);
    const [loadingFees, setLoadingFees] = React.useState(false);
    const [selectedFeeId, setSelectedFeeId] = React.useState<string>("");
    const [comptes, setComptes] = React.useState<any[]>([]);
    const [selectedCompteId, setSelectedCompteId] = React.useState<string>("");

    const fetchPendingFees = async (id: number) => {
        setLoadingFees(true);
        try {
            const res = await api.get(`/student/${id}/pending-fees`);
            setPendingFees(res.data || []);
            if (res.data?.length > 0) {
                setSelectedFeeId(String(res.data[0].id));
                setAmount(String(res.data[0].remaining));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingFees(false);
        }
    };

    const fetchComptes = async () => {
        try {
            const res = await api.get("/compte?limit=100");
            const allComptes = res.data.comptes || res.data || [];
            // Filter for Caisse and Banque
            const paymentAccounts = allComptes.filter((c: any) => 
                c.category === 'CAISSE' || c.category === 'BANQUE'
            );
            setComptes(paymentAccounts);
            
            // Set default if exists
            if (paymentAccounts.length > 0 && !selectedCompteId) {
                setSelectedCompteId(String(paymentAccounts[0].id));
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
            toast.error(t("error_load_accounts"));
        }
    };

    React.useEffect(() => {
        if (student && open) {
            fetchPendingFees(student.studentId);
            fetchComptes();
        } else {
            setPendingFees([]);
            setSelectedFeeId("");
            setAmount("");
            // Don't necessarily reset accounts to avoid refetching every time if we wanted to cache, 
            // but for safety let's keep it simple or maybe just don't reset selectedCompteId if valid?
            // Let's reset for fresh state.
            // setSelectedCompteId(""); 
        }
    }, [student, open]);

    const handleAmountChange = (val: string) => {
        const num = parseFloat(val);
        const fee = pendingFees.find(f => String(f.id) === selectedFeeId);
        if (fee && num > fee.remaining) {
            setAmount(String(fee.remaining));
        } else {
            setAmount(val);
        }
    };

    const handleFeeChange = (id: string) => {
        setSelectedFeeId(id);
        const fee = pendingFees.find(f => String(f.id) === id);
        if (fee) setAmount(String(fee.remaining));
    };

    const handleSubmit = async () => {
        if (!selectedFeeId || !amount || parseFloat(amount) <= 0) return;
        if (!selectedCompteId) {
            toast.error(t("error_account"));
            return;
        }

        setLoading(true);
        try {
            await api.post("/payments/collect", {
                feeId: parseInt(selectedFeeId),
                amount: parseFloat(amount),
                method,
                reference,
                compteId: parseInt(selectedCompteId)
            });
            toast.success(t("success"));
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors du paiement");
        } finally {
            setLoading(false);
        }
    };

    const selectedFee = pendingFees.find(f => String(f.id) === selectedFeeId);
    const remainingAfter = selectedFee ? selectedFee.remaining - (parseFloat(amount) || 0) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                        <Wallet size={120} />
                    </div>
                    <DialogHeader className={cn("relative z-10", isRtl ? "text-right" : "text-left")}>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                            {t("title")}
                        </DialogTitle>
                        <DialogDescription className="text-emerald-100 font-bold text-xs uppercase tracking-widest opacity-80">
                            {student?.lastName} {student?.firstName} • {student?.code}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                        <div className={cn("bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20", isRtl && "text-right")}>
                            <p className="text-[10px] font-black uppercase text-emerald-200 tracking-widest mb-1">{t("balance")}</p>
                            <p className="text-2xl font-black">{student?.financial.balance.toLocaleString()} <span className="text-xs">DA</span></p>
                        </div>
                        <div className={cn("bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20", isRtl && "text-right")}>
                            <p className="text-[10px] font-black uppercase text-emerald-200 tracking-widest mb-1">{t("total_paid")}</p>
                            <p className="text-2xl font-black">{student?.financial.totalPaid.toLocaleString()} <span className="text-xs">DA</span></p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {loadingFees ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-200 tracking-widest">{t("loading_fees")}</p>
                        </div>
                    ) : pendingFees.length > 0 ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1", isRtl && "text-right block")}>{t("destination_account")}</Label>
                                <Select value={selectedCompteId} onValueChange={setSelectedCompteId}>
                                    <SelectTrigger className={cn("rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-black text-gray-900 dark:text-gray-100 shadow-sm bg-gray-50/50 dark:bg-slate-950/50 hover:bg-gray-50 dark:hover:bg-slate-950 transition-colors", isRtl && "flex-row-reverse")}>
                                        <SelectValue placeholder={t("placeholder_account")} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900 dark:text-gray-200">
                                        {comptes.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)} className={cn("font-bold py-4 rounded-xl focus:bg-emerald-50 dark:focus:bg-emerald-900/20", isRtl && "flex-row-reverse text-right")}>
                                                <div className="flex flex-col">
                                                    <span>{c.name}</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">{c.category}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1", isRtl && "text-right block")}>{t("invoice")}</Label>
                                <Select value={selectedFeeId} onValueChange={handleFeeChange}>
                                    <SelectTrigger className={cn("rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-black text-gray-900 dark:text-gray-100 shadow-sm bg-gray-50/50 dark:bg-slate-950/50 hover:bg-gray-50 dark:hover:bg-slate-950 transition-colors", isRtl && "flex-row-reverse")}>
                                        <SelectValue placeholder={t("placeholder_invoice")} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900 dark:text-gray-200">
                                        {pendingFees.map(f => (
                                            <SelectItem key={f.id} value={String(f.id)} className={cn("font-bold py-4 rounded-xl focus:bg-emerald-50 dark:focus:bg-emerald-900/20", isRtl && "flex-row-reverse text-right")}>
                                                <div className="flex flex-col">
                                                    <span>{f.title}</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">{isRtl ? "المتبقي" : "Reste"}: {f.remaining.toLocaleString()} DA</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1", isRtl && "text-right block")}>{t("amount_to_collect")}</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={amount} 
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            className={cn("rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-black text-2xl text-emerald-600 dark:text-emerald-400 shadow-sm bg-gray-50/50 dark:bg-slate-950/50 focus-visible:ring-emerald-500 transition-colors", isRtl ? "pr-6 pl-12 text-right" : "pl-6 pr-12")}
                                        />
                                        <span className={cn("absolute top-1/2 -translate-y-1/2 text-xs font-black text-emerald-300 dark:text-emerald-900", isRtl ? "left-6" : "right-6")}>DA</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1", isRtl && "text-right block")}>{t("payment_method")}</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className={cn("rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-black shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-100", isRtl && "flex-row-reverse")}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900 dark:text-gray-200">
                                            {paymentMethods.map(m => (
                                                <SelectItem key={m.id} value={m.id} className={cn("font-bold py-4 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20", isRtl && "flex-row-reverse text-right")}>
                                                    <div className="flex items-center gap-3">
                                                        <m.icon className={cn("w-4 h-4", m.color.split(' ')[0])} />
                                                        <span>{m.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                             {amount && selectedFee && (
                                <div className="bg-gray-50 dark:bg-slate-950/40 rounded-3xl p-6 flex items-center justify-between border border-gray-100 dark:border-slate-800 overflow-hidden relative group transition-colors">
                                    <div className={cn("relative z-10", isRtl && "text-right")}>
                                        <p className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest mb-1">{t("remaining_after")}</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{remainingAfter.toLocaleString()} <span className="text-xs">DA</span></p>
                                    </div>
                                    <div className="relative z-10 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <ArrowRight className={cn("text-emerald-500 dark:text-emerald-400", isRtl && "rotate-180")} />
                                    </div>
                                    <div className={cn("absolute top-0 h-full w-1/3 bg-gradient-to-l from-emerald-50/50 dark:from-emerald-900/10 to-transparent pointer-events-none", isRtl ? "left-0 rotate-180" : "right-0")} />
                                </div>
                            )}

                            <Button 
                                onClick={handleSubmit}
                                disabled={loading || !selectedFeeId || !amount}
                                className="w-full bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-[2rem] h-16 font-black shadow-xl shadow-emerald-600/20 dark:shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    t("confirm")
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-slate-950/40 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800 transition-colors">
                             <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full mx-auto flex items-center justify-center text-emerald-200 dark:text-emerald-900 shadow-sm mb-6">
                                <Banknote size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">{t("no_fees_title")}</h3>
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest max-w-[250px] mx-auto leading-relaxed">
                                {t("no_fees_desc")}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
