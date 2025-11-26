"use client";

import { useEffect, useState } from "react";
import {
    Calendar,
    dateFnsLocalizer,
    Views,
    type Event as CalendarEvent,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { enUS } from "date-fns/locale";
import { Button } from "./ui/button";
import TimeSlotManager from "@/app/(dashboard)/list/timetable/components/TimeSlotManager";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface TimeSlot {
    id: number;
    label: string;
    startTime: string;
    endTime: string;
}

interface TimetableEntry {
    id: number;
    day: string;
    classId: number;
    subjectId: number;
    timeSlotId: number;
    employerId: number;
    academicYear: string;
    subject: { subjectName: string };
    timeSlot: TimeSlot;
}

interface TimetableEvent extends CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    classId: number;
    subjectId: number;
    employerId: number;
    timeSlotId: number;
    academicYear: string;
    day: string;
}

const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

const baseWeek = new Date(2025, 8, 1);

export default function TimetableCalendar() {
    const [showSlotManager, setShowSlotManager] = useState(false);
    const [events, setEvents] = useState<TimetableEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(baseWeek);
    const [formData, setFormData] = useState({
        subjectId: 0,
        classId: 0,
        employerId: 0,
        timeSlotId: 0,
        day: "Monday",
        academicYear: "2025-2026",
    });
    const [subjects, setSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    // 🔹 Map Timetable DB rows to Calendar Events
    const mapTimetableToEvents = (timetableData: TimetableEntry[]): TimetableEvent[] => {
        return timetableData.map((t) => {
            const startDate = new Date(baseWeek);
            const dayDiff = dayMap[t.day] - startDate.getDay();
            startDate.setDate(startDate.getDate() + dayDiff);

            const [startHour, startMinute] = t.timeSlot.startTime.split(":").map(Number);
            const [endHour, endMinute] = t.timeSlot.endTime.split(":").map(Number);

            const start = new Date(startDate);
            const end = new Date(startDate);

            start.setHours(startHour, startMinute, 0, 0);
            end.setHours(endHour, endMinute, 0, 0);

            return {
                title: `${t.subject.subjectName}`,
                start,
                end,
                ...t,
            };
        });
    };

    // 🔹 Load static data
    useEffect(() => {
        Promise.all([api.get("/class"), api.get("/time-slots")])
            .then(([classRes, slotRes]) => {
                setClasses(classRes.data.classes || []);
                setTimeSlots(slotRes.data || []);
            })
            .catch(() => {
                toast({
                    variant: "destructive",
                    title: "Error loading base data",
                });
            });
    }, []);

    // 🔹 Fetch timetable when class changes
    useEffect(() => {
        if (formData.classId === 0) return;
        const fetchTimetable = async () => {
            try {
                const res = await api.get(`/timetable`);
                const parsed = mapTimetableToEvents(res.data);
                setEvents(parsed);

                // Load subjects
                const subjRes = await api.get(`/subject`);
                setSubjects(subjRes.data.subjects || []);
            } catch (error) {
                console.error("Error fetching timetable:", error);
            }
        };
        fetchTimetable();
    }, [formData.classId]);

    // 🔹 Auto-select teacher when subject is chosen
    useEffect(() => {
        if (!formData.subjectId) return;

        const fetchTeachersForSubject = async () => {
            try {
                const res = await api.get(`/teacher-subject/subject/${formData.subjectId}`);
                const teachers = res.data.map((item: any) => item.Employer);
                setTeachers(teachers);

                // Optional: auto-select first teacher
                if (teachers.length > 0) {
                    setFormData(prev => ({ ...prev, employerId: teachers[0].employerId }));
                }
            } catch (error) {
                console.error("Error loading teachers:", error);
                toast({
                    variant: "destructive",
                    title: "Failed to load teachers for this subject",
                });
            }
        };

        fetchTeachersForSubject();
    }, [formData.subjectId]);


    // Print Section 
    const handleDownloadPDF = async () => {
        const timetableElement = document.getElementById("timetable-print");
        if (!timetableElement) return;

        // Capture the timetable section as image
        const canvas = await html2canvas(timetableElement, {
            scale: 2,
            backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("landscape", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        // === Header Section ===
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text("🏫 Modern High School", pageWidth / 2, 15, { align: "center" });

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Academic Year: 2025–2026`, margin, 25);
        pdf.text(`Class: ${formData.classId || "N/A"}`, margin + 80, 25);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 70, 25);

        pdf.setLineWidth(0.5);
        pdf.line(margin, 28, pageWidth - margin, 28); // Divider line

        // === Add timetable image ===
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const yPosition = 35;

        pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);

        // === Footer ===
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
            "Generated automatically by School Timetable System",
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
        );

        pdf.save("Timetable_Report.pdf");
    };

    // 🔹 When user selects a subject
    const handleSubjectSelect = async (subjectId: number) => {
        setFormData(prev => ({ ...prev, subjectId }));
        if (!subjectId) return;

        try {
            const res = await api.get(`/teacher-subject/subject/${subjectId}`);
            console.log("TeacherSubject API result:", res.data);

            const data = Array.isArray(res.data) ? res.data : [res.data];
            const teachers = data.map((item: any) => item.Employer).filter(Boolean);
            setTeachers(teachers);

            if (teachers.length > 0) {
                setFormData(prev => ({ ...prev, employerId: teachers[0].employerId }));
            } else {
                setFormData(prev => ({ ...prev, employerId: 0 }));
            }
        } catch (error) {
            console.error("Error loading teachers:", error);
            toast({
                variant: "destructive",
                title: "Failed to load teachers for this subject",
            });
        }
    };


    // 🔹 Navigation functions
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleBack = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // 🔹 Get date range for display
    const getDateRange = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        return {
            start: format(startOfWeek, "MMMM dd"),
            end: format(endOfWeek, "MMMM dd")
        };
    };

    // 🔹 Add or Update timetable entry
    const handleAdd = async () => {
        const { day, classId, timeSlotId, academicYear, subjectId, employerId } = formData;
        if (!subjectId || !classId || !timeSlotId || !employerId) {
            toast({
                variant: "destructive",
                title: "Missing data",
                description: "Please select class, subject and time slot.",
            });
            return;
        }

        const payload = { subjectId, classId, employerId, timeSlotId, day, academicYear };

        try {
            const checkRes = await api.get("/timetable/check", {
                params: { day, classId, timeSlotId, academicYear },
            });
            const existing = checkRes.data;

            if (existing?.length > 0) {
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

            const timetableRes = await api.get(`/timetable`);
            setEvents(mapTimetableToEvents(timetableRes.data));
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error saving timetable",
            });
        }
    };

    return (
        <div className="p-6 ">
                <h1 className="text-2xl font-semibold mb-4">School Timetable</h1>
                <div className="mb-4 p-3 bg-card border border-border rounded-lg shadow-sm">
                {/* 🔹 Form Controls */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                    {/* Class */}
                    <select
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: +e.target.value })}
                        className="border p-2 rounded"
                    >
                        <option value={0}>Select Class</option>
                        {classes.map((c) => (
                            <option key={c.classId} value={c.classId}>
                                {c.ClassName}
                            </option>
                        ))}
                    </select>

                    {/* Subject (auto fetches teacher) */}
                    <select
                        value={formData.subjectId}
                        onChange={(e) => handleSubjectSelect(+e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value={0}>Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.subjectId} value={s.subjectId}>
                                {s.subjectName}
                            </option>
                        ))}
                    </select>

                    <select
                        value={formData.employerId}
                        onChange={(e) => setFormData({ ...formData, employerId: +e.target.value })}
                        className="border p-2 rounded"
                    >
                        <option value={0}>Select Teacher</option>
                        {teachers.map((t) => (
                            <option key={t.employerId} value={t.employerId}>
                                {t.firstName} {t.lastName}
                            </option>
                        ))}
                    </select>

                    {/* Time Slot */}
                    <select
                        value={formData.timeSlotId}
                        onChange={(e) => setFormData({ ...formData, timeSlotId: +e.target.value })}
                        className="border p-2 rounded"
                    >
                        <option value={0}>Select Time Slot</option>
                        {timeSlots.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.label}
                            </option>
                        ))}
                    </select>

                    {/* Day */}
                    <select
                        value={formData.day}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        className="border p-2 rounded"
                    >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        onClick={() => setShowSlotManager(true)}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        Manage Time Slots
                    </Button>

                    <Button
                        onClick={handleAdd}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Add / Update Timetable
                    </Button>
                </div>

                <TimeSlotManager
                    open={showSlotManager}
                    onOpenChange={setShowSlotManager}
                    timeSlots={timeSlots}
                    setTimeSlots={setTimeSlots}
                />
            </div>

            {/* Calendar Navigation Header */}
            <div className="flex justify-between items-center mb-4 p-3 bg-card border border-border rounded-lg shadow-sm">
                <div className="flex gap-2">
                    <Button
                        onClick={handleToday}
                        variant="outline"
                        size="sm"
                        className="bg-card border-border hover:bg-muted/50 text-foreground font-medium"
                    >
                        Today
                    </Button>
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        size="sm"
                        className="bg-card border-border hover:bg-muted/50 text-foreground font-medium"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        variant="outline"
                        size="sm"
                        className="bg-card border-border hover:bg-muted/50 text-foreground font-medium"
                    >
                        Next
                    </Button>
                </div>
                <div className="text-lg font-semibold text-foreground">
                    {getDateRange().start} - {getDateRange().end}
                </div>
                <Button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    🖨️ Export as PDF
                </Button>
            </div>

            {/* Calendar */}
            <div id="timetable-print" className="mb-4  bg-card border border-border rounded-lg shadow-sm" >
                <Calendar
                    localizer={localizer}
                    events={events}
                    defaultView={Views.WEEK}
                    views={["week"]}
                    step={60}
                    timeslots={1}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    toolbar={false}
                    startAccessor="start"
                    endAccessor="end"
                    min={new Date(2025, 8, 1, 8, 0)}
                    max={new Date(2025, 8, 1, 18, 0)}
                    culture="en-US"
                    style={{ height: "80vh" }}
                    components={{
                        // 🧩 Custom box in the top-left corner (before Sunday)
                        timeGutterHeader: () => (
                            <div
                                style={{
                                    backgroundColor: "hsl(var(--muted))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    fontWeight: "600",
                                    height: "36px",
                                    fontSize: "0.9rem",
                                    color: "hsl(var(--foreground))",
                                    padding: "8px 12px",
                                    textAlign: "left",
                                }}
                            >
                                Time
                            </div>
                        ),

                        // 📅 Custom event component
                        event: ({ event }) => (
                            <div className="h-full flex flex-col justify-center items-center text-center">
                                <div className="font-medium text-sm">{event.title}</div>
                            </div>
                        ),

                        // 🗓️ Custom header for each weekday
                        week: {
                            header: ({ date, localizer }) => {
                                const dayName = localizer.format(date, "EEEE", "en-US");
                                return (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "0.9rem",
                                            padding: "8px 4px",
                                            borderBottom: "1px solid hsl(var(--border))",
                                            backgroundColor: "hsl(var(--muted))",
                                            color: "hsl(var(--foreground))",
                                            textTransform: "capitalize",
                                            height: "36px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {dayName}
                                    </div>
                                );
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
}

