import moment from "moment"

const dayIndex = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
} as const;

type DayOfWeek = keyof typeof dayIndex;

interface TimetableEntry {
    day: DayOfWeek;
    timeSlot: {
        startTime: string; // e.g., '08:00'
        endTime: string;
    };
    subject: {
        subjectName: string;
    };
    teacher?: {
        firstName: string;
        lastName: string;
    };
    Class?: {
        ClassName: string;
    };
}

export function mapToCalendarEvents(timetable: TimetableEntry[]) {
    return timetable.map(entry => {
        const base = moment().startOf('week').add(dayIndex[entry.day], 'days');
        const start = moment(base.format('YYYY-MM-DD') + 'T' + moment(entry.timeSlot.startTime).format('HH:mm'));
        const end = moment(base.format('YYYY-MM-DD') + 'T' + moment(entry.timeSlot.endTime).format('HH:mm'));

        return {
            title: entry.subject.subjectName,
            start: start.toDate(),
            end: end.toDate(),
            resource: {
                teacher: `${entry.teacher?.firstName ?? ""} ${entry.teacher?.lastName ?? ""}`,
                class: entry.Class?.ClassName ?? ""
            }
        };
    });
}
