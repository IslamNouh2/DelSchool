"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface FeeSubscriptionFormProps {
    student: any;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
}

export default function FeeSubscriptionForm({ student, setOpen, onSuccess }: FeeSubscriptionFormProps) {
    const t = useTranslations("finance.studentFees.modals.new_fee");
    const commonT = useTranslations("finance.studentFees.messages");

    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        templateId: "",
        dueDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get("/fee-templates"); // Assuming this exists or using general fees
                setTemplates(res.data || []);
            } catch (error) {
                console.error("Error fetching templates:", error);
                // Fallback: try fetching general fees to use as templates
                try {
                    const res = await api.get("/fees?limit=50");
                    setTemplates(res.data.fees || []);
                } catch (e) {
                    toast.error(commonT("load_error"));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.templateId) return toast.error(commonT("select_fee_error"));

        const selectedTemplate = templates.find(t => String(t.id) === formData.templateId);
        if (!selectedTemplate) return;

        try {
            await api.post("/fees", {
                title: selectedTemplate.title,
                amount: selectedTemplate.amount,
                dueDate: new Date(formData.dueDate).toISOString(),
                studentId: student.studentId,
                compteId: selectedTemplate.compteId,
                type: "income",
            });
            toast.success(commonT("bulk_success"));
            onSuccess();
            setOpen(false);
        } catch (error) {
            toast.error(commonT("bulk_error"));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>{t("labels.template")}</Label>
                <Select value={formData.templateId} onValueChange={(v) => setFormData({ ...formData, templateId: v })}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t("placeholders.template")} />
                    </SelectTrigger>
                    <SelectContent>
                        {templates.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                                {t.title} ({t.amount} DA)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>{t("labels.due_date")}</Label>
                <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="rounded-xl"
                />
            </div>
            <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold mt-2"
                disabled={loading}
            >
                {t("submit_subscription")}
            </Button>
        </form>
    );
}
