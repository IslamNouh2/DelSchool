// components/TimetableCalendar.tsx
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

const locales = {
    "en-US": require("date-fns/locale/en-US"),
};

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
    subject: { name: string };
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

const generateRecurringEvents = (day: string, weeks: number, timeSlot: TimeSlot, baseDate: Date) => {
    const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    const events: { start: Date; end: Date }[] = [];

    for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(baseDate);
        weekStart.setDate(weekStart.getDate() + (dayMap[day] - weekStart.getDay()) + i * 7);

        const start = new Date(weekStart);
        const end = new Date(weekStart);
        start.setHours(new Date(timeSlot.startTime).getHours(), new Date(timeSlot.startTime).getMinutes());
        end.setHours(new Date(timeSlot.endTime).getHours(), new Date(timeSlot.endTime).getMinutes());

        events.push({ start, end });
    }

    return events;
};

const TimetableCalendar = () => {
    const [events, setEvents] = useState<TimetableEvent[]>([]);
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
    const [teachers, setTeachers] = useState<any[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        const fetchAll = async () => {
            const timetableRes = await fetch("http://localhost:47005/timetable");
            const timetableData: TimetableEntry[] = await timetableRes.json();


            const classRes = await api.get("/class");
            const classesArray = Array.isArray(classRes.data.classes) ? classRes.data.classes : [];
            setClasses(classesArray);

            const teacherRes = await api.get("/employer");
            const teacherArray = Array.isArray(teacherRes.data.employers) ? teacherRes.data.employers : [];
            setTeachers(teacherArray);



            const slotRes = await api.get("/time-slots");
            const slotArray = Array.isArray(slotRes.data) ? slotRes.data : [];
            setTimeSlots(slotArray);
            console.log(slotArray)


            const response = await api.get("/subject");
            const subjectArray = Array.isArray(response.data.subject) ? response.data.subject : [];
            setSubjects(subjectArray);
            console.log(subjectArray)






            const parsed: TimetableEvent[] = timetableData.map((t) => ({
                title: t.subject.name,
                start: new Date(t.timeSlot.startTime),
                end: new Date(t.timeSlot.endTime),
                classId: t.classId,
                subjectId: t.subjectId,
                employerId: t.employerId,
                timeSlotId: t.timeSlotId,
                academicYear: t.academicYear,
                day: t.day,
            }));

            setEvents(parsed);
        };

        fetchAll();
    }, []);

    const handleAddRecurring = async () => {
        const { day, classId, timeSlotId, academicYear, subjectId, employerId } = formData;
        const slot = timeSlots.find((t) => t.id === timeSlotId);
        if (!slot) return;

        // 1. Check if a timetable already exists
        const checkRes = await api.get(
            `http://localhost:47005/timetable?day=${day}&classId=${classId}&timeSlotId=${timeSlotId}&academicYear=${academicYear}`
        );
        //console.log(checkRes);
        const existingTimetables = await checkRes.data;

        // 2. If found, ask for confirmation to update
        if (existingTimetables.length > 0) {
            const shouldUpdate = confirm("A timetable already exists for this time slot. Do you want to update it?");
            if (!shouldUpdate) return;

            // 3. Update existing entries
            await Promise.all(
                existingTimetables.map((t: any) =>
                    fetch(`http://localhost:47005/timetable/${t.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subjectId, employerId }),
                    })
                )
            );

            alert("Timetable updated successfully.");
        } else {
            // 4. If not found, insert recurring subjects
            const baseDate = new Date(2025, 8, 1); // Sept 1, 2025
            const occurrences = generateRecurringEvents(day, 36, slot, baseDate);

            const dtos = occurrences.map(() => ({
                subjectId,
                classId,
                employerId,
                timeSlotId,
                day,
                academicYear,
            }));

            await fetch("http://localhost:47005/timetable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dtos),
            });

            // Update calendar
            setEvents((prev) => [
                ...prev,
                ...occurrences.map(({ start, end }) => ({
                    title: subjects.find((s) => s.subjectId === subjectId)?.subjectName || "Subject",
                    start,
                    end,
                    subjectId,
                    classId,
                    employerId,
                    timeSlotId,
                    day,
                    academicYear,
                })),
            ]);

            alert("Recurring timetable added.");
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4">School Timetable</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <select value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: +e.target.value })} className="border p-2 rounded">
                    <option value={0}>Select Subject</option>
                    {subjects.map((s) => (
                        <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                    ))}
                </select>
                <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: +e.target.value })} className="border p-2 rounded">
                    <option value={0}>Select Class</option>
                    {classes.map((c) => (
                        <option key={c.classId} value={c.classId}>{c.ClassName}</option>
                    ))}
                </select>
                <select value={formData.employerId} onChange={(e) => setFormData({ ...formData, employerId: +e.target.value })} className="border p-2 rounded">
                    <option value={0}>Select Teacher</option>
                    {teachers.map((t) => (
                        <option key={t.employerId} value={t.employerId}>{t.first} {t.lastName}</option>
                    ))}
                </select>
                <select value={formData.timeSlotId} onChange={(e) => setFormData({ ...formData, timeSlotId: +e.target.value })} className="border p-2 rounded">
                    <option value={0}>Select Time Slot</option>
                    {timeSlots.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
                <select value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} className="border p-2 rounded">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            <button onClick={handleAddRecurring} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">
                Add Recurring Subject
            </button>

            <div style={{ height: "80vh" }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    defaultView={Views.WEEK}
                    views={["week"]}
                    step={60}
                    timeslots={1}
                    defaultDate={new Date(2025, 8, 1)}
                    min={new Date(2025, 8, 1, 8, 0)}
                    max={new Date(2025, 8, 1, 17, 0)}
                />
            </div>
        </div>
    );
};

export default TimetableCalendar;