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
import { Plus, User, Loader2 } from "lucide-react";
import { FeeTemplate, StudentWithFinance } from "./types";

interface FeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: FeeTemplate[];
    students: StudentWithFinance[];
    initialStudent?: StudentWithFinance | null;
    onConfirm: (data: any) => Promise<void>;
}

export function FeeModal({ open, onOpenChange, templates, students, initialStudent, onConfirm }: FeeModalProps) {
    const [studentId, setStudentId] = React.useState<string>("");
    const [templateId, setTemplateId] = React.useState<string>("");
    const [dueDate, setDueDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const [dateStart, setDateStart] = React.useState<string>("");
    const [dateEnd, setDateEnd] = React.useState<string>("");
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (initialStudent) {
            setStudentId(String(initialStudent.studentId));
        }
    }, [initialStudent]);

    const selectedTemplate = templates.find(t => String(t.id) === templateId);

    React.useEffect(() => {
        if (selectedTemplate) {
            if (selectedTemplate.dateStartConsommation) {
                setDateStart(selectedTemplate.dateStartConsommation.split('T')[0]);
            }
            if (selectedTemplate.dateEndConsommation) {
                setDateEnd(selectedTemplate.dateEndConsommation.split('T')[0]);
            }
        }
    }, [selectedTemplate]);

    const handleSubmit = async () => {
        if (!studentId || !templateId) return;
        setLoading(true);
        try {
            const template = templates.find(t => String(t.id) === templateId);
            await onConfirm({
                studentId: parseInt(studentId),
                title: template?.title,
                amount: template?.amount,
                dueDate,
                compteId: template?.compteId,
                dateStartConsommation: dateStart || null,
                dateEndConsommation: dateEnd || null,
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <DialogHeader className="space-y-4 text-center items-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                        <Plus size={32} />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-gray-100">
                            Nouveau Frais
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                            Assigner une charge individuelle à un élève
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Élève Cible</Label>
                            <Select value={studentId} onValueChange={setStudentId}>
                                <SelectTrigger className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200">
                                    <SelectValue placeholder="Choisir un élève..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl max-h-60 dark:bg-slate-900 dark:text-gray-200">
                                    {students.map(s => (
                                        <SelectItem key={s.studentId} value={String(s.studentId)} className="font-bold py-3 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20">
                                            {s.lastName} {s.firstName} <span className="text-gray-400 dark:text-slate-500 ml-2 font-black text-[9px] uppercase tracking-tighter">({s.code})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Prestation (Modèle)</Label>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200">
                                    <SelectValue placeholder="Choisir un modèle..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 shadow-2xl dark:bg-slate-900 dark:text-gray-200">
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)} className="font-bold py-3 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20">
                                            {t.title} <span className="text-blue-600 dark:text-blue-400 ml-2">({t.amount.toLocaleString()} DA)</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Début de Service</Label>
                                <Input 
                                    type="date" 
                                    value={dateStart} 
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Fin de Service</Label>
                                <Input 
                                    type="date" 
                                    value={dateEnd} 
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Montant Estimé</Label>
                                <div className="h-12 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center px-4 font-black text-gray-900 dark:text-gray-100 shadow-inner transition-colors">
                                    {selectedTemplate ? selectedTemplate.amount.toLocaleString() : "0"} <span className="text-[10px] ml-1 text-gray-400 dark:text-slate-500">DA</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Échéance</Label>
                                <Input 
                                    type="date" 
                                    value={dueDate} 
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-950/50 dark:text-gray-200 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSubmit}
                        disabled={loading || !studentId || !templateId}
                        className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white rounded-2xl h-14 font-black shadow-xl shadow-gray-900/10 dark:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            "Confirmer l'Engagement"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
