"use client";

import React, { useEffect, useState } from "react";
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
import { ArrowRight, ArrowLeft, Loader2, Wallet } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accountId: number;
    accountName: string;
    type: 'DEBIT' | 'CREDIT'; // DEBIT = Encaissement (In), CREDIT = Décaissement (Out)
    onSuccess: (data: any) => Promise<void>;
    initialData?: any;
}

export function TransactionModal({ open, onOpenChange, accountId, accountName, type, onSuccess, initialData }: TransactionModalProps) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [contraAccountId, setContraAccountId] = useState("");
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetchAccounts();
            if (initialData) {
                setAmount(String(initialData.amount || initialData.debit || initialData.credit));
                setDescription(initialData.description);
                // We'd need to know the contraAccountId from initialData. 
                // Backend getTransactions doesn't return it easily yet.
                // Assuming the user might need to re-select it or we try to guess/fetch it?
                // For now let's leave it empty or if we had it.
                // Actually, let's leave it blank and force user to select if they want to change?
                // Or better, maybe we can pass it if we knew it.
                // For now, let's just prefill description and amount.
            } else {
                setAmount("");
                setDescription("");
                setContraAccountId("");
            }
        }
    }, [open, initialData]);

    const fetchAccounts = async () => {
        try {
            const res = await api.get("/compte?limit=100");
            const all = res.data.comptes || res.data || [];
            // If Type is DEBIT (In), we need Source (Income, etc.)
            // If Type is CREDIT (Out), we need Destination (Expense, etc.)
            // For now, let's list all eligible accounts (General, Income, Expense) excluding the current one
            const filtered = all.filter((c: any) => c.id !== accountId);
            setAccounts(filtered);
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        }
    };

    const handleSubmit = async () => {
        if (!amount || !contraAccountId || !description) return;
        setLoading(true);
        try {
            await onSuccess({
                amount: parseFloat(amount),
                type,
                description,
                contraAccountId: parseInt(contraAccountId)
            });
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            // toast is handled by parent or we can keep it here for generic error
        } finally {
            setLoading(false);
        }
    };

    const isDebit = type === 'DEBIT';
    const themeColor = isDebit ? "emerald" : "rose";
    const ThemeIcon = isDebit ? ArrowLeft : ArrowRight; // In vs Out logic visualization

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className={cn("p-8 text-white relative", isDebit ? "bg-emerald-600" : "bg-rose-600")}>
                     <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                        <Wallet size={100} />
                    </div>
                    <DialogHeader className="relative z-10 text-left">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <ThemeIcon size={24} />
                            </div>
                            {initialData ? "Modifier Transaction" : (isDebit ? "Encaissement" : "Décaissement")}
                        </DialogTitle>
                        <DialogDescription className="text-white/80 font-bold text-xs uppercase tracking-widest mt-2 pl-1">
                            {accountName}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">
                                {isDebit ? "Compte Source (Provenance)" : "Compte de Destination"}
                            </Label>
                            <Select value={contraAccountId} onValueChange={setContraAccountId}>
                                <SelectTrigger className="rounded-xl h-12 bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold">
                                    <SelectValue placeholder="Sélectionner un compte..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={String(acc.id)} className="font-medium">
                                            {acc.name} <span className="text-xs text-muted-foreground ml-2">({acc.category})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Montant</Label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="rounded-xl h-14 text-2xl font-black bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 pr-12"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">DA</span>
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Description / Motif</Label>
                            <Input 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="rounded-xl h-12 bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-medium"
                                placeholder="Motif de l'opération..."
                            />
                        </div>
                    </div>

                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading || !amount || !contraAccountId || !description}
                        className={cn(
                            "w-full h-14 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white",
                            isDebit ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-900/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-rose-900/20"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Confirmer"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
