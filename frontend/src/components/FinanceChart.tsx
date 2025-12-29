"use client"

import React, { useMemo } from "react";
import { 
    CartesianGrid, 
    Legend, 
    Area, 
    AreaChart, 
    ResponsiveContainer, 
    Tooltip, 
    XAxis, 
    YAxis 
} from "recharts";
import { motion } from "motion/react";
import { MoreHorizontal, TrendingUp } from "lucide-react";

const FinanceChartComponent = () => {
    const data = useMemo(() => [
        { name: 'Jan', income: 4000, expense: 2400 },
        { name: 'Fév', income: 3000, expense: 1398 },
        { name: 'Mar', income: 2000, expense: 9800 },
        { name: 'Avr', income: 2780, expense: 3908 },
        { name: 'Mai', income: 1890, expense: 4800 },
        { name: 'Juin', income: 2390, expense: 3800 },
        { name: 'Juil', income: 3490, expense: 4300 },
        { name: 'Août', income: 4490, expense: 3300 },
        { name: 'Sep', income: 5490, expense: 4300 },
        { name: 'Oct', income: 3490, expense: 5300 },
        { name: 'Nov', income: 6490, expense: 4300 },
        { name: 'Déc', income: 7490, expense: 4300 },
    ], []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white rounded-3xl w-full h-full p-6 shadow-sm border border-gray-100 flex flex-col'
        >
            <div className='flex justify-between items-center mb-8'>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Flux Financier</h2>
                    <p className="text-xs text-gray-400 font-medium">Revenus vs Dépenses mensuels</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-xl border border-green-100">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-bold text-green-600">+12.5%</span>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                            dataKey="name" 
                            axisLine={false} 
                            tick={{ fill: "#9ca3af", fontSize: 12 }} 
                            tickLine={false} 
                            tickMargin={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tick={{ fill: "#9ca3af", fontSize: 12 }} 
                            tickLine={false} 
                            tickMargin={20} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: "16px", 
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                padding: "12px"
                            }}
                        />
                        <Legend
                            align="right"
                            verticalAlign="top"
                            wrapperStyle={{ paddingBottom: "30px", fontSize: "12px", fontWeight: "500" }}
                            iconType="circle"
                            iconSize={8}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="income" 
                            name="Revenus"
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorIncome)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="expense" 
                            name="Dépenses"
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorExpense)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export default React.memo(FinanceChartComponent);
