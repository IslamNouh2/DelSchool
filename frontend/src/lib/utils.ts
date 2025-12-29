import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TimeSlot } from "./type";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTimeSlots(start = 8, end = 17): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = start; hour < end; hour++) {
    const startStr = `${hour.toString().padStart(2, '0')}:00`;
    const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({ id: hour, start: startStr, end: endStr });
  }
  return slots;
}