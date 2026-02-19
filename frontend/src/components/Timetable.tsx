"use client";

import { useEffect, useState, Fragment, useTransition, useOptimistic } from "react";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, Plus, Loader2 } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TimeSlotManager from "@/app/(dashboard)/list/timetable/components/TimeSlotManager";
import { TimetableSlot, TimetableEntry } from "@/app/(dashboard)/list/timetable/components/TimetableSlot";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSocket } from "@/providers/SocketProvider";

interface TimeSlot {
    id: number;
    label: string;
    startTime: string;
    endTime: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableCalendar() {
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
        day: "Monday",
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
                toast({
                    variant: "destructive",
                    title: "Error loading base data",
                });
            });
    }, [refreshKey]);

    // 🔹 Fetch timetable when class changes
    useEffect(() => {
        if (formData.classId === 0) return;
        fetchTimetable();
    }, [formData.classId, refreshKey]);

    const fetchTimetable = async () => {
        if (formData.classId === 0) return;
        setLoading(true);
        try {
            const res = await api.get(`/timetable`);
            const allData = res.data as TimetableEntry[];
            // Filter by selected class AND academic year
            const classData = allData.filter(t => 
                t.classId === formData.classId && 
                t.academicYear === formData.academicYear
            );
            setTimetableData(classData);
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
                         toast({
                            variant: "destructive",
                            title: "All teachers full",
                            description: "All teachers for this subject have reached their weekly workload.",
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
            s.subjectName.toLowerCase() === 'break'
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
                toast({ title: "Created 'Break' subject automatically" });
            } catch (error) {
                console.error("Failed to create break subject", error);
                toast({ variant: "destructive", title: "Failed to create Break subject" });
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
            toast({
                variant: "destructive",
                title: "Missing data",
            });
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

                toast({ title: "Saved successfully" });

                await fetchTimetable(); // sync real data
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error saving",
                });

                await fetchTimetable(); // rollback by refetch
            }
        });

        setShowEntryDialog(false);
    };


    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;

        startTransition(async () => {
            try {
                await api.delete(`/timetable/${id}`);
                toast({ title: "Deleted" });
                fetchTimetable();
            } catch {
                toast({ variant: "destructive", title: "Error deleting" });
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
            toast({ title: "Moved successfully" });
            fetchTimetable();
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to move entry" });
        }
    };

    const openAddDialog = (day?: string, timeSlotId?: number) => {
        setFormData(prev => ({
            ...prev,
            id: 0,
            subjectId: 0,
            employerId: 0,
            day: day || "Monday",
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

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="p-3 bg-lamaYellow rounded-2xl shadow-lg shadow-yellow-500/20 text-white">
                                <CalendarIcon size={24} />
                            </div>
                            Timetable Management
                        </h1>
                        <p className="text-gray-500 font-medium mt-2 max-w-lg">
                            Manage class schedules for <span className="font-medium text-blue-600">{formData.academicYear}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={formData.classId}
                            onChange={(e) => setFormData(prev => ({ ...prev, classId: +e.target.value }))}
                            className="px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                        >
                            <option value={0}>Select Class</option>
                            {classes.map((c) => (
                                <option key={c.classId} value={c.classId}>
                                    {c.ClassName}
                                </option>
                            ))}
                        </select>
                        
                        <Button 
                            onClick={() => setShowSlotManager(true)}
                            variant="outline"
                            className="gap-2"
                        >
                            Manage Slots
                        </Button>

                        <Button 
                            onClick={() => openAddDialog()}
                            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all rounded-xl"
                            disabled={formData.classId === 0}
                        >
                            <Plus className="w-5 h-5" />
                            Add Period
                        </Button>

                        <Button
                            onClick={handleDownloadPDF}
                            variant="destructive"
                            className="gap-2 rounded-xl"
                            disabled={formData.classId === 0}
                        >
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Timetable Grid */}
                {formData.classId === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] bg-card rounded-2xl border border-dashed border-border">
                        <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Please select a class to view the timetable</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-2xl p-6 shadow-sm border border-border overflow-x-auto"
                        id="timetable-grid"
                    >
                        <div className="min-w-[1000px]">
                            <div className="grid grid-cols-7 gap-4">
                                {/* Header */}
                                <div className="p-3 bg-muted/50 rounded-xl">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="w-5 h-5" />
                                        <span>Time</span>
                                    </div>
                                </div>
                                {days.map((day) => (
                                    <div key={day} className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                                        <p className="text-foreground text-center font-medium">{day}</p>
                                    </div>
                                ))}

                                {/* Time Slots */}
                                {timeSlots.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((time) => (
                                    <Fragment key={time.id}>
                                        <div className="p-3 bg-muted/50 rounded-xl flex flex-col justify-center">
                                            <span className="text-foreground font-medium text-sm">{time.label}</span>
                                            <span className="text-muted-foreground text-xs">{time.startTime} - {time.endTime}</span>
                                        </div>
                                        {days.map((day) => (
                                            <TimetableSlot
                                                key={`${day}-${time.id}`}
                                                slot={getSlot(day, time.id)}
                                                day={day}
                                                timeSlotId={time.id}
                                                onDrop={handleDrop}
                                                onDelete={handleDelete}
                                                onEdit={openEditDialog}
                                                onAdd={openAddDialog}
                                            />
                                        ))}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                >
                    <h2 className="text-foreground mb-4 font-medium">Legend</h2>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded"></div>
                            <span className="text-muted-foreground text-sm">Scheduled Class</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-muted border border-border rounded"></div>
                            <span className="text-muted-foreground text-sm">Break / Lunch</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-muted/30 border border-dashed border-border rounded"></div>
                            <span className="text-muted-foreground text-sm">Available Slot</span>
                        </div>
                    </div>
                </motion.div>

                {/* Dialogs */}
                <TimeSlotManager
                    open={showSlotManager}
                    onOpenChange={setShowSlotManager}
                    timeSlots={timeSlots}
                    setTimeSlots={setTimeSlots}
                />

                <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{formData.id > 0 ? "Edit Timetable Entry" : "Add Timetable Entry"}</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to schedule a class or break.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>Day</Label>
                                <select
                                    value={formData.day}
                                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Time Slot</Label>
                                <select
                                    value={formData.timeSlotId}
                                    onChange={(e) => setFormData({ ...formData, timeSlotId: +e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {timeSlots.map(t => (
                                        <option key={t.id} value={t.id}>{t.label} ({t.startTime}-{t.endTime})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label>Subject</Label>
                                    <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 text-xs text-blue-600 hover:text-blue-700 px-2"
                                        onClick={async () => {
                                            const lunchSubject = await ensureLunchSubject();
                                            if (lunchSubject) {
                                                handleSubjectSelect(lunchSubject.subjectId);
                                                toast({ title: `Selected: ${lunchSubject.subjectName}` });
                                            }
                                        }}
                                    >
                                        Set as Lunch Break
                                    </Button>
                                </div>
                                <select
                                    value={formData.subjectId}
                                    onChange={(e) => handleSubjectSelect(+e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value={0}>Select Subject</option>
                                    {subjects.map(s => (
                                        <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Teacher</Label>
                                <select
                                    value={formData.employerId}
                                    onChange={(e) => setFormData({ ...formData, employerId: +e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value={0}>Select Teacher</option>
                                    {teachers.map(t => (
                                        <option key={t.employerId} value={t.employerId}>{t.firstName} {t.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={handleSave} className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Entry"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DndProvider>
    );
}
