"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface TimeSlot {
    id: number;
    label: string;
    startTime: string;
    endTime: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timeSlots: TimeSlot[];
    setTimeSlots: (slots: TimeSlot[]) => void;
}

export default function TimeSlotManager({ open, onOpenChange, timeSlots, setTimeSlots }: Props) {
    const [form, setForm] = useState({
        label: "",
        startTime: "",
        endTime: "",
    });

    const [loading, setLoading] = useState(false);

    // Fetch slots from API when modal opens
    useEffect(() => {
        if (open) fetchSlots();
    }, [open]);

    const fetchSlots = async () => {
        try {
            const res = await api.get("/time-slots");
            setTimeSlots(res.data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load time slots" });
        }
    };

    
    const handleAdd = async () => {
        // Simple validation
        if (!form.label || !form.startTime || !form.endTime) {
            toast({
                variant: "destructive",
                title: "Missing data",
                description: "Please fill all fields.",
            });
            return;
        }

        // ✅ Payload must match DTO exactly
        const payload = {
            label: form.label,
            startTime: form.startTime, // "09:00"
            endTime: form.endTime,     // "12:00"
        };

        try {
            await api.post("/time-slots", payload);
            toast({ title: "Time slot added successfully" });
            setForm({ label: "", startTime: "", endTime: "" });
            fetchSlots();
        } catch (err: any) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "Failed to add time slot.",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this time slot?")) return;
        try {
            await api.delete(`/time-slots/${id}`);
            setTimeSlots(timeSlots.filter((t) => t.id !== id));
            toast({ title: "Time slot deleted" });
        } catch {
            toast({ variant: "destructive", title: "Failed to delete" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage Time Slots</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <Input
                            placeholder="Label (e.g. Morning)"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                        />
                        <Input
                            type="time"
                            value={form.startTime}
                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        />
                        <Input
                            type="time"
                            value={form.endTime}
                            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        />
                    </div>

                    <Button onClick={handleAdd} disabled={loading} className="w-full">
                        {loading ? "Adding..." : "Add Time Slot"}
                    </Button>

                    <div className="border-t pt-3 max-h-[250px] overflow-y-auto">
                        {timeSlots.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm">No time slots yet</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="py-2 px-1">Label</th>
                                        <th className="py-2 px-1">Start</th>
                                        <th className="py-2 px-1">End</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                        .map((slot) => (
                                            <tr key={slot.id} className="border-b hover:bg-muted/50">
                                                <td className="py-1 px-1">{slot.label}</td>
                                                <td className="py-1 px-1">{slot.startTime}</td>
                                                <td className="py-1 px-1">{slot.endTime}</td>
                                                <td className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(slot.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
