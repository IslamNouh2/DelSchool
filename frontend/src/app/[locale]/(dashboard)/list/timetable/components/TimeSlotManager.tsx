"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast as sonnerToast } from "sonner";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("timetable.slots");
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
            sonnerToast.error(t("load_error"));
        }
    };

    
    const handleAdd = async () => {
        // Simple validation
        if (!form.label || !form.startTime || !form.endTime) {
            sonnerToast.error(t("missing_data", { defaultValue: "Please fill all fields" }));
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
            sonnerToast.success(t("save_success"));
            setForm({ label: "", startTime: "", endTime: "" });
            fetchSlots();
        } catch (err: any) {
            console.error(err);
            sonnerToast.error(err.response?.data?.message || "Failed to add time slot.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t("confirm_delete"))) return;
        try {
            await api.delete(`/time-slots/${id}`);
            setTimeSlots(timeSlots.filter((t_slot) => t_slot.id !== id));
            sonnerToast.success(t("delete_success"));
        } catch {
            sonnerToast.error(t("load_error"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <Input
                            placeholder={t("label_placeholder")}
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
                        {loading ? t("adding") : t("add_button")}
                    </Button>

                    <div className="border-t pt-3 max-h-[250px] overflow-y-auto">
                        {timeSlots.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm">{t("no_slots")}</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-start border-b">
                                        <th className="py-2 px-1">{t("table_label")}</th>
                                        <th className="py-2 px-1">{t("table_start")}</th>
                                        <th className="py-2 px-1">{t("table_end")}</th>
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
                                                        {t("delete")}
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
