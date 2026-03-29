"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, X, Save, Type, AlignLeft, Clock, ChevronDownIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface EventFormProps {
    type?: "create" | "update";
    data?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function EventForm({
    type = "create",
    data,
    open,
    onOpenChange,
    onSuccess,
}: EventFormProps) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
    });
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (type === "update" && data) {
            setForm({
                title: data.title || "",
                description: data.description || "",
                startTime: data.startTime ? new Date(data.startTime).toISOString() : "",
                endTime: data.endTime ? new Date(data.endTime).toISOString() : "",
            });
            if (data.startTime) setStartDate(new Date(data.startTime));
            if (data.endTime) setEndDate(new Date(data.endTime));
        } else {
            setForm({
                title: "",
                description: "",
                startTime: "",
                endTime: "",
            });
            setStartDate(undefined);
            setEndDate(undefined);
        }
    }, [type, data, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            toast({ variant: "destructive", title: "Dates required", description: "Please select start and end times" });
            return;
        }
        
        setLoading(true);

        try {
            const payload = {
                ...form,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            };

            if (type === "create") {
                await api.post("/event", payload);
                toast({ title: "Event created successfully" });
            } else {
                await api.put(`/event/${data.id}`, payload);
                toast({ title: "Event updated successfully" });
            }
            onOpenChange?.(false);
            onSuccess?.();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "An error occurred",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#1a1c2e] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative border border-gray-100 dark:border-white/5"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#0b0d17]/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {type === "create" ? "Add New Event" : "Edit Event"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {type === "create" ? "Schedule a new school activity" : "Update event details and timing"}
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenChange?.(false)}
                        className="p-2 hover:bg-white dark:hover:bg-[#1a1c2e] hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Basic Info Section */}
                    <Section title="Basic Information" icon={<Type className="w-5 h-5 text-blue-500" />}>
                        <div className="space-y-4">
                            <FormItem label="Event Title" required>
                                <Input 
                                    value={form.title} 
                                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} 
                                    placeholder="e.g. Parent-Teacher Meeting" 
                                    required 
                                    className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" 
                                />
                            </FormItem>
                            <FormItem label="Description">
                                <Textarea 
                                    value={form.description} 
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
                                    placeholder="Provide more context about the event..." 
                                    className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white min-h-[100px] focus:ring-blue-500/50" 
                                />
                            </FormItem>
                        </div>
                    </Section>

                    {/* Schedule Section */}
                    <Section title="Schedule" icon={<Clock className="w-5 h-5 text-indigo-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem label="Start Date & Time" required>
                                <DatePicker value={startDate} onChange={setStartDate} />
                            </FormItem>
                            <FormItem label="End Date & Time" required>
                                <DatePicker value={endDate} onChange={setEndDate} />
                            </FormItem>
                        </div>
                    </Section>
                    {/* Footer Actions */}
                    <div className="py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0b0d17]/50 flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange?.(false)}
                            disabled={loading}
                            className="rounded-xl px-6 py-2.5 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-[#1a1c2e] hover:shadow-sm dark:text-gray-300 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    {type === "create" ? "Create Event" : "Update Event"}
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                {icon}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FormItem({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
        </div>
    );
}

function DatePicker({ value, onChange }: { value?: Date; onChange: (date: Date | undefined) => void }) {
    const [open, setOpen] = useState(false);
    
    // Helper to handle date and time selection
    const handleSelect = (date: Date | undefined) => {
        if (!date) return;
        
        // Preserve existing time if updating date
        const newDate = new Date(date);
        if (value) {
            newDate.setHours(value.getHours());
            newDate.setMinutes(value.getMinutes());
        } else {
            newDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
        }
        
        onChange(newDate);
        setOpen(false);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const newDate = value ? new Date(value) : new Date();
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        onChange(newDate);
    };

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-between font-normal rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1c2e] transition-colors">
                        {value ? value.toLocaleDateString() : <span className="text-gray-400">Select date</span>}
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-gray-100 dark:border-white/5 dark:bg-[#1a1c2e]" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <Input 
                type="time" 
                value={value ? value.toTimeString().slice(0,5) : "09:00"}
                onChange={handleTimeChange}
                className="w-32 rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50"
            />
        </div>
    );
}
