"use client";

import FinanceChart from "@/components/FinanceChart";
import FinanceStats from "@/components/FinanceStats";
import ExpenseCategoryChart from "@/components/ExpenseCategoryChart";
import RecentStudentPayments from "@/components/RecentStudentPayments";
import RecentExpensesWidget from "@/components/RecentExpensesWidget";
import { BadgeDollarSign, Bell, Settings, User } from "lucide-react";

const FinancePage = () => {
    return (
        <div className="p-6 space-y-8 bg-gray-50/50 dark:bg-black/20 min-h-screen">
             {/* Header */}
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                    <BadgeDollarSign size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Tableau de Bord Finance
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Vue d'ensemble de la santé financière de l'établissement.
                    </p>
                </div>
            </div>

            {/* Top Section - Stats */}
            <FinanceStats />

            {/* Middle Section - Chart & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 h-full">
                     <FinanceChart />
                </div>
                <div className="h-full">
                    <ExpenseCategoryChart />
                </div>
            </div>

            {/* Bottom Section - Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                 <RecentStudentPayments />
                 <RecentExpensesWidget />
            </div>
        </div>
    );
};

export default FinancePage;
