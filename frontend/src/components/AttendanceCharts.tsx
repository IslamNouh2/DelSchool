"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { MoreHorizontal } from "lucide-react";
import api from "@/lib/api";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

const AttendanceChartsComponent = () => {
    const t = useTranslations("dashboard");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [data, setData] = useState<{ day: string; present: number; absent: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<{ classId: number; ClassName: string }[]>([]);
    const [selectedRole, setSelectedRole] = useState<"students" | "teachers" | "staff">("students");
    const [selectedClassId, setSelectedClassId] = useState<number>(0);

    // Fetch classes for the dropdown
    useEffect(() => {
        api.get("/attendance/class")
            .then((res) => {
                setClasses(res.data);
            })
            .catch((err) => console.error("Failed to fetch classes", err));
    }, []);

    // Fetch chart data when role or class changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let endpoint = "";
                if (selectedRole === "students") {
                    if (selectedClassId === 0) {
                        endpoint = "/attendance/global-weekly-chart";
                    } else {
                        endpoint = `/attendance/student-weekly-chart/${selectedClassId}`;
                    }
                } else {
                    endpoint = "/attendance/employer-weekly-chart"; // Teachers & Staff share the same employer attendance table currently
                }

                const res = await api.get(endpoint);
                const formattedData = res.data.map((item: any) => ({
                    name: item.day.toUpperCase(),
                    present: item.present,
                    absent: item.absent
                }));
                setData(formattedData);
            } catch (error) {
                console.error("Failed to fetch weekly attendance", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedRole, selectedClassId]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white dark:bg-[#1a1c2e] rounded-[32px] p-8 w-full h-full shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 flex flex-col transition-all duration-300'
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] mb-1 transition-colors">{t("report")}</p>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{t("present_absent")}</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#0052cc]"></div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">{t("present")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#bf95f9]"></div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">{t("absent")}</span>
                        </div>
                    </div>
                    {selectedRole === "students" && (
                        <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(Number(e.target.value))}
                            className="bg-gray-50 dark:bg-[#0b0d17] border border-gray-200 dark:border-white/5 rounded-xl text-[10px] font-bold px-3 py-2 outline-none text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <option value={0}>{t("all_classes") || "ALL CLASSES"}</option>
                            {classes.map((c) => (
                                <option key={c.classId} value={c.classId}>
                                    {c.ClassName}
                                </option>
                            ))}
                        </select>
                    )}
                    <select className="bg-gray-50 dark:bg-[#0b0d17] border border-gray-200 dark:border-white/5 rounded-xl text-[10px] font-bold px-3 py-2 outline-none text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors cursor-pointer">
                        <option>This Week</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-8 mb-8 border-b border-gray-100 dark:border-white/5 transition-colors">
                <button 
                    onClick={() => setSelectedRole("students")}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${selectedRole === "students" ? "font-black text-[#0052cc] border-b-2 border-[#0052cc]" : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                    {t("students")}
                </button>
                <button 
                    onClick={() => setSelectedRole("teachers")}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${selectedRole === "teachers" ? "font-black text-[#0052cc] border-b-2 border-[#0052cc]" : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                    {t("teachers")}
                </button>
                <button 
                    onClick={() => setSelectedRole("staff")}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${selectedRole === "staff" ? "font-black text-[#0052cc] border-b-2 border-[#0052cc]" : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                    {t("staff")}
                </button>
            </div>
            
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={12} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 10, fontWeight: 700 }} 
                            dy={10}
                        />
                        <YAxis 
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
                            dataKey="present" 
                            fill="#0052cc" 
                            radius={[6, 6, 0, 0]} 
                            barSize={24}
                        />
                        <Bar 
                            dataKey="absent" 
                            fill="#bf95f9" 
                            radius={[6, 6, 0, 0]} 
                            barSize={24}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default React.memo(AttendanceChartsComponent);
