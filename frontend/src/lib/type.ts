export type Weekday = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"

export interface TimeSlot {
    id: number
    start: string
    end: string
}

export interface Subject {
    subjectId: number
    subjectName: string
}

export type TimetableEntry = {
    day: Weekday
    time: string
    subject: string
    subjectId?: number
    teacher: string
}
