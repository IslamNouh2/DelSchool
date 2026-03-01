"use client";

import { useDrag, useDrop } from 'react-dnd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
    readOnly?: boolean;
}

export const TimetableSlot = ({ slot, day, timeSlotId, onDrop, onDelete, onEdit, onAdd, readOnly = false }: SlotProps) => {
    const t = useTranslations("timetable.slot");
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'slot',
        item: { slot, day, timeSlotId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: !readOnly && !!slot,
    }), [slot, day, timeSlotId, readOnly]);

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
                className={`p-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[24px] min-h-[100px] flex items-center justify-center transition-all group ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5'} ${
                    isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500/50' : ''
                }`}
            >
                {!readOnly && (
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <Plus className="w-5 h-5" />
                    </div>
                )}
            </div>
        );
    }

    const subjectName = slot.subject?.subjectName?.toLowerCase() || '';
    const isLunch = subjectName.includes('lunch') || subjectName.includes('break') || subjectName.includes('pause') || subjectName.includes('استراحة');

    // Premium Color Palette
    const getSubjectColor = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('math')) return 'bg-[#0052cc] text-white';
        if (n.includes('english')) return 'bg-[#d97706] text-white';
        if (n.includes('science') || n.includes('bio') || n.includes('phys')) return 'bg-[#7c3aed] text-white';
        if (n.includes('hist') || n.includes('geo')) return 'bg-[#10b981] text-white';
        if (n.includes('art') || n.includes('music')) return 'bg-[#e11d48] text-white';
        if (n.includes('sport') || n.includes('eps')) return 'bg-[#0891b2] text-white';
        if (isLunch) return 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400';
        
        // Fallback color based on string hash
        const colors = [
            'bg-[#0052cc] text-white',
            'bg-[#d97706] text-white',
            'bg-[#7c3aed] text-white',
            'bg-[#10b981] text-white',
            'bg-[#e11d48] text-white',
            'bg-[#0891b2] text-white',
            'bg-[#475569] text-white'
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const colorClasses = getSubjectColor(slot.subject?.subjectName || '');

    return (
        <div
            ref={attachRef}
            className={`p-4 rounded-[24px] cursor-move shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[100px] flex flex-col justify-between group ${
                isDragging ? 'opacity-50 scale-95' : 'opacity-100'
            } ${isOver ? 'ring-4 ring-blue-500/30' : ''} ${colorClasses}`}
        >
            <div>
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black tracking-tight leading-tight uppercase mb-1 line-clamp-2">
                        {slot.subject?.subjectName || t("unknown_subject")}
                    </h3>
                    {!readOnly && (
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(slot); }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete?.(slot.id); }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
                
                {!isLunch && (
                    <div className="mt-1 flex flex-col gap-0.5">
                        <p className="text-[10px] font-black opacity-80 uppercase tracking-wider line-clamp-1">
                            {slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : t("no_teacher")}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-end justify-between">
                <div>
                     {!isLunch && slot.class && (
                        <span className="text-[10px] font-black bg-white/20 py-1 px-2 rounded-full uppercase tracking-tighter">
                            {slot.class.ClassName}
                        </span>
                    )}
                    {slot.room && (
                        <span className="text-[10px] font-black ml-1 uppercase opacity-60">
                             • {slot.room}
                        </span>
                    )}
                </div>
                <div className="text-[9px] font-black opacity-40 uppercase tracking-widest leading-none">
                    {slot.day.substring(0, 3)}
                </div>
            </div>
        </div>
    );
};
