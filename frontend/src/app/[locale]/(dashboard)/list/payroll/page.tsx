"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Loader2, 
    Wallet, 
    Users, 
    TrendingDown, 
    TrendingUp, 
    Calendar,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollTable } from "./components/PayrollTable";
import { GeneratePayrollModal } from "./components/GeneratePayrollModal";
import { cn } from "@/lib/utils";
import api from "@/lib/api"; 

export default function PayrollPage() {
  const [periodStart, setPeriodStart] = useState<string>(
    format(new Date().setDate(1), "yyyy-MM-dd")
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  
  // This state will trigger re-fetch in the table component
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState({ totalNet: 0, totalDeductions: 0, count: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Fetch summary data when period changes
    useEffect(() => {
        const fetchSummary = async () => {
            setLoadingSummary(true);
            try {
                // We can reuse the same endpoint or make a specific one. 
                // For now, let's just fetch the payrolls to calc summary client side 
                // or if we had a summary endpoint. 
                // Let's use the list endpoint and aggregate.
                // NOTE: Ideally backend should provide summary.
                const res = await api.get(`/payroll?start=${periodStart}&end=${periodEnd}`);
                const data = res.data;
                const totalNet = data.reduce((sum: number, p: any) => sum + Number(p.netSalary), 0);
                const totalDeductions = data.reduce((sum: number, p: any) => sum + Number(p.deductions), 0);
                setSummary({ totalNet, totalDeductions, count: data.length });
            } catch (error) {
                console.error("Failed to fetch summary", error);
            } finally {
                setLoadingSummary(false);
            }
        };
        fetchSummary();
    }, [periodStart, periodEnd, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPeriodStart(e.target.value);
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPeriodEnd(e.target.value);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50/50 dark:bg-slate-950/50">
        
      {/* Header Section */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                 <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                        <Users size={24} />
                    </div>
                    Gestion de Paie
                    <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full dark:bg-indigo-900/30 dark:text-indigo-300">
                         {summary.count} Employés
                    </span>
                </h1>
                 <p className="text-gray-500 font-medium mt-2 max-w-lg">
                    Gérez les salaires, les primes et les déductions de vos employés.
                </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-gray-500 uppercase">Période du</span>
                    <input 
                        type="date" 
                        value={periodStart}
                        onChange={handleStartDateChange}
                        className="bg-transparent border-b border-gray-200 dark:border-slate-700 text-xs font-bold w-32 focus:outline-none focus:border-indigo-500 dark:text-gray-200"
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase">au</span>
                    <input 
                        type="date" 
                        value={periodEnd}
                        onChange={handleEndDateChange}
                        className="bg-transparent border-b border-gray-200 dark:border-slate-700 text-xs font-bold w-32 focus:outline-none focus:border-indigo-500 dark:text-gray-200"
                    />
                 </div>
                 
                <GeneratePayrollModal 
                    defaultStart={periodStart} 
                    defaultEnd={periodEnd} 
                    onSuccess={handleRefresh} 
                />
            </div>
        </div>

      {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wallet size={100} />
                </div>
                <div className="relative z-10">
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Total Salaires Net
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                        {loadingSummary ? <Loader2 className="animate-spin" /> : summary.totalNet.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                    </h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingDown size={100} />
                </div>
                 <div className="relative z-10">
                    <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Total Déductions
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                        {loadingSummary ? <Loader2 className="animate-spin" /> : summary.totalDeductions.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                    </h3>
                </div>
            </div>
        </div>

      <div className="space-y-4">
        <PayrollTable 
            key={`${periodStart}-${periodEnd}-${refreshKey}`}
            periodStart={periodStart}
            periodEnd={periodEnd}
        />
      </div>
    </div>
  );
}
