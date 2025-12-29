"use client";

import React, { useMemo } from "react";
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

const AttendanceChartsComponent = () => {
    const data = useMemo(() => [
        { name: "Lun", present: 74, absent: 23 },
        { name: "Mar", present: 56, absent: 40 },
        { name: "Mer", present: 90, absent: 10 },
        { name: "Jeu", present: 32, absent: 83 },
        { name: "Ven", present: 10, absent: 95 },
        { name: "Sam", present: 99, absent: 1 }
    ], []);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white rounded-3xl p-6 w-full h-full shadow-sm border border-gray-100 flex flex-col'
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Présence Hebdomadaire</h2>
                    <p className="text-xs text-gray-400 font-medium">Statistiques de présence des étudiants</p>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
            </div>
            
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={16} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tick={{ fill: "#9ca3af", fontSize: 12 }} 
                            tickLine={false} 
                        />
                        <Tooltip
                            contentStyle={{ 
                                borderRadius: "16px", 
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                padding: "12px"
                            }}
                            cursor={{ fill: '#f9fafb' }}
                        />
                        <Legend
                            align="right"
                            verticalAlign="top"
                            wrapperStyle={{ paddingBottom: "30px", fontSize: "12px", fontWeight: "500" }}
                            iconType="circle"
                            iconSize={8}
                        />
                        <Bar
                            dataKey="present"
                            fill="#3b82f6"
                            name="Présent"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="absent"
                            fill="#e2e8f0"
                            name="Absent"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export default React.memo(AttendanceChartsComponent);
