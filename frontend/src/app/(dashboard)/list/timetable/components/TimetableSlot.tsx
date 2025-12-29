"use client";

import { useDrag, useDrop } from 'react-dnd';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Define types based on what we saw in Timetable.tsx
// We might need to import these or redefine them. 
// For now, I'll define them here to be self-contained or accept generic props.

export interface TimetableEntry {
    id: number;
    day: string;
    classId: number;
    subjectId: number;
    timeSlotId: number;
    employerId: number;
    academicYear: string;
    subject: { subjectName: string };
    teacher?: { firstName: string; lastName: string }; // Assuming teacher is populated
    class?: { ClassName: string }; // Assuming class is populated
    room?: string; // Not in original TimetableEntry but in test design
}

interface SlotProps {
    slot: TimetableEntry | null;
    day: string;
    timeSlotId: number;
    onDrop?: (item: any, day: string, timeSlotId: number) => void;
    onDelete?: (id: number) => void;
    onEdit?: (entry: TimetableEntry) => void;
    onAdd?: (day: string, timeSlotId: number) => void;
}

export const TimetableSlot = ({ slot, day, timeSlotId, onDrop, onDelete, onEdit, onAdd }: SlotProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'slot',
        item: { slot, day, timeSlotId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: !!slot,
    }), [slot, day, timeSlotId]);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'slot',
        drop: (item: any) => {
            if (onDrop) {
                onDrop(item, day, timeSlotId);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }), [day, timeSlotId, onDrop]);

    // Combine refs
    const attachRef = (el: HTMLDivElement | null) => {
        drag(drop(el));
    };

    if (!slot) {
        return (
            <div
                ref={drop as any}
                onClick={() => onAdd?.(day, timeSlotId)}
                className={`p-3 border border-dashed border-border rounded-xl min-h-[80px] hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer ${
                    isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-muted/30'
                }`}
            >
                <button className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-blue-500 transition-colors">
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        );
    }

    const subjectName = slot.subject?.subjectName?.toLowerCase() || '';
    const isLunch = subjectName.includes('lunch') || subjectName.includes('break');

    return (
        <div
            ref={attachRef}
            className={`p-3 rounded-xl cursor-move transition-all ${
                isDragging ? 'opacity-50' : 'opacity-100'
            } ${
                isOver ? 'ring-2 ring-blue-500' : ''
            } ${
                isLunch 
                    ? 'bg-muted border border-border' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-md'
            }`}
        >
            <div className="flex items-start justify-between mb-2">
                <p className={`text-sm font-medium ${isLunch ? 'text-muted-foreground' : 'text-foreground'}`}>{slot.subject?.subjectName || 'Unknown Subject'}</p>
                {!isLunch && (
                    <div className="flex gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit?.(slot); }}
                            className="p-1 hover:bg-background rounded transition-colors"
                        >
                            <Edit className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete?.(slot.id); }}
                            className="p-1 hover:bg-background rounded transition-colors"
                        >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </button>
                    </div>
                )}
            </div>
            {!isLunch && (
                <>
                    <p className="text-xs text-muted-foreground mb-1">
                        {slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : 'No Teacher'}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                        {slot.class?.ClassName || ''} {slot.room ? `• Room ${slot.room}` : ''}
                    </p>
                </>
            )}
        </div>
    );
};
