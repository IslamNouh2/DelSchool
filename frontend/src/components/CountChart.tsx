"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { MoreHorizontal, Users } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { motion } from "motion/react";

const CountChartComponent = () => {
    const [counts, setCounts] = useState<{ boys: number, girls: number }>({ boys: 0, girls: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await api.get("/student/counts-by-gender");
                setCounts(res.data);
            } catch (error) {
                console.error("Failed to fetch gender counts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, []);

    const total = counts.boys + counts.girls;
    const boysPercent = total > 0 ? (counts.boys / total) * 100 : 0;
    const girlsPercent = total > 0 ? (counts.girls / total) * 100 : 0;

    const realBoysPercent = Math.round(boysPercent);
    const realGirlsPercent = Math.round(girlsPercent);

    // Beautiful scaling: Base size + proportional growth
    const boysSize = 40 + (boysPercent * 0.45);
    const girlsSize = 40 + (girlsPercent * 0.45);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-white dark:bg-[#1a1c2e] rounded-[32px] w-full h-full p-8 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 flex flex-col justify-between transition-all duration-300'
        >
            <div className='flex justify-between items-start mb-6'>
                <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] mb-1 transition-colors">Distribution</p>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">Student Gender</h2>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-[#0b0d17] rounded-xl border border-gray-100 dark:border-white/5">
                    <Users className="w-5 h-5 text-[#0052cc]" />
                </div>
            </div>

            <div className='relative flex-1 flex items-center justify-center my-4'>
                {/* Decorative Background Rings */}
                <div className="absolute w-[220px] h-[220px] rounded-full border border-dashed border-gray-100 dark:border-white/5 animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-[180px] h-[180px] rounded-full border border-gray-50 dark:border-white/5" />
                
                <div className="relative w-full aspect-square max-w-[260px] flex items-center justify-center">
                    {/* Artistic Overlapping Design */}
                    <motion.div 
                        style={{ width: `${boysSize}%` }}
                        animate={{ width: `${boysSize}%` }}
                        className="absolute left-[8%] aspect-square rounded-full bg-gradient-to-br from-[#0052cc] to-[#003d99] flex flex-col items-center justify-center shadow-[0_20px_40px_rgba(0,82,204,0.3)] z-10 border-4 border-white dark:border-[#1a1c2e] transition-all duration-1000 ease-in-out"
                    >
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                            <Users className="w-8 h-8 text-white opacity-90" />
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        style={{ width: `${girlsSize}%` }}
                        animate={{ width: `${girlsSize}%` }}
                        className="absolute right-[8%] aspect-square rounded-full bg-gradient-to-tr from-[#bf95f9] to-[#9b6cd9] flex flex-col items-center justify-center shadow-[0_20px_40px_rgba(191,149,249,0.3)] z-20 border-4 border-white dark:border-[#1a1c2e] transition-all duration-1000 ease-in-out"
                    >
                         <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                            <Users className="w-6 h-6 text-white opacity-90" />
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4 mt-8'>
                <div className="bg-gray-50 dark:bg-[#0b0d17] p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-[#0052cc]/30 transition-all cursor-default group">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0052cc]"></div>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Garçons</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{counts.boys}</span>
                        <span className="text-[10px] font-black text-[#0052cc]">{realBoysPercent}%</span>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#0b0d17] p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-[#bf95f9]/30 transition-all cursor-default group">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#bf95f9]"></div>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Filles</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{counts.girls}</span>
                        <span className="text-[10px] font-black text-[#bf95f9]">{realGirlsPercent}%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default React.memo(CountChartComponent);
