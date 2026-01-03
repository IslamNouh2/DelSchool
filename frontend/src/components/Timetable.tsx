"use client";

import { useEffect, useState, Fragment } from "react";
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
    const [loading, setLoading] = useState(false);
    const { refreshKey } = useSocket();

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
        Promise.all([api.get("/class"), api.get("/time-slots"), api.get("/subject")])
            .then(([classRes, slotRes, subjRes]) => {
                setClasses(classRes.data.classes || []);
                setTimeSlots(slotRes.data || []);
                setSubjects(subjRes.data.subjects || []);
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
            // Filter by selected class
            const classData = allData.filter(t => t.classId === formData.classId);
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
                const res = await api.get(`/teacher-subject/subject/${formData.subjectId}`);
                // API might return array or single object
                const data = Array.isArray(res.data) ? res.data : [res.data];
                const teachersList = data.map((item: any) => item.Employer).filter(Boolean);
                setTeachers(teachersList);

                // Auto-select first teacher if not editing an existing entry with a teacher
                if (teachersList.length > 0 && formData.id === 0) {
                    setFormData(prev => ({ ...prev, employerId: teachersList[0].employerId }));
                } else if (teachersList.length === 0) {
                    setFormData(prev => ({ ...prev, employerId: 0 }));
                }
            } catch (error) {
                console.error("Error loading teachers:", error);
            }
        };

        fetchTeachersForSubject();
    }, [formData.subjectId]);

    const handleSubjectSelect = (subjectId: number) => {
        setFormData(prev => ({ ...prev, subjectId }));
    };

    const handleSave = async () => {
        const { day, classId, timeSlotId, academicYear, subjectId, employerId, id } = formData;
        
        // Check if subject is lunch/break
        const selectedSubject = subjects.find(s => s.subjectId === subjectId);
        const isLunch = selectedSubject?.subjectName?.toLowerCase().includes('lunch') || 
                       selectedSubject?.subjectName?.toLowerCase().includes('break');

        if (!subjectId || !classId || !timeSlotId || (!employerId && !isLunch)) {
            toast({
                variant: "destructive",
                title: "Missing data",
                description: "Please select class, subject, teacher and time slot.",
            });
            return;
        }

        const payload = { subjectId, classId, employerId, timeSlotId, day, academicYear };

        try {
            if (id > 0) {
                // Update
                await api.put(`/timetable/${id}`, { subjectId, employerId, timeSlotId, day });
                toast({ title: "Timetable updated successfully" });
            } else {
                // Create
                const checkRes = await api.get("/timetable/check", {
                    params: { day, classId, timeSlotId, academicYear },
                });
                const existing = checkRes.data;

                if (existing?.length > 0) {
                    // Update existing if found (overwrite)
                    await Promise.all(
                        existing.map((entry: any) =>
                            api.put(`/timetable/${entry.id}`, { subjectId, employerId })
                        )
                    );
                    toast({ title: "Timetable updated successfully" });
                } else {
                    await api.post("/timetable", payload);
                    toast({ title: "New timetable entry added" });
                }
            }

            setShowEntryDialog(false);
            fetchTimetable();
            // Reset form (keep classId)
            setFormData(prev => ({ ...prev, id: 0, subjectId: 0, employerId: 0 }));
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error saving timetable",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        try {
            await api.delete(`/timetable/${id}`);
            toast({ title: "Entry deleted" });
            fetchTimetable();
        } catch (error) {
            toast({ variant: "destructive", title: "Error deleting entry" });
        }
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
        return timetableData.find(t => t.day === day && t.timeSlotId === timeSlotId) || null;
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1">Timetable Management</h1>
                        <p className="text-muted-foreground">Manage class schedules and time slots</p>
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
                                        onClick={() => {
                                            const lunchSubject = subjects.find(s => s.subjectName.toLowerCase().includes('lunch') || s.subjectName.toLowerCase().includes('break'));
                                            
                                            if (lunchSubject) {
                                                handleSubjectSelect(lunchSubject.subjectId);
                                                toast({ title: `Selected: ${lunchSubject.subjectName}` });
                                            } else {
                                                toast({ 
                                                    title: "Subject not found", 
                                                    description: "Please create a subject named 'Lunch' or 'Break' first.",
                                                    variant: "destructive" 
                                                });
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
                            <Button onClick={handleSave} className="w-full">
                                Save Entry
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DndProvider>
    );
}
