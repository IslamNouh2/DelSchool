import { use, useState, useTransition, useMemo } from "react";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Landmark, Wallet, Receipt, CreditCard, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompteFormProps {
    type: "create" | "update";
    data?: any;
    setOpen: (open: boolean) => void;
    onSuccess: (newItem: any) => void;
    promises: {
        parents: Promise<any>;
        employers: Promise<any>;
        students: Promise<any>;
    };
}

const CATEGORIES = [
    { id: "GENERAL", label: "Général", icon: Layers },
    { id: "CAISSE", label: "Caisse", icon: Wallet },
    { id: "BANQUE", label: "Banque", icon: Landmark },
    { id: "RECETTE", label: "Recette", icon: Receipt },
    { id: "DEPENSE", label: "Dépense", icon: CreditCard },
];

const NATURES = [
    { id: "ASSET", label: "Actif" },
    { id: "LIABILITY", label: "Passif" },
    { id: "EQUITY", label: "Capitaux" },
    { id: "INCOME", label: "Produits" },
    { id: "EXPENSE", label: "Charges" },
];

export default function CompteForm({ type, data, setOpen, onSuccess, promises }: CompteFormProps) {
    const resolvedParents = use(promises.parents).comptes || [];
    const resolvedEmployers = use(promises.employers).employers || [];
    const resolvedStudents = use(promises.students).students || [];

    const [isPending, startTransition] = useTransition();
    const t = useTranslations("finance.accounts");
    
    const [form, setForm] = useState({
        code: data?.code || "",
        name: data?.name || "",
        nameAr: data?.nameAr || "",
        parentId: data?.parentId ? String(data.parentId) : "-1",
        nature: data?.nature || "ASSET",
        category: data?.category || "GENERAL",
        isFeeCash: data?.isFeeCash || false,
        showInParent: data?.showInParent ?? true,
        selectionCode: data?.selectionCode || "none",
        employerId: data?.employerId ? String(data.employerId) : "none",
        studentId: data?.studentId ? String(data.studentId) : "none",
    });



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                const payload = {
                    ...form,
                    parentId: parseInt(form.parentId),
                    code: form.code || null, // Send null if empty to avoid unique constraint issues
                    selectionCode: form.selectionCode !== "none" ? form.selectionCode : null,
                    employerId: form.employerId !== "none" ? parseInt(form.employerId) : null,
                    studentId: form.studentId !== "none" ? parseInt(form.studentId) : null,
                };

                let response;
                if (type === "create") {
                    response = await api.patch(`/compte/${data.id}`, payload);
                    toast.success(t("messages.update_success"));
                }
                
                onSuccess(response.data);
                setOpen(false);
            } catch (error) {
                toast.error(t("messages.save_error"));
            }
        });
    };

    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden animate-in zoom-in duration-300 dark:bg-slate-900 bg-white">
                <div className="bg-blue-600 p-8 text-white relative">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <DialogTitle className="font-[1000] text-3xl uppercase tracking-tighter">
                                {type === "create" ? t("form.add_title") : t("form.edit_title")}
                            </DialogTitle>
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mt-1 opacity-70">
                                {t("form.subtitle")}
                            </p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <Layers className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Nature du Compte (Accounting Logic) */}
                        <div className="md:col-span-2 p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30">
                            <Label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-4 block ml-1 text-center">{t("form.nature_label")}</Label>
                            <RadioGroup 
                                value={form.nature} 
                                onValueChange={(v) => setForm(prev => ({ ...prev, nature: v }))}
                                className="grid grid-cols-2 md:grid-cols-5 gap-3"
                            >
                                {NATURES.map((nat) => (
                                    <div key={nat.id} className="relative">
                                        <RadioGroupItem value={nat.id} id={`nat-${nat.id}`} className="peer sr-only" />
                                        <Label 
                                            htmlFor={`nat-${nat.id}`}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-transparent bg-white dark:bg-slate-900 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-900/20 cursor-pointer transition-all shadow-sm"
                                        >
                                            <span className="text-[10px] font-[1000] uppercase tracking-tighter peer-data-[state=checked]:text-blue-700 dark:peer-data-[state=checked]:text-blue-400">{t(`natures.${nat.id.toLowerCase()}` as any)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Classification UI (Visual) */}
                        <div className="md:col-span-2 p-6 bg-gray-50 dark:bg-slate-950/50 rounded-[2rem] border border-gray-100 dark:border-slate-800">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest mb-4 block ml-1 text-center">{t("form.classification_label")}</Label>
                            <RadioGroup 
                                value={form.category} 
                                onValueChange={(v) => {
                                    let autoNature = form.nature;
                                    if (v === "CAISSE" || v === "BANQUE") autoNature = "ASSET";
                                    if (v === "RECETTE") autoNature = "INCOME";
                                    if (v === "DEPENSE") autoNature = "EXPENSE";
                                    setForm(prev => ({ ...prev, category: v, nature: autoNature }));
                                }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
                            >
                                {CATEGORIES.map((cat) => (
                                    <div key={cat.id} className="relative">
                                        <RadioGroupItem value={cat.id} id={cat.id} className="peer sr-only" />
                                        <Label 
                                            htmlFor={cat.id}
                                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent bg-white dark:bg-slate-900 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-900/20 cursor-pointer transition-all hover:scale-105 shadow-sm"
                                        >
                                            <cat.icon className="w-5 h-5 text-gray-400 peer-data-[state=checked]:text-blue-600 transition-colors" />
                                            <span className="text-[8px] font-black uppercase tracking-tighter peer-data-[state=checked]:text-blue-700 dark:peer-data-[state=checked]:text-blue-400">{t(`categories.${cat.id.toLowerCase()}` as any)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                    {/* Information de base (Toujours visible) */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">{t("form.code")} *</Label>
                            <Input 
                                value={form.code} 
                                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                                className="rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-bold bg-orange-50/50 dark:bg-orange-900/10 dark:text-orange-400 text-orange-700"
                                placeholder={t("form.placeholder_code")}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">{t("form.designation")} *</Label>
                            <Input 
                                value={form.name} 
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                className="rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-bold bg-gray-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 transition-all dark:text-gray-200"
                                placeholder={t("form.placeholder_name")}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">{t("form.parent_account")} :</Label>
                            <Select value={form.parentId} onValueChange={(v) => setForm(prev => ({ ...prev, parentId: v }))}>
                                <SelectTrigger className="rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-bold bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400">
                                    <SelectValue placeholder={t("form.all_accounts")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl dark:bg-slate-800">
                                    <SelectItem value="-1" className="font-bold">{t("form.all_accounts")}</SelectItem>
                                    {resolvedParents
                                        .filter((p: any) => p.showInParent)
                                        .map((p: any) => (
                                        <SelectItem key={p.id} value={String(p.id)} className="font-bold">{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">{t("form.designation_ar")}</Label>
                            <Input 
                                value={form.nameAr} 
                                dir="rtl"
                                onChange={(e) => setForm(prev => ({ ...prev, nameAr: e.target.value }))}
                                className="rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-bold bg-gray-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 transition-all text-right dark:text-gray-200"
                                placeholder={t("form.placeholder_name_ar")}
                            />
                        </div>



                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">{t("form.selection_code")}</Label>
                            <Select value={form.selectionCode} onValueChange={(v) => setForm(prev => ({ ...prev, selectionCode: v }))}>
                                <SelectTrigger className="rounded-2xl border-gray-100 dark:border-slate-800 h-14 font-bold bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400">
                                    <SelectValue placeholder={t("form.placeholder_selection")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl dark:bg-slate-800">
                                    <SelectItem value="none" className="font-bold">— {t("form.none")} —</SelectItem>
                                    <SelectItem value="SC01" className="font-bold text-xs">SÉLECTION 01</SelectItem>
                                    <SelectItem value="SC02" className="font-bold text-xs">SÉLECTION 02</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-gray-50 dark:bg-slate-950/30 rounded-[2rem] border border-gray-100 dark:border-slate-800">
                        <FlagCheckbox id="isFeeCash" label={t("form.flags.fee_cash")} checked={form.isFeeCash} onChange={(v) => setForm(p => ({...p, isFeeCash: v}))} />
                        <FlagCheckbox id="showInParent" label={t("form.flags.show_parent")} checked={form.showInParent} onChange={(v) => setForm(p => ({...p, showInParent: v}))} />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                        <Button 
                            type="submit" 
                            disabled={isPending}
                            className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-white"
                        >
                            {isPending ? <Loader2 className="animate-spin" /> : t("form.validate")}
                        </Button>
                        <Button 
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all active:scale-95 text-white"
                        >
                            {t("form.cancel")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FlagCheckbox({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center space-x-2">
            <Checkbox 
                id={id} 
                checked={checked} 
                onCheckedChange={(v) => onChange(!!v)}
                className="rounded-lg border-gray-300 dark:border-slate-700 data-[state=checked]:bg-blue-600 w-5 h-5 transition-all"
            />
            <Label htmlFor={id} className="text-[9px] font-black uppercase text-gray-500 dark:text-slate-400 cursor-pointer tracking-tighter">{label}</Label>
        </div>
    );
}
