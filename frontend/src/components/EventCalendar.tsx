"use client"

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { motion } from "motion/react";
import EventForm from "./forms/EventForm";


type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

import { useTheme } from "next-themes";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

const EventCalendar = () => {
    const t = useTranslations("dashboard");
    const [value, onChange] = useState<Value>(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get("/event");
            setEvents(res.data);
        } catch (err) {
            console.error("Failed to fetch calendar events", err);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    return (
        <div className='bg-transparent flex flex-col'>
            {/* Calendar Header with Add New */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{t("calendar_title")}</h2>
                <button 
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 text-[#0052cc] hover:text-blue-500 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <div className="w-6 h-6 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <span className="text-lg">+</span>
                    </div>
                    <span>{t("add_new_event")}</span>
                </button>
            </div>

            <div className="custom-calendar-container mb-8">
                <style jsx global>{`
                    .react-calendar {
                        background: transparent !important;
                        color: ${isDark ? '#94a3b8' : '#64748b'} !important;
                        border: none !important;
                        width: 100% !important;
                    }
                    .react-calendar__navigation button {
                        color: ${isDark ? '#f8fafc' : '#111827'} !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.1em !important;
                        font-size: 12px !important;
                    }
                    .react-calendar__navigation button:enabled:hover,
                    .react-calendar__navigation button:enabled:focus {
                        background-color: ${isDark ? '#ffffff05' : '#00000005'} !important;
                    }
                    .react-calendar__month-view__weekdays__weekday {
                        color: ${isDark ? '#64748b' : '#9ca3af'} !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                        font-size: 10px !important;
                        padding: 10px 0 !important;
                    }
                    .react-calendar__tile {
                        color: ${isDark ? '#f1f5f9' : '#374151'} !important;
                        font-weight: 800 !important;
                        font-size: 11px !important;
                        padding: 14px 0 !important;
                        border-radius: 12px !important;
                    }
                    .react-calendar__tile:enabled:hover,
                    .react-calendar__tile:enabled:focus {
                        background-color: ${isDark ? '#ffffff05' : '#00000005'} !important;
                        color: #0052cc !important;
                    }
                    .react-calendar__tile--now {
                        background: ${isDark ? '#ffffff05' : '#00000005'} !important;
                        color: #0052cc !important;
                    }
                    .react-calendar__tile--active {
                        background: #0052cc !important;
                        color: white !important;
                        box-shadow: 0 10px 20px -5px rgba(0,82,204,0.5) !important;
                    }
                    .react-calendar__month-view__days__day--neighboringMonth {
                        color: ${isDark ? '#334155' : '#cbd5e1'} !important;
                    }
                `}</style>
                <Calendar 
                    onChange={onChange} 
                    value={value}
                    className="!font-sans"
                />
            </div>

            <div className="space-y-6 mt-4">
                <div className="flex justify-between items-center">
                    <h1 className="font-black text-gray-900 dark:text-white text-xl tracking-tight uppercase transition-colors">{t("events_title")}</h1>
                </div>
                {events.map((event, idx) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="p-5 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0b0d17]/50 hover:bg-white dark:hover:bg-[#0b0d17] hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="font-black text-sm text-gray-700 dark:text-gray-200 group-hover:text-[#0052cc] transition-colors uppercase tracking-tight">{event.title}</h1>
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                {new Date(event.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 font-medium">{ event.description}</p>
                    </motion.div>
                ))}
            </div>

            <EventForm 
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                type="create"
                onSuccess={fetchEvents}
            />
        </div>
    );
};

export default EventCalendar
