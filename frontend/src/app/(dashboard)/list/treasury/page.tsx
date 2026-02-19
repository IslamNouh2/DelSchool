"use client";

import React, { useEffect, useState, useTransition, useOptimistic } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    History, 
    TrendingUp, 
    TrendingDown,
    Building2,
    Loader2,
    Trash2,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionModal } from "@/components/finance/TransactionModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define Transaction Interface
interface Transaction {
    id: number;
    entryId?: number;
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    pending?: boolean; // For optimistic UI
    partnerAccount?: string;
    partnerCode?: string;
}

export default function TreasuryPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    
    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    
    // Concurrent Features
    const [isPending, startTransition] = useTransition();
    const [optimisticTransactions, setOptimisticTransactions] = useOptimistic(
        transactions,
        (state: Transaction[], action: { type: 'ADD' | 'UPDATE' | 'DELETE', payload: Transaction | number }) => {
            if (action.type === 'ADD') {
                return [action.payload as Transaction, ...state];
            } else if (action.type === 'UPDATE') {
                const tx = action.payload as Transaction;
                return state.map(t => t.id === tx.id ? tx : t);
            } else if (action.type === 'DELETE') {
                return state.filter(t => t.id !== action.payload);
            }
            return state;
        }
    );

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
    
    // Date filter states
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Initial Load of Accounts
    useEffect(() => {
        fetchAccounts();
    }, []);

    // Fetch Transactions when filters change
    useEffect(() => {
        if (selectedAccountId) {
            startTransition(() => {
                fetchTransactions(selectedAccountId);
            });
        }
    }, [selectedAccountId, startDate, endDate]);

    const fetchAccounts = async () => {
        try {
            const res = await api.get("/compte?limit=100");
            const all = res.data.comptes || res.data || [];
            const treasury = all.filter((c: any) => c.category === 'CAISSE' || c.category === 'BANQUE');
            setAccounts(treasury);
            if (treasury.length > 0 && !selectedAccountId) {
                // Determine initial selected account without transition or with?
                // Initial load doesn't need transition usually, just state set
                setSelectedAccountId(String(treasury[0].id));
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (id: string) => {
        // We don't set loading=true here to avoid blocking UI, 
        // rely on isPending from useTransition if possible but fetch is async...
        // Actually startTransition doesn't wait for async fetch unless we use Suspense or a specific pattern.
        // Standard pattern: 
        // startTransition(() => { setFilter(newVal) }) -> triggers effect -> fetch
        // BUT to mark fetch as pending, we usually need useDeferredValue or Suspense.
        // For manual fetch, we can just use a local 'isFetching' or rely on the fact 
        // that we are inside a transition if we update state *after* fetch? No.
        
        // Refined approach for React 18 without Suspense data fetching:
        // We want the UI to be responsive.
        // We will keep 'setLoading' false basically, and use isPending for visual cues?
        // Actually, let's use a separate isFetching state that doesn't block input.
        
        try {
            let url = `/compte/${id}/transactions`;
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            
            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const res = await api.get(url);
            
            // This state update will be low priority if called inside startTransition? 
            // Actually the Effect call isn't inside startTransition unless the dependency update was.
            // Let's just update the data.
            startTransition(() => {
                 setTransactions(res.data || []);
                 // Sync optimistic state if needed? 
                 // No, useOptimistic uses 'transactions' as base.
            });
           
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        }
    };

    const handleCreateTransaction = async (data: any) => {
        const tempId = Date.now();
        const newTx: Transaction = {
            id: tempId,
            date: new Date().toISOString(),
            reference: "...",
            description: data.description,
            debit: data.type === 'DEBIT' ? data.amount : 0,
            credit: data.type === 'CREDIT' ? data.amount : 0,
            pending: true
        };

        // 1. Optimistic Update
        startTransition(() => {
            setOptimisticTransactions({ type: 'ADD', payload: newTx });
        });

        // 2. API Call
        try {
            await api.post(`/compte/${selectedAccountId}/transaction`, data);
            toast.success("Transaction enregistrée");
            // 3. Refresh Real Data
            await fetchTransactions(selectedAccountId);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur");
            // Revert is automatic if we rely on 'transactions' state which hasn't changed if fetch fails?
            // Actually addOptimisticTransaction only affects optimisticTransactions derived state.
            // If we don't update 'transactions', it reverts automatically on next render? 
            // No, optimistic state persists until the underlying state updates or we do something else.
            // But since we didn't update 'transactions' with the temp one, it should remain clean.
            // We should reload to be safe.
             fetchTransactions(selectedAccountId);
        }
    };

    const handleUpdateTransaction = async (data: any) => {
        if (!editingTransaction) return;

        const updatedTx: Transaction = {
            ...editingTransaction,
            description: data.description,
            debit: data.type === 'DEBIT' ? data.amount : 0,
            credit: data.type === 'CREDIT' ? data.amount : 0,
            pending: true
        };

        startTransition(() => {
            setOptimisticTransactions({ type: 'UPDATE', payload: updatedTx });
        });

        try {
            // We need entryId. Transaction interface needs to include it first!
            // I added entryId to CompteService but did I add it to the Interface in TreasuryPage?
            // Need to check line 34.
            await api.patch(`/compte/transaction/${editingTransaction.entryId}`, {
                ...data,
                compteId: Number(selectedAccountId)
            });
            toast.success("Transaction modifiée");
            await fetchTransactions(selectedAccountId);
        } catch (error: any) {
             toast.error(error.response?.data?.message || "Erreur lors de la modification");
             fetchTransactions(selectedAccountId);
        }
    };

    const handleDeleteTransaction = async (id: number, entryId?: number) => {
        if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;

        startTransition(() => {
            setOptimisticTransactions({ type: 'DELETE', payload: id });
        });

        try {
            if (entryId) {
                 await api.delete(`/compte/transaction/${entryId}`);
            }
            toast.success("Transaction supprimée");
            await fetchTransactions(selectedAccountId);
        } catch (error: any) {
             toast.error(error.response?.data?.message || "Erreur lors de la suppression");
             fetchTransactions(selectedAccountId);
        }
    };

    
    // Derived state for totals...
    const selectedAccount = accounts.find(a => String(a.id) === selectedAccountId);

    // Calculate totals from optimistic transactions
    const totalIn = optimisticTransactions.reduce((sum, t) => sum + t.debit, 0);
    const totalOut = optimisticTransactions.reduce((sum, t) => sum + t.credit, 0);
    const totalBalance = optimisticTransactions.reduce((sum, t) => sum + t.debit - t.credit, 0);

    const handleOpenModal = (type: 'DEBIT' | 'CREDIT') => {
        setModalType(type);
        setModalOpen(true);
    };

    // Handlers for filters wrapped in startTransition to keep UI responsive
    const handleAccountChange = (val: string) => {
        startTransition(() => {
            setSelectedAccountId(val);
        });
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        startTransition(() => {
            setStartDate(val);
        });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        startTransition(() => {
            setEndDate(val);
        });
    };

    return (
        <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50/50 dark:bg-slate-950/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                     <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                            <Wallet size={24} />
                        </div>
                        Trésorerie
                        <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                             {accounts.length} Comptes
                        </span>
                    </h1>
                     <p className="text-gray-500 font-medium mt-2 max-w-lg">
                        Gérez vos caisses et comptes bancaires, suivez les flux de trésorerie.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Du</span>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="bg-transparent border-b border-gray-200 dark:border-slate-700 text-xs font-bold w-32 focus:outline-none focus:border-blue-500 dark:text-gray-200"
                        />
                        <span className="text-xs font-bold text-gray-500 uppercase">Au</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={handleEndDateChange}
                            className="bg-transparent border-b border-gray-200 dark:border-slate-700 text-xs font-bold w-32 focus:outline-none focus:border-blue-500 dark:text-gray-200"
                        />
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 hidden md:block" />
                    <div className="flex items-center gap-2 pr-2">
                        <Building2 className="text-gray-400 ml-2" size={20} />
                        <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                            <SelectTrigger className="w-full md:w-[200px] border-none shadow-none font-bold text-gray-700 dark:text-gray-200 bg-transparent focus:ring-0">
                                <SelectValue placeholder="Choisir un compte" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={String(acc.id)} className="font-bold">
                                        {acc.name} <span className="text-xs text-muted-foreground ml-2">({acc.category})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6 transition-opacity duration-300", isPending ? "opacity-70" : "opacity-100")}>
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Total Entrées
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                            {totalIn.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingDown size={100} />
                    </div>
                     <div className="relative z-10">
                        <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Total Sorties
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                            {totalOut.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Total Balance
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                            {totalBalance.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                        </h3>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={() => handleOpenModal('DEBIT')}
                        className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <ArrowDownLeft className="mr-2" /> Encaissement
                    </Button>
                    <Button 
                        onClick={() => handleOpenModal('CREDIT')}
                        className="flex-1 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-lg shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <ArrowUpRight className="mr-2" /> Décaissement
                    </Button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-20 flex items-start justify-center pt-20 backdrop-blur-sm transition-all duration-300">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                )}
                
                <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-black text-xl flex items-center gap-3">
                        <History className="text-gray-400" />
                        Historique des opérations
                    </h3>
                </div>
                
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-950/50">
                        <TableRow className="border-b border-gray-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="w-[180px] font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest pl-8 py-6">Date</TableHead>
                            <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Référence</TableHead>
                            <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Description</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest text-emerald-600">Débit (Entrée)</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-8 text-rose-600">Crédit (Sortie)</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-8 dark:text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && optimisticTransactions.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="h-16">
                                        <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : optimisticTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                                            <History size={32} />
                                        </div>
                                        <p className="font-bold uppercase text-xs tracking-widest">Aucune opération trouvée</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            optimisticTransactions.map((t) => (
                                <TableRow 
                                    key={t.id} 
                                    className={cn(
                                        "group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 text-sm font-medium",
                                        t.pending && "bg-blue-50/50 dark:bg-blue-900/10 animate-pulse"
                                    )}
                                >
                                    <TableCell className="pl-8 py-4 text-gray-500">
                                        {format(new Date(t.date), "d MMM yyyy, HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-gray-600 dark:text-gray-300 font-mono">
                                            {t.reference}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{t.description}</span>
                                            {t.partnerAccount && (
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                                    <Building2 size={10} />
                                                    {t.partnerAccount}
                                                </span>
                                            )}
                                            {t.pending && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-1">(Envoi...)</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">
                                        {t.debit > 0 ? `+ ${t.debit.toLocaleString()}` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 font-bold text-rose-600">
                                        {t.credit > 0 ? `- ${t.credit.toLocaleString()}` : "-"}
                                    </TableCell>
                                    <TableCell className="w-[100px] text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTransaction(t);
                                                    setModalType(t.debit > 0 ? 'DEBIT' : 'CREDIT');
                                                    setModalOpen(true);
                                                }}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                                                title="Modifier"
                                            >
                                                <Loader2 size={16} className={cn("animate-spin", !t.pending && "hidden")} />
                                                <Wallet size={16} className={cn(t.pending && "hidden")} /> 
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTransaction(t.id, t.entryId);
                                                }}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-gray-400 hover:text-red-500"
                                                title="Supprimer"
                                            >
                                                 <ArrowDownLeft className={cn("hidden")} /> {/* Just for import usage check prevention */}
                                                {/* Use a generic Trash icon or X. Since I didn't import Trash, I'll use X or similar if available, or just add Trash to imports. */}
                                                {/* Let's double check imports. Trash is not imported. I will add it.*/}
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal */}
            <TransactionModal 
                open={modalOpen} 
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) setEditingTransaction(null); // Reset editing state on close
                }}
                accountId={Number(selectedAccountId)}
                accountName={selectedAccount?.name || ""}
                type={modalType}
                initialData={editingTransaction}
                onSuccess={editingTransaction ? handleUpdateTransaction : handleCreateTransaction} 
            />
        </div>
    );
}
