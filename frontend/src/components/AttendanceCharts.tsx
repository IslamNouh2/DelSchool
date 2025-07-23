"use client";
import Image from "next/image";
import {
    BarChart,
    Bar,
    Rectangle,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";


const data = [
    {
        name: "Sam",
        present: 74,
        absent: 23,
    },
    {
        name: "Dim",
        present: 56,
        absent: 40,
    },
    {
        name: "Lin",
        present: 90,
        absent: 10
    },
    {
        name: "Mar",
        present: 32,
        absent: 83,
    },
    {
        name: "Mer",
        present: 10,
        absent: 95,
    },
    {
        name: "Jeu",
        present: 99,
        absent: 1,
    }
];


const AttendanceCharts = () => {
    return (
        <div className='bg-white rounded-lg p-4 w-full h-full'>
            <div className="flex justify-between items-center">
                <h1>Attendance</h1>
                <Image src="/MoreDark.png" alt='' width={20} height={20} />
            </div>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart width={500} height={300} data={data} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tick={{ fill: "#d1d5db" }}
                        tickLine={false}
                    />
                    <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: "10px", borderColor: "lightgray" }}
                    />
                    <Legend
                        align="left"
                        verticalAlign="top"
                        wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
                    />
                    <Bar
                        dataKey="present"
                        fill="#FAE27C"
                        legendType="circle"
                        radius={[10, 10, 0, 0]}
                    />
                    <Bar
                        dataKey="absent"
                        fill="#C3EBFA"
                        legendType="circle"
                        radius={[10, 10, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default AttendanceCharts