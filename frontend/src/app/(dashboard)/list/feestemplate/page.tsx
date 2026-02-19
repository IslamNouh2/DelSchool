"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Wallet, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FeeTemplate {
    id: number;
    title: string;
    amount: number;
    dueDate: string;
    description: string | null;
    compteId: number | null;
    dateStartConsommation: string | null;
    dateEndConsommation: string | null;
}

interface Account {
    id: number;
    name: string;
    category: string;
}

export default function FeeTemplatesPage() {
    const [templates, setTemplates] = useState<FeeTemplate[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        dueDate: new Date().toISOString().split('T')[0],
        description: "",
        compteId: "",
        dateStartConsommation: "",
        dateEndConsommation: "",
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get("/fees/templates");
            setTemplates(res.data);
        } catch (error) {
            toast.error("Échec du chargement des modèles");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get("/compte?limit=100");
            setAccounts(res.data.comptes);
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        }
    };

    useEffect(() => {
        fetchTemplates();
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/fees/templates", {
                ...formData,
                amount: parseFloat(formData.amount),
                compteId: formData.compteId ? parseInt(formData.compteId) : null,
                dateStartConsommation: formData.dateStartConsommation || null,
                dateEndConsommation: formData.dateEndConsommation || null,
            });
            toast.success("Modèle de frais créé");
            setOpen(false);
            setFormData({
                title: "",
                amount: "",
                dueDate: new Date().toISOString().split('T')[0],
                description: "",
                compteId: "",
                dateStartConsommation: "",
                dateEndConsommation: "",
            });
            fetchTemplates();
        } catch (error) {
            toast.error("Échec de la création");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Voulez-vous supprimer ce modèle ?")) return;
        try {
            await api.delete(`/fees/${id}`);
            toast.success("Modèle supprimé");
            fetchTemplates();
        } catch (error) {
            toast.error("Échec de la suppression");
        }
    };

    const filteredTemplates = templates.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-8 space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-900 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-[-5deg] hover:rotate-0 transition-transform cursor-pointer">
                            <Wallet size={24} />
                        </div>
                        <h1 className="text-4xl font-[1000] tracking-tighter text-gray-900 dark:text-gray-100 uppercase">
                            Modèles de <span className="text-blue-600 dark:text-blue-400">Frais</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        Bibliothèque des prestations scolaires standards
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-800" />
                        Abonnements & Paramétrage
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl h-12 px-8 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-gray-900/10 dark:shadow-blue-900/30 active:scale-95 transition-all border-none">
                            <Plus size={18} />
                            Nouveau Modèle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <div className="p-10 pb-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Wallet size={100} />
                            </div>
                            <DialogHeader className="text-left relative z-10">
                                <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white">
                                    Créer un Modèle
                                </DialogTitle>
                                <DialogDescription className="text-blue-100 font-bold text-xs uppercase tracking-widest mt-1 opacity-80">
                                    Définir une prestation récurrente
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 pt-6 space-y-6 custom-scrollbar max-h-[70vh] overflow-y-auto dark:bg-slate-950/20">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Libellé du Frais</Label>
                                    <Input 
                                        required
                                        placeholder="Ex: Scolarité Mensuelle, Transport..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Montant (DA)</Label>
                                        <Input 
                                            required
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Échéance par défaut</Label>
                                        <Input 
                                            required
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Début Consommation</Label>
                                        <Input 
                                            type="date"
                                            value={formData.dateStartConsommation}
                                            onChange={e => setFormData({ ...formData, dateStartConsommation: e.target.value })}
                                            className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Fin Consommation</Label>
                                        <Input 
                                            type="date"
                                            value={formData.dateEndConsommation}
                                            onChange={e => setFormData({ ...formData, dateEndConsommation: e.target.value })}
                                            className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Compte Produit (Recette)</Label>
                                    <Select 
                                        value={formData.compteId} 
                                        onValueChange={v => setFormData({ ...formData, compteId: v })}
                                    >
                                        <SelectTrigger className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors">
                                            <SelectValue placeholder="Choisir un compte comptable..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-200">
                                            {accounts
                                                .filter(acc => acc.category === 'RECETTE')
                                                .map(acc => (
                                                <SelectItem key={acc.id} value={String(acc.id)} className="font-bold py-3 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20">
                                                    {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Description (Optionnel)</Label>
                                    <Input 
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="rounded-xl border-gray-100 dark:border-slate-800 h-12 font-bold shadow-sm bg-gray-50/50 dark:bg-slate-900 dark:text-gray-200 transition-colors"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white rounded-2xl h-16 font-black shadow-xl shadow-blue-600/20 dark:shadow-blue-900/30 transition-all active:scale-95 border-none">
                                Enregistrer le Modèle
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] overflow-hidden transition-colors">
                <CardHeader className="p-10 border-b border-gray-100 dark:border-slate-800">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                            placeholder="Rechercher un modèle..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-14 rounded-2xl bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 h-14 text-sm font-bold shadow-inner group-focus-within:border-blue-200 dark:group-focus-within:border-blue-900/50 transition-all dark:text-gray-200" 
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-slate-950/40 text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-10 py-6">Prestation</th>
                                    <th className="px-10 py-6">Montant</th>
                                    <th className="px-10 py-6 text-center">Dates de Service</th>
                                    <th className="px-10 py-6">Échéance</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-10 bg-gray-50/20 dark:bg-slate-900/20" />
                                        </tr>
                                    ))
                                ) : filteredTemplates.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center bg-gray-50/20 dark:bg-slate-900/10">
                                            <div className="flex flex-col items-center gap-4 text-gray-300 dark:text-slate-700">
                                                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm flex items-center justify-center">
                                                    <Info size={40} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Aucun modèle trouvé</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTemplates.map((t) => (
                                        <tr key={t.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                        <Wallet size={20} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">{t.title}</span>
                                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tighter mt-1 italic">
                                                            {t.description || "Aucune description"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 font-black text-sm">
                                                    {t.amount?.toLocaleString()} <span className="text-[10px] ml-1 opacity-70">DA</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {t.dateStartConsommation && t.dateEndConsommation ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400">
                                                            <span>{format(new Date(t.dateStartConsommation), 'dd MMM', { locale: fr })}</span>
                                                            <div className="w-4 h-[1px] bg-blue-200 dark:bg-blue-900" />
                                                            <span>{format(new Date(t.dateEndConsommation), 'dd MMM', { locale: fr })}</span>
                                                        </div>
                                                        <span className="text-[9px] text-gray-400 dark:text-slate-600 font-bold uppercase tracking-widest italic">Période de service</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-gray-300 dark:text-slate-700 uppercase tracking-widest italic">— Non défini —</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                                    <Calendar size={14} className="text-gray-300 dark:text-slate-600" />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                                        {format(new Date(t.dueDate), 'PPP', { locale: fr })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95">
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 text-gray-400 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95"
                                                        onClick={() => handleDelete(t.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
