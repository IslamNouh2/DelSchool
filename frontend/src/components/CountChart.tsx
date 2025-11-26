"use client"

import api from '@/lib/api';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts';


const CountChart = () => {

    const [counts, setCounts] = useState({ total: 0, boys: 0, girls: 0 });

    // useEffect(() => {
    //     const fetchCounts = async () => {
    //         try {
    //             const res = await api.get('http://localhost:5000/student/count');
    //             setCounts(res.data);
    //         } catch (error) {
    //             console.error('Error fetching student counts:', error);
    //         }
    //     };
    //     fetchCounts();
    // }, []);

    const data = [
        {
            name: 'Total',
            count: counts.total,
            fill: 'white',
        },
        {
            name: 'Girls',
            count: counts.girls,
            fill: '#fae27c',
        },
        {
            name: 'Boys',
            count: counts.boys,
            fill: '#c3ebfa',
        }
    ];

    const total = counts.total || 1; 
    const boysPercent = Math.round((counts.boys / total) * 100);
    const girlsPercent = Math.round((counts.girls / total) * 100);

    return (
        <div className='bg-card rounded-2xl w-full h-full p-4'>
            {/* Title */}
            <div className='flex justify-between items-center'>
                <h2>Students</h2>
                <Image src="/moreDark.png" alt="" width={20} height={20} />
            </div>
            {/* Charts  */}
            <div className=' relative w-full h-[75%]'>
                <ResponsiveContainer >
                    <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={98} data={data}>
                        <RadialBar
                                
                            background
                            dataKey="count"
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <Image src="/maleFemale.png" alt='' width={50} height={50} className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' />
            </div>
            { /* Bottom */}
            <div className='flex justify-center gap-16'>
                <div className='flex flex-col gap-1'>
                    <div className="w-5 h-5 rounded-full bg-lamaSky" />
                    <h1 className='font-bold'>{counts.boys}</h1>
                    <h2 className="text-sm text-gray-300">Boys ({boysPercent}%)</h2>
                </div>
                <div className='flex flex-col gap-1'>
                    <div className="w-5 h-5 rounded-full bg-lamaYellow" />
                    <h1 className='font-bold'>{counts.girls}</h1>
                    <h2 className="text-sm text-gray-300">Girls ({girlsPercent}%)</h2>
                </div>
            </div>
        </div>
    )
}

export default CountChart
