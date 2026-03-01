"use client";

import TimetableCalendar from "@/components/Timetable";

export default function TimetablePage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase italic">
                        Timetable Management
                    </h2>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                        Configure and manage school-wide academic schedules
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-white/5 transition-all">
                <TimetableCalendar />
            </div>
        </div>
    );
};
