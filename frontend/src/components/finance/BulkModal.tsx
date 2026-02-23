"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { FeeTemplate } from "./types";

interface BulkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: FeeTemplate[];
    onConfirm: (data: { templateId: number, dueDate: string }) => Promise<void>;
}

export function BulkModal({ open, onOpenChange, templates, onConfirm }: BulkModalProps) {
    const t = useTranslations("finance.studentFees.modals.bulk");
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const [templateId, setTemplateId] = React.useState<string>("");
    const [dueDate, setDueDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async () => {
        if (!templateId) return;
        setLoading(true);
        try {
            await onConfirm({ templateId: parseInt(templateId), dueDate });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <DialogHeader className="space-y-4 text-left">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                        <CreditCard size={32} />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className={cn("text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-gray-100", isRtl && "text-right")}>
                            {t("title")}
                        </DialogTitle>
                        <DialogDescription className={cn("text-sm font-medium text-gray-500 dark:text-slate-500 uppercase tracking-widest/50", isRtl && "text-right")}>
                            {t("description")}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <Alert className={cn("bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 rounded-2xl", isRtl && "text-right")}>
                        <AlertTriangle className={cn("h-5 w-5 text-amber-600 dark:text-amber-400", isRtl ? "ml-2" : "mr-2")} />
                        <AlertTitle className="text-amber-800 dark:text-amber-200 font-bold uppercase text-[10px] tracking-widest">{t("alert_title")}</AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-400/80 text-xs font-medium leading-relaxed">
                            {t("alert_desc")}
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1", isRtl && "text-right block")}>{t("template")}</Label>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className={cn("rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200", isRtl && "flex-row-reverse")}>
                                    <SelectValue placeholder={t("placeholder_template")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900 dark:text-gray-200">
                                    {templates.map(t_item => (
                                        <SelectItem key={t_item.id} value={String(t_item.id)} className={cn("font-bold py-3 rounded-xl focus:bg-amber-50 dark:focus:bg-amber-900/20", isRtl && "flex-row-reverse text-right")}>
                                            {t_item.title} <span className={cn("text-blue-600 dark:text-blue-400", isRtl ? "mr-2" : "ml-2")}>({t_item.amount.toLocaleString()} DA)</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1", isRtl && "text-right block")}>{t("due_date")}</Label>
                            <Input 
                                type="date" 
                                value={dueDate} 
                                onChange={(e) => setDueDate(e.target.value)}
                                className={cn("rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200", isRtl && "text-right")}
                            />
                        </div>
                    </div>

                    <Button 
                        onClick={handleSubmit}
                        disabled={loading || !templateId}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-2xl h-14 font-black shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            t("confirm")
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
