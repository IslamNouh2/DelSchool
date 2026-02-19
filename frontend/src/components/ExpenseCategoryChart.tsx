"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import api from "@/lib/api";

type CategoryData = {
    name: string;
    value: number;
    fill: string;
};

const ExpenseCategoryChart = () => {
    const [data, setData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/finance/categories");
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch expense categories", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

     if (loading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-gray-500">
                <p>Aucune dépense enregistrée</p>
            </div>
        )
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Catégories de Dépenses</h2>
            
            <div className="flex-1 min-h-[200px] relative">
                 {/* Center Text */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-gray-800 dark:text-white">
                        {Math.round((data[0]?.value / total) * 100 || 0)}%
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">{data[0]?.name || "N/A"}</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                         <Tooltip 
                            formatter={(value: number) => `${value.toLocaleString()} DA`}
                            contentStyle={{ 
                                borderRadius: "12px", 
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                padding: "8px 12px"
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
                {data.slice(0, 3).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {Math.round((item.value / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseCategoryChart;
