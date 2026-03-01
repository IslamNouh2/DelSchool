"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const GradesChart = ({ data, loading }: { data: any[], loading: boolean }) => {
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1c2e] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm h-full">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Academic Performance</h2>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
            />
            <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false}
                axisLine={false}
            />
            <Radar
              name="Grade"
              dataKey="grade"
              stroke="#0052cc"
              fill="#0052cc"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GradesChart;
