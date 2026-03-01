"use client";

import { useEffect, useState, Fragment, useTransition, useOptimistic } from "react";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, Plus, Loader2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TimeSlotManager from "@/app/[locale]/(dashboard)/list/timetable/components/TimeSlotManager";
import { TimetableSlot, TimetableEntry } from "@/app/[locale]/(dashboard)/list/timetable/components/TimetableSlot";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSocket } from "@/providers/SocketProvider";
import { useTranslations } from "next-intl";

interface TimeSlot {
    id: number;
    label: string;
    startTime: string;
    endTime: string;
}

const days_keys = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimetableProps {
    teacherId?: number;
    role?: 'ADMIN' | 'TEACHER';
    readOnly?: boolean;
}

export function TimetableCalendar({ teacherId, role = 'ADMIN', readOnly = false }: TimetableProps = {}) {
    const now = new Date();
    const t = useTranslations("timetable");
    const tForm = useTranslations("timetable.form");
    const [showSlotManager, setShowSlotManager] = useState(false);
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);

    const [isPending, startTransition] = useTransition();

    const [loading, setLoading] = useState(false);
    const { refreshKey } = useSocket();

    const [optimisticTimetable, addOptimisticEntry] = useOptimistic<
        TimetableEntry[],
        TimetableEntry
    >(timetableData, (state, newEntry) => {
        const existingIndex = state.findIndex(
            (t) =>
                t.day === newEntry.day &&
                t.timeSlotId === newEntry.timeSlotId &&
                t.classId === newEntry.classId
        );

        if (existingIndex !== -1) {
            const copy = [...state];
            copy[existingIndex] = newEntry;
            return copy;
        }

        return [...state, newEntry];
    });

    // Form State
    const [formData, setFormData] = useState({
        id: 0, // 0 for new
        subjectId: 0,
        classId: 0,
        employerId: 0,
        timeSlotId: 0,
        day: days_keys[0],
        academicYear: "2025-2026",
    });

    // Data State
    const [subjects, setSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    // 🔹 Load static data
    useEffect(() => {
        Promise.all([
            api.get("/class"), 
            api.get("/time-slots"), 
            api.get("/subject"),
            api.get("/school-year")
        ])
            .then(([classRes, slotRes, subjRes, yearRes]) => {
                setClasses(classRes.data.classes || []);
                setTimeSlots(slotRes.data || []);
                setSubjects(subjRes.data.subjects || []);
                
                // Set current academic year
                const currentYear = yearRes.data.find((y: any) => y.isCurrent);
                if (currentYear) {
                    setFormData(prev => ({ ...prev, academicYear: currentYear.year }));
                }
            })
            .catch(() => {
                toast.error(t("messages.load_error"));
            });
    }, [refreshKey]);

    // 🔹 Fetch timetable when class changes or if teacherId is provided
    useEffect(() => {
        if (!teacherId && formData.classId === 0) return;
        fetchTimetable();
    }, [formData.classId, refreshKey, teacherId]);

    const fetchTimetable = async () => {
        setLoading(true);
        try {
            if (teacherId) {
                // Fetch specific teacher's timetable
                const res = await api.get(`/timetable/teacher/${teacherId}`);
                // The backend API for /timetable/teacher/:id might not naturally filter by academicYear yet, 
                // but we can filter it locally if it returns `academicYear`. Assuming it returns all entries.
                const allData = res.data as TimetableEntry[];
                setTimetableData(allData);
            } else {
                if (formData.classId === 0) return;
                const res = await api.get(`/timetable`);
                const allData = res.data as TimetableEntry[];
                // Filter by selected class AND academic year
                const classData = allData.filter(t => 
                    t.classId === formData.classId && 
                    t.academicYear === formData.academicYear
                );
                setTimetableData(classData);
            }
        } catch (error) {
            console.error("Error fetching timetable:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Auto-select teacher when subject is chosen
    useEffect(() => {
        if (!formData.subjectId) return;

        const fetchTeachersForSubject = async () => {
            try {
                const res = await api.get(`/teacher-subject/subject/${formData.subjectId}`, {
                    params: { academicYear: formData.academicYear }
                });
                // API might return array or single object
                const data = Array.isArray(res.data) ? res.data : [res.data];
                
                // Filter out teachers who have reached their workload
                const teachersList = data
                    .filter((item: any) => item.Employer && !item.isFull)
                    .map((item: any) => item.Employer);
                
                setTeachers(teachersList);

                // Auto-select first teacher if not editing an existing entry with a teacher
                if (teachersList.length > 0 && formData.id === 0) {
                    setFormData(prev => ({ ...prev, employerId: teachersList[0].employerId }));
                } else if (teachersList.length === 0) {
                    setFormData(prev => ({ ...prev, employerId: 0 }));
                    
                    // Don't show toast for Lunch/Break subjects
                    const selectedSubject = subjects.find(s => s.subjectId === formData.subjectId);
                    const isLunch = selectedSubject?.subjectName?.toLowerCase().includes('lunch') || 
                                   selectedSubject?.subjectName?.toLowerCase().includes('break');
                                   
                    if (!isLunch && data.some((item: any) => item.isFull)) {
                        toast.error(t("messages.teachers_full_title"), {
                            description: t("messages.teachers_full_desc"),
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading teachers:", error);
            }
        };

        fetchTeachersForSubject();
    }, [formData.subjectId, formData.academicYear]);

    const handleSubjectSelect = (subjectId: number) => {
        setFormData(prev => ({ ...prev, subjectId }));
    };
    
    // Helper to ensure Lunch subject exists
    const ensureLunchSubject = async () => {
        let lunchSubject = subjects.find(s => 
            s.subjectName.toLowerCase() === 'lunch' || 
            s.subjectName.toLowerCase() === 'break' ||
            s.subjectName.toLowerCase() === 'pause' ||
            s.subjectName.toLowerCase() === 'استراحة'
        );
        
        if (!lunchSubject) {
            try {
                // Create it if it doesn't exist
                const res = await api.post("/subject/createSub", {
                    subjectName: "Break",
                    totalGrads: 20
                });
                lunchSubject = res.data;
                setSubjects(prev => [...prev, lunchSubject]);
                toast.success(t("messages.create_break_auto"));
            } catch (error) {
                console.error("Failed to create break subject", error);
                toast.error(t("messages.load_error")); 
                return null;
            }
        }
        return lunchSubject;
    };

    const handleSave = async () => {
        const { day, classId, timeSlotId, academicYear, subjectId, employerId, id } =
            formData;

        const selectedSubject = subjects.find(
            (s) => s.subjectId === subjectId
        );

        const isLunch =
            selectedSubject?.subjectName?.toLowerCase().includes("lunch") ||
            selectedSubject?.subjectName?.toLowerCase().includes("break");

        if (!subjectId || !classId || !timeSlotId || (!employerId && !isLunch)) {
            toast.error(t("messages.missing_data"));
            return;
        }

        const optimisticEntry: TimetableEntry = {
            id: id || Date.now(), // temporary ID
            subjectId,
            classId,
            employerId,
            timeSlotId,
            day,
            academicYear,
            subject: selectedSubject,
            teacher: teachers.find((t) => t.employerId === employerId),
        };

        // 🔥 Optimistic UI update instantly
        addOptimisticEntry(optimisticEntry);

        startTransition(async () => {
            try {
                if (id > 0) {
                    await api.put(`/timetable/${id}`, {
                        subjectId,
                        employerId,
                        timeSlotId,
                        day,
                    });
                } else {
                    await api.post("/timetable", {
                        subjectId,
                        classId,
                        employerId,
                        timeSlotId,
                        day,
                        academicYear,
                    });
                }

                toast.success(t("messages.save_success"));

                await fetchTimetable(); // sync real data
            } catch (error) {
                toast.error(t("messages.save_error"));
                await fetchTimetable(); // rollback by refetch
            }
        });

        setShowEntryDialog(false);
    };


    const handleDelete = async (id: number) => {
        if (!confirm(t("messages.confirm_delete"))) return;

        startTransition(async () => {
            try {
                await api.delete(`/timetable/${id}`);
                toast.success(t("messages.delete_success"));
                fetchTimetable();
            } catch {
                toast.error(t("messages.delete_error"));
            }
        });
    };

    const handleDrop = async (item: { slot: TimetableEntry, day: string, timeSlotId: number }, newDay: string, newTimeSlotId: number) => {
        const { slot } = item;
        if (slot.day === newDay && slot.timeSlotId === newTimeSlotId) return;

        try {
            await api.put(`/timetable/${slot.id}`, { 
                day: newDay, 
                timeSlotId: newTimeSlotId,
                subjectId: slot.subjectId,
                employerId: slot.employerId 
            });
                toast.success(t("messages.move_success"));
                fetchTimetable();
            } catch (error) {
                toast.error(t("messages.move_error"));
            }
    };

    const openAddDialog = (day?: string, timeSlotId?: number) => {
        setFormData(prev => ({
            ...prev,
            id: 0,
            subjectId: 0,
            employerId: 0,
            day: day || days_keys[0],
            timeSlotId: timeSlotId || (timeSlots[0]?.id || 0)
        }));
        setShowEntryDialog(true);
    };

    const openEditDialog = (entry: TimetableEntry) => {
        setFormData({
            id: entry.id,
            classId: entry.classId,
            subjectId: entry.subjectId,
            employerId: entry.employerId,
            timeSlotId: entry.timeSlotId,
            day: entry.day,
            academicYear: entry.academicYear
        });
        setShowEntryDialog(true);
    };

    const handleDownloadPDF = async () => {
        const timetableElement = document.getElementById("timetable-grid");
        if (!timetableElement) return;

        const canvas = await html2canvas(timetableElement, {
            scale: 2,
            backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("landscape", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text("School Timetable", pageWidth / 2, 15, { align: "center" });
        
        const selectedClass = classes.find(c => c.classId === formData.classId);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Class: ${selectedClass?.ClassName || "N/A"}`, margin, 25);

        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", margin, 35, imgWidth, imgHeight);
        pdf.save("Timetable.pdf");
    };

    const getSlot = (day: string, timeSlotId: number) => {
        return optimisticTimetable.find(t => t.day === day && t.timeSlotId === timeSlotId) || null;
    };

    const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-8 flex flex-col h-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4 uppercase">
                            <div className="p-3 bg-[#0052cc] rounded-[18px] shadow-2xl shadow-blue-500/30 text-white transition-transform">
                                <CalendarIcon size={20} />
                            </div>
                            {teacherId ? "Teaching Schedule" : t("title")}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">
                            {t("subtitle", { year: formData.academicYear })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!teacherId && (
                            <div className="relative group">
                                <select
                                    value={formData.classId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, classId: +e.target.value }))}
                                    className="appearance-none pl-6 pr-12 py-3 border-2 border-gray-100 dark:border-white/5 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-slate-900 text-foreground font-bold transition-all"
                                >
                                    <option value={0}>{t("select_class")}</option>
                                    {classes.map((c) => (
                                        <option key={c.classId} value={c.classId}>
                                            {c.ClassName}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>
                        )}
                        
                        {!readOnly && (
                            <>
                                <Button 
                                    onClick={() => setShowSlotManager(true)}
                                    variant="outline"
                                    className="h-[52px] px-6 rounded-[20px] border-2 border-gray-100 dark:border-white/5 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                >
                                    {t("manage_slots")}
                                </Button>

                                <Button 
                                    onClick={() => openAddDialog()}
                                    className="h-[52px] px-6 bg-[#0052cc] hover:bg-[#0041a3] text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all rounded-[20px] font-bold gap-2"
                                    disabled={!teacherId && formData.classId === 0}
                                >
                                    <Plus className="w-5 h-5" />
                                    {t("add_period")}
                                </Button>
                            </>
                        )}

                        <Button
                            onClick={handleDownloadPDF}
                            variant="destructive"
                            className="h-[52px] px-6 rounded-[20px] font-bold shadow-xl shadow-red-500/10 hover:shadow-red-500/20 transition-all"
                            disabled={!teacherId && formData.classId === 0}
                        >
                            {t("export_pdf")}
                        </Button>
                    </div>
                </div>

                {/* Timetable Grid Container */}
                <div className="flex-1 min-h-0">
                    {!teacherId && formData.classId === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50/50 dark:bg-white/5 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-white/5 p-12 text-center transition-all hover:border-blue-500/20">
                            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl flex items-center justify-center mb-6">
                                <CalendarIcon className="w-10 h-10 text-[#0052cc]" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white mb-2">{t("select_class_prompt")}</h3>
                            <p className="text-gray-500 max-w-xs font-medium">Please choose a class from the dropdown above to manage your academic schedule.</p>
                        </div>
                    ) : (
                        <div className="relative h-full">
                            <div 
                                className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 overflow-auto h-full scrollbar-hide"
                                id="timetable-grid"
                            >
                                <div className="min-w-[1200px]">
                                    <div className="grid grid-cols-7 gap-6">
                                        {/* Time Axis Header */}
                                        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-white/5 rounded-[24px]">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t("time_header")}</span>
                                        </div>
                                        
                                        {/* Day Headers */}
                                        {days_keys.map((day) => {
                                            const isToday = day === currentDayName;
                                            return (
                                                <div 
                                                    key={day} 
                                                    className={`p-4 rounded-[24px] text-center transition-all ${
                                                        isToday 
                                                            ? 'bg-[#0052cc] shadow-xl shadow-blue-500/30' 
                                                            : 'bg-gray-50 dark:bg-white/5'
                                                    }`}
                                                >
                                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-white/70' : 'text-gray-400'}`}>
                                                        {day.substring(0, 3)}
                                                    </p>
                                                    <p className={`text-lg font-black tracking-tighter mt-1 ${isToday ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                        {t(`days.${day}`)}
                                                    </p>
                                                </div>
                                            );
                                        })}

                                        {/* Time Rows */}
                                        {timeSlots.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((time) => (
                                            <Fragment key={time.id}>
                                                {/* Time Info Column */}
                                                <div className="flex flex-col items-center justify-center p-4 relative group">
                                                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-gray-100 dark:bg-white/5 -z-10" />
                                                    <div className="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-white/5 px-3 py-2 rounded-xl group-hover:border-blue-500 transition-colors z-10 shadow-sm">
                                                        <span className="text-xs font-black text-gray-900 dark:text-white block leading-none">{time.startTime}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 block mt-1 uppercase leading-none">{time.endTime}</span>
                                                    </div>
                                                </div>

                                                {/* Daily Slots */}
                                                {days_keys.map((day) => (
                                                    <TimetableSlot
                                                        key={`${day}-${time.id}`}
                                                        slot={getSlot(day, time.id)}
                                                        day={day}
                                                        timeSlotId={time.id}
                                                        onDrop={readOnly ? undefined : handleDrop}
                                                        onDelete={readOnly ? undefined : handleDelete}
                                                        onEdit={readOnly ? undefined : openEditDialog}
                                                        onAdd={readOnly ? undefined : openAddDialog}
                                                        readOnly={readOnly}
                                                    />
                                                ))}
                                            </Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                             {/* Gradient fade to show scrollability if horizontal */}
                            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none rounded-r-[40px] md:hidden" />
                        </div>
                    )}
                </div>

                {/* Legend & Summary */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-[#0052cc]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("legend.scheduled")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("legend.break")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-200 dark:border-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("legend.available")}</span>
                        </div>
                    </div>
                    
                    {teacherId && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-full">
                            Personal Teaching Schedule • Read Only
                        </div>
                    )}
                </div>

                {/* Dialogs */}
                <TimeSlotManager
                    open={showSlotManager}
                    onOpenChange={setShowSlotManager}
                    timeSlots={timeSlots}
                    setTimeSlots={setTimeSlots}
                />

                <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
                    <DialogContent className="rounded-[32px] border-gray-100 dark:border-white/5">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight">{formData.id > 0 ? tForm("edit_title") : tForm("add_title")}</DialogTitle>
                            <DialogDescription className="font-bold text-gray-500">
                                {tForm("description")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6 text-start">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="uppercase text-[10px] font-black tracking-widest text-gray-400">{tForm("day_label")}</Label>
                                    <select
                                        value={formData.day}
                                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                        className="w-full h-12 rounded-2xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    >
                                        {days_keys.map(d => <option key={d} value={d}>{t(`days.${d}`)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase text-[10px] font-black tracking-widest text-gray-400">{tForm("slot_label")}</Label>
                                    <select
                                        value={formData.timeSlotId}
                                        onChange={(e) => setFormData({ ...formData, timeSlotId: +e.target.value })}
                                        className="w-full h-12 rounded-2xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    >
                                        {timeSlots.map(t => (
                                            <option key={t.id} value={t.id}>{t.label} ({t.startTime}-{t.endTime})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <Label className="uppercase text-[10px] font-black tracking-widest text-gray-400">Subject</Label>
                                    <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 px-3 rounded-full"
                                        onClick={async () => {
                                            const lunchSubject = await ensureLunchSubject();
                                            if (lunchSubject) {
                                                handleSubjectSelect(lunchSubject.subjectId);
                                                toast.success(`${t("messages.save_success")}: ${lunchSubject.subjectName}`);
                                            }
                                        }}
                                    >
                                        {tForm("set_break")}
                                    </Button>
                                </div>
                                <select
                                    value={formData.subjectId}
                                    onChange={(e) => handleSubjectSelect(+e.target.value)}
                                    className="w-full h-12 rounded-2xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value={0}>{t("select_class")}</option>
                                    {subjects.map(s => (
                                        <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-black tracking-widest text-gray-400">{tForm("teacher_label")}</Label>
                                <select
                                    value={formData.employerId}
                                    onChange={(e) => setFormData({ ...formData, employerId: +e.target.value })}
                                    className="w-full h-12 rounded-2xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value={0}>{t("slot.no_teacher")}</option>
                                    {teachers.map(t => (
                                        <option key={t.employerId} value={t.employerId}>{t.firstName} {t.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <Button onClick={handleSave} className="w-full h-14 bg-[#0052cc] hover:bg-[#0041a3] text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all rounded-[24px] font-black uppercase tracking-widest mt-4" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5 me-2" />
                                        {tForm("saving")}
                                    </>
                                ) : (
                                    tForm("save_button")
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DndProvider>
    );
};

export default TimetableCalendar;
