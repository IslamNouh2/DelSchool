"use client"

import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { calendarEvents } from '@/lib/data';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from 'react';

const localizer = momentLocalizer(moment)

import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { Button } from "./ui/button";

const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = moment(toolbar.date);
        return (
            <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
                {date.format('MMMM')} <span className="text-blue-500 not-italic">{date.format('YYYY')}</span>
            </span>
        );
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-[#1a1c2e] p-6 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <CalIcon className="w-5 h-5 text-blue-500" />
                </div>
                {label()}
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToBack}
                        className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-none"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={goToCurrent}
                        className="h-8 px-4 rounded-lg hover:bg-white dark:hover:bg-slate-800 font-bold text-[10px] uppercase tracking-widest shadow-none"
                    >
                        Today
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-none"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/5 ml-2">
                    <Button
                        variant={toolbar.view === 'work_week' ? 'secondary' : 'ghost'}
                        onClick={() => toolbar.onView('work_week')}
                        className={`h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${
                            toolbar.view === 'work_week' 
                            ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-500' 
                            : 'text-gray-500'
                        }`}
                    >
                        Week
                    </Button>
                    <Button
                        variant={toolbar.view === 'day' ? 'secondary' : 'ghost'}
                        onClick={() => toolbar.onView('day')}
                        className={`h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${
                            toolbar.view === 'day' 
                            ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-500' 
                            : 'text-gray-500'
                        }`}
                    >
                        Day
                    </Button>
                </div>
            </div>
        </div>
    );
};

const BigCalender = ({
    userType,
    userId,
}: {
    userType?: string;
    userId?: number;
}) => {
    const [view, setView] = useState<View>(Views.WORK_WEEK);

    const handleOnChangedView = (selectedView: View) => {
        setView(selectedView)
    };
    return (
        <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            views={["work_week", "day"]}
            view={view}
            style={{ height: "100%" }}
            onView={handleOnChangedView}
            min={new Date(2026, 1, 0, 8, 0, 0)}
            max={new Date(2026, 1, 0, 17, 0, 0)}
            components={{
                toolbar: CustomToolbar
            }}
        />
    );
}


export default BigCalender