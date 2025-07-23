"use client"
import Image from "next/image"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


const data = [
    {
        name: 'Jen',
        uv: 4000,
        pv: 2400,
    },
    {
        name: 'Fer',
        uv: 3000,
        pv: 1398,
    },
    {
        name: 'Mar',
        uv: 2000,
        pv: 9800,
    },
    {
        name: 'Apr',
        uv: 2780,
        pv: 3908,
    },
    {
        name: 'Mai',
        uv: 1890,
        pv: 4800,
    },
    {
        name: 'Jun',
        uv: 2390,
        pv: 3800,
    },
    {
        name: 'Jul',
        uv: 3490,
        pv: 4300,
    },
    {
        name: 'Aut',
        uv: 3490,
        pv: 4300,
    },
    {
        name: 'Sep',
        uv: 3490,
        pv: 4300,
    },
    {
        name: 'Oct',
        uv: 3490,
        pv: 4300,
    },
    {
        name: 'Nov',
        uv: 3490,
        pv: 4300,
    },
    {
        name: 'Des',
        uv: 3490,
        pv: 4300,
    },
];

const FinanceChart = () => {
    return (
        <div className='bg-white rounded-2xl w-full h-full p-4'>
            {/* Title */}
            <div className='flex justify-between items-center'>
                <h2>Finance</h2>
                <Image src="/MoreDark.png" alt="" width={20} height={20} />
            </div>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis
                        dataKey="name" axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false} tickMargin={10} />
                    <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false} tickMargin={20} />
                    <Tooltip />
                    <Legend
                        align="center"
                        verticalAlign="top"
                        wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
                    />
                    <Line
                        type="monotone" dataKey="income" stroke="#C3EBFA" strokeWidth={5} />
                    <Line type="monotone" dataKey="expense" stroke="#CFCEFF" strokeWidth={5} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default FinanceChart