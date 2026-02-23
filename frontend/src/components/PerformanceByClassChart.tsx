"use client";

import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { motion } from "motion/react";
import api from "@/lib/api";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

const PerformanceByClassChart = () => {
    const t = useTranslations("dashboard");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [data, setData] = useState<{ className: string; average: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/exam/dashboard/class-performance");
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch class performance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ["#0052cc", "#bf95f9", "#00d4ff", "#7c3aed", "#00ff88"];

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1a1c2e] rounded-[32px] w-full h-full p-8 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white dark:bg-[#1a1c2e] rounded-[32px] p-8 w-full h-full shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 flex flex-col transition-all duration-300'
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] mb-1 transition-colors">{t("report")}</p>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{t("performance_by_class")}</h2>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="horizontal" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#00000005"} horizontal={true} vertical={false} />
                        <XAxis 
                            dataKey="className" 
                            type="category"
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 10, fontWeight: 700 }} 
                            width={100}
                        />
                        <YAxis 
                            type="number"
                            domain={[0, 100]}
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 10, fontWeight: 700 }} 
                        />
                        <Tooltip 
                            cursor={{ fill: isDark ? '#ffffff05' : '#00000005' }}
                            contentStyle={{ 
                                borderRadius: "16px", 
                                border: "none",
                                backgroundColor: isDark ? "#1a1c2e" : "#ffffff",
                                boxShadow: isDark ? "0 20px 25px -5px rgba(0,0,0,0.5)" : "0 10px 15px -3px rgba(0,0,0,0.1)",
                                padding: "12px"
                            }}
                            itemStyle={{ fontSize: "12px", fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}
                        />
                        <Bar 
                            dataKey="average" 
                            radius={[6, 6, 0, 0]} 
                            barSize={30}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default React.memo(PerformanceByClassChart);
