"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const TopStudentsChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1c2e] p-4 rounded-3xl border border-gray-100 dark:border-white/5 h-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">Top Students</h1>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barSize={32}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              cursor={{ fill: "transparent" }}
            />
            <Bar 
              dataKey="average" 
              fill="#0052cc" 
              radius={[10, 10, 10, 10]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopStudentsChart;
