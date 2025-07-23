'use client';

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Announcement from "@/components/announcement";
import AttendanceCharts from "@/components/AttendanceCharts";
import CountChart from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import api from "@/lib/api";

interface CountData {
    studentCount: number;
    teacherCount: number;
    parentCount: number;
    staffCount: number;
}

const AdminPage = () => {
    const [counts, setCounts] = useState<CountData>({
        studentCount: 0,
        teacherCount: 0,
        parentCount: 0,
        staffCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect(() => {
    //     const fetchCounts = async () => {
    //         try {
    //             setLoading(true);
    //             setError(null);

    //             // Get token for authentication
    //             const token = Cookies.get("token");
    //             if (!token) {
    //                 throw new Error("No authentication token found");
    //             }

    //             // Configure headers for API calls
    //             const config = {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //                 withCredentials: true,
    //             };

    //             // Make parallel API calls to different endpoints
    //             const [studentRes, teacherRes, parentRes, staffRes] = await Promise.allSettled([
    //                 api.get("/student/count", config),
    //                 api.get("/teacher/count", config), // Fixed: different endpoint
    //                 api.get("/parent/count", config),  // Fixed: different endpoint
    //                 api.get("/staff/count", config),   // Fixed: different endpoint
    //             ]);

    //             // Process results with error handling
    //             const newCounts: CountData = {
    //                 studentCount: studentRes.status === 'fulfilled' ? studentRes.value.data.total || 0 : 0,
    //                 teacherCount: teacherRes.status === 'fulfilled' ? teacherRes.value.data.total || 0 : 0,
    //                 parentCount: parentRes.status === 'fulfilled' ? parentRes.value.data.total || 0 : 0,
    //                 staffCount: staffRes.status === 'fulfilled' ? staffRes.value.data.total || 0 : 0,
    //             };

    //             setCounts(newCounts);

    //             // Log any failed requests
    //             if (studentRes.status === 'rejected') console.error("Failed to fetch student count:", studentRes.reason);
    //             if (teacherRes.status === 'rejected') console.error("Failed to fetch teacher count:", teacherRes.reason);
    //             if (parentRes.status === 'rejected') console.error("Failed to fetch parent count:", parentRes.reason);
    //             if (staffRes.status === 'rejected') console.error("Failed to fetch staff count:", staffRes.reason);

    //         } catch (err: any) {
    //             console.error("Failed to fetch counts", err);
    //             setError(err.message || "Failed to load dashboard data");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchCounts();
    // }, []);

    // // Show loading state
    // if (loading) {
    //     return (
    //         <div className="p-4 h-full">
    //             <div className="flex items-center justify-center h-64">
    //                 <div className="flex flex-col items-center gap-4">
    //                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    //                     <p className="text-gray-600">Loading dashboard...</p>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    // // Show error state
    // if (error) {
    //     return (
    //         <div className="p-4 h-full">
    //             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    //                 <h3 className="font-semibold">Error Loading Dashboard</h3>
    //                 <p className="mt-1">{error}</p>
    //                 <button
    //                     onClick={() => window.location.reload()}
    //                     className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    //                 >
    //                     Retry
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="p-4 h-full w-full">
            {/* Success indicator for debugging */}
            {/* <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">
            
                <span className="font-semibold">✅ Admin Dashboard Loaded Successfully!</span>
            </div> */}

            {/* USER CARDS */}
            <div className="p-4">
                <div className="flex gap-4 justify-between flex-wrap">
                    <UserCard type="Student" count={counts.studentCount} />
                    <UserCard type="Teacher" count={counts.teacherCount} />
                    <UserCard type="Parent" count={counts.parentCount} />
                    <UserCard type="Staff" count={counts.staffCount} />
                </div>
            </div>

            <div className='p-4 flex gap-4 flex-col md:flex-row'>
                {/* Left Part */}
                <div className="w-full lg:w-2/3 flex flex-col gap-8">
                    {/* Top Charts */}
                    <div className="flex gap-4 flex-col lg:flex-row">
                        {/* Count Chart */}
                        <div className="w-full lg:w-1/3 h-[450px]">
                            <CountChart />
                        </div>
                        {/* Attendance Chart */}
                        <div className="w-full lg:w-2/3 h-[450px]">
                            <AttendanceCharts />
                        </div>
                    </div>

                    {/* Bottom Chart */}
                    <div className="w-full h-[500px]">
                        <FinanceChart />
                    </div>
                </div>

                {/* Right Part */}
                <div className="w-full lg:w-1/3 flex flex-col gap-8">
                    <div>
                        <EventCalendar />
                    </div>
                    <div>
                        <Announcement />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;