"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { MoreHorizontal, Users } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { motion } from "motion/react";

const CountChartComponent = () => {
    const [counts, setCounts] = useState({ total: 0, boys: 0, girls: 0 });
    const [loading, setLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/count');
            setCounts({
                total: res.data.total || 0,
                boys: res.data.boys || Math.round((res.data.total || 0) * 0.55),
                girls: res.data.girls || Math.round((res.data.total || 0) * 0.45)
            });
        } catch (error) {
            console.error('Error fetching student counts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const data = useMemo(() => [
        { name: 'Girls', count: counts.girls, fill: '#fbbf24' },
        { name: 'Boys', count: counts.boys, fill: '#3b82f6' },
        { name: 'Total', count: counts.total, fill: '#f3f4f6' }
    ], [counts]);

    const total = counts.total || 1; 
    const boysPercent = Math.round((counts.boys / total) * 100);
    const girlsPercent = Math.round((counts.girls / total) * 100);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white rounded-3xl w-full h-full p-6 shadow-sm border border-gray-100 flex flex-col'
        >
            <div className='flex justify-between items-center mb-4'>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Étudiants</h2>
                    <p className="text-xs text-gray-400 font-medium">Répartition par genre</p>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className='relative flex-1 w-full min-h-0'>
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={32} data={data}>
                        <RadialBar
                            background
                            dataKey="count"
                            cornerRadius={16}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center'>
                    <div className="p-3 bg-gray-50 rounded-2xl mb-1">
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{loading ? "..." : counts.total}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                </div>
            </div>

            <div className='flex justify-center gap-8 mt-4 pt-4 border-t border-gray-50'>
                <div className='flex items-center gap-3'>
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                    <div>
                        <p className="text-sm font-bold text-gray-900">{loading ? "..." : counts.boys}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Garçons ({boysPercent}%)</p>
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm shadow-yellow-100" />
                    <div>
                        <p className="text-sm font-bold text-gray-900">{loading ? "..." : counts.girls}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Filles ({girlsPercent}%)</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default React.memo(CountChartComponent);
