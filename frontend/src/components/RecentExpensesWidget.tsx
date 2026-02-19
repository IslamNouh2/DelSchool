"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Zap, ShoppingCart, Server, FileText, Coffee } from "lucide-react";

type Expense = {
    id: number;
    title: string;
    amount: number;
    expenseDate: string;
    description: string;
    isPaid: boolean;
    category: string;
    compte?: {
        name: string;
        isFeeCash: boolean;
    };
};

const RecentExpensesWidget = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
             try {
                const res = await api.get("/finance/expenses");
                setExpenses(res.data);
            } catch (error) {
                console.error("Failed to fetch recent expenses", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    const getIcon = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'utilities': return Zap;
            case 'supplies': return ShoppingCart;
            case 'tech': return Server;
            default: return FileText;
        }
    };

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
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Gestion des Dépenses</h2>
                <span className="text-[10px] font-black text-[#0052cc] hover:text-blue-400 cursor-pointer transition-all uppercase tracking-widest">Voir tout</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {expenses.map((expense) => {
                    const Icon = getIcon(expense.category);
                    const isDue = !expense.isPaid;
                    
                    return (
                        <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#0b0d17]/50 rounded-[24px] border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-[#0b0d17] rounded-2xl group-hover:bg-white dark:group-hover:bg-[#1a1c2e] group-hover:shadow-md transition-all text-gray-500 dark:text-gray-400 group-hover:text-[#0052cc] dark:group-hover:text-blue-400 border border-transparent group-hover:border-gray-100 dark:group-hover:border-white/10">
                                    <Icon size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-[#0052cc] transition-colors uppercase tracking-tight">{expense.title}</h4>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mt-1">
                                        {isDue ? 
                                            <span className="text-amber-500">En attente</span> : 
                                            <span className="text-emerald-500">Payé le {new Date(expense.expenseDate).toLocaleDateString()}</span>
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-sm text-gray-900 dark:text-gray-100 tabular-nums">{Number(expense.amount).toLocaleString()} DA</div>
                                <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    {expense.category || "Dépense"}
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {expenses.length === 0 && (
                    <div className="text-center text-gray-400 py-12 text-sm font-medium">Aucune dépense récente</div>
                )}
            </div>
        </div>
    );
};

export default RecentExpensesWidget;
