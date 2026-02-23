"use client"

import React, { useMemo } from "react";
import { 
    CartesianGrid, 
    Area, 
    AreaChart, 
    ResponsiveContainer, 
    Tooltip, 
    XAxis, 
    YAxis 
} from "recharts";
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";

import { useTheme } from "next-themes";
import api from "@/lib/api";

const FinanceChartComponent = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [data, setData] = React.useState<{ name: string; income: number; expense: number }[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [period, setPeriod] = React.useState("monthly");

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/finance/chart?period=${period}`);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch finance chart data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1a1c2e] rounded-[32px] w-full h-[400px] p-8 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white dark:bg-[#1a1c2e] rounded-[32px] w-full h-full p-8 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 flex flex-col transition-all duration-300'
        >
            <div className='flex justify-between items-start mb-8'>
                <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] mb-1 transition-colors">Statistics</p>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">Financial</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#0052cc] shadow-[0_0_10px_rgba(0,82,204,0.3)]"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-colors">Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#bf95f9] shadow-[0_0_10px_rgba(191,149,249,0.3)]"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest transition-colors">Expense</span>
                        </div>
                    </div>
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value.toLowerCase())}
                        className="bg-[#0052cc] border-none rounded-xl text-[10px] font-black px-4 py-2.5 outline-none text-white shadow-xl shadow-blue-500/10 uppercase tracking-widest cursor-pointer"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0052cc" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#bf95f9" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#bf95f9" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDark ? '#4b5563' : '#9ca3af', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                            minTickGap={30}
                            interval="preserveStartEnd"
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDark ? '#4b5563' : '#9ca3af', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: "20px", 
                                border: "none",
                                backgroundColor: isDark ? "#1a1c2e" : "#ffffff",
                                boxShadow: isDark ? "0 20px 25px -5px rgba(0,0,0,0.5)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
                                padding: "16px",
                            }}
                            itemStyle={{ fontSize: "12px", fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="income" 
                            stroke="#0052cc" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorIncome)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="expense" 
                            stroke="#bf95f9" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorExpense)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default React.memo(FinanceChartComponent);
