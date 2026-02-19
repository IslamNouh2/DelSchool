"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    PiggyBank,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Landmark
} from "lucide-react";
import api from "@/lib/api";

type FinanceStatsData = {
    totalIncome: number;
    totalExpenses: number;
    netResult: number;
    treasuryBalance: number;
    totalCaisse: number;
    totalBanque: number;
};

const FinanceStats = () => {
    const [data, setData] = useState<FinanceStatsData>({
        totalIncome: 0,
        totalExpenses: 0,
        netResult: 0,
        treasuryBalance: 0,
        totalCaisse: 0,
        totalBanque: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/finance/stats");
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch finance stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            title: "Total Revenus",
            value: data.totalIncome,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            format: true
        },
        {
            title: "Total Dépenses",
            value: data.totalExpenses,
            icon: TrendingDown,
            color: "text-rose-600",
            bg: "bg-rose-50",
            format: true
        },
        {
            title: "Résultat Net",
            value: data.netResult,
            icon: TrendingUp, // fallback
            color: data.netResult >= 0 ? "text-blue-600" : "text-orange-600",
            bg: data.netResult >= 0 ? "bg-blue-50" : "bg-orange-50",
            format: true
        },
        {
            title: "Caisse (Espèces)",
            value: data.totalCaisse,
            icon: Wallet,
            color: data.totalCaisse >= 0 ? "text-indigo-600" : "text-rose-600",
            bg: data.totalCaisse >= 0 ? "bg-indigo-50" : "bg-rose-50",
            format: true
        },
        {
            title: "Banque",
            value: data.totalBanque,
            icon: Landmark, 
            color: data.totalBanque >= 0 ? "text-purple-600" : "text-rose-600",
            bg: data.totalBanque >= 0 ? "bg-purple-50" : "bg-rose-50",
            format: true
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-[#1a1c2e] p-6 rounded-3xl shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 relative overflow-hidden flex flex-col justify-between h-[160px] group hover:shadow-md transition-all cursor-pointer"
                >
                     <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-white/5 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        {index === 0 && (
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-800 uppercase tracking-tight transition-colors">
                                +12.4% vs LY
                            </span>
                        )}
                         {index === 2 && (
                            <span className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-100 dark:border-red-800 uppercase tracking-tight transition-colors">
                                -2.1% low cash
                            </span>
                        )}
                     </div>

                    <div>
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1 transition-colors">{stat.title}</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white transition-colors">
                            {loading ? "..." : stat.format ? `${stat.value.toLocaleString()} DA` : stat.value}
                        </h3>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full mt-4 overflow-hidden transition-colors">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: index === 0 ? '70%' : index === 1 ? '45%' : '80%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-blue-500' : 'bg-orange-500'}`}
                            ></motion.div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export default FinanceStats;
