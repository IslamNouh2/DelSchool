"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Wallet } from "lucide-react";

type Transaction = {
    id: number;
    amount: number;
    date: string;
    method: string;
    status: string;
    student?: { firstName: string; lastName: string };
    employer?: { firstName: string; lastName: string };
    expense?: { title: string };
    fee?: { title: string };
};

const RecentTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get("/finance/recent");
                setTransactions(res.data);
            } catch (error) {
                console.error("Failed to fetch recent transactions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1c2e] rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 h-full flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Transactions Récentes</h2>
                <button className="text-[10px] font-black text-[#0052cc] hover:text-blue-400 transition-all uppercase tracking-widest">Voir tout</button>
            </div>

            <div className="flex-1 overflow-y-auto -mr-4 pr-4 custom-scrollbar">
                <div className="space-y-6">
                    {transactions.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 font-medium">Aucune transaction récente</div>
                    ) : (
                        transactions.map((tx) => {
                            const isExpense = !!tx.expense || (tx.employer && !tx.fee);
                            const isIncome = !!tx.fee;
                            
                            const title = tx.expense ? tx.expense.title : 
                                          tx.fee ? `Frais: ${tx.fee.title}` :
                                          tx.employer ? `Paiement: ${tx.employer.firstName} ${tx.employer.lastName}` :
                                          "Transaction";
                            
                            const subtitle = tx.student ? `${tx.student.firstName} ${tx.student.lastName}` : 
                                             new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3.5 rounded-2xl transition-all ${isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110'}`}>
                                            {isIncome ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-[#0052cc] transition-colors uppercase tracking-tight">{title}</h4>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">{subtitle}</p>
                                        </div>
                                    </div>
                                    <div className={`font-black text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} tabular-nums`}>
                                        {isIncome ? '+' : '-'}{Number(tx.amount).toLocaleString()} DA
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecentTransactions;
