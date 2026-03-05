"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Settings2, Clock, CalendarDays, Zap, Loader2 } from "lucide-react";

interface SystemSettings {
    weekStartDay: string;
    firstHour: string;
    lastHour: string;
    slotDuration: number;
}

export default function SystemSettingsForm() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/system-settings");
            setSettings(res.data);
        } catch (error) {
            toast.error("Erreur lors du chargement des paramètres");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        try {
            // ✅ Only send updatable fields to avoid 400 Bad Request from ValidationPipe
            const payload = {
                weekStartDay: settings.weekStartDay,
                firstHour: settings.firstHour,
                lastHour: settings.lastHour,
                slotDuration: settings.slotDuration,
            };
            await api.put("/system-settings", payload);
            toast.success("Paramètres mis à jour avec succès");
        } catch (error) {
            toast.error("Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateSlots = async () => {
        if (!settings) return;
        if (!confirm("Attention : Cela supprimera tous les créneaux horaires existants pour en générer de nouveaux. Continuer ?")) {
            return;
        }

        setGenerating(true);
        try {
            // ✅ 1. Auto-save current settings first to ensure generator uses latest values
            const payload = {
                weekStartDay: settings.weekStartDay,
                firstHour: settings.firstHour,
                lastHour: settings.lastHour,
                slotDuration: settings.slotDuration,
            };
            await api.put("/system-settings", payload);

            // ✅ 2. Trigger generation
            const res = await api.post("/time-slots/generate-dynamic");
            toast.success(`${res.data.count} créneaux horaires ont été générés !`);
            
            // ✅ 3. Refresh settings just in case
            await fetchSettings();
        } catch (error) {
            toast.error("Erreur lors de la génération des créneaux");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!settings) return null;

    return (
        <Card className="border-none shadow-[0_32px_64px_-16px_rgba(20,184,166,0.1)] bg-white/60 backdrop-blur-md rounded-[3.5rem] overflow-hidden group">
            <CardHeader className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl transition-all group-hover:bg-white/20" />
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-2xl">
                        <Settings2 className="w-8 h-8" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Configuration du Planning</CardTitle>
                        <CardDescription className="text-teal-50 font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Définissez les règles de base pour l'emploi du temps.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-12">
                <form onSubmit={handleSave} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Week Start Day */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-emerald-900">
                                <CalendarDays className="w-5 h-5" />
                                <Label className="font-black uppercase tracking-tighter italic text-sm">Début de la semaine</Label>
                            </div>
                            <Select 
                                value={settings.weekStartDay} 
                                onValueChange={(val) => setSettings({ ...settings, weekStartDay: val })}
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-emerald-500 transition-all font-bold">
                                    <SelectValue placeholder="Choisir un jour" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2 border-emerald-100 shadow-2xl">
                                    {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((day) => (
                                        <SelectItem key={day} value={day} className="font-bold py-3 focus:bg-emerald-50 focus:text-emerald-700 rounded-xl m-1 capitalize">
                                            {day.toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Slot Duration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-emerald-900">
                                <Zap className="w-5 h-5" />
                                <Label className="font-black uppercase tracking-tighter italic text-sm">Durée d'une séance (mins)</Label>
                            </div>
                            <Input 
                                type="number" 
                                value={settings.slotDuration}
                                onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) })}
                                className="h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-emerald-500 transition-all font-bold"
                            />
                        </div>

                        {/* First Hour */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-emerald-900">
                                <Clock className="w-5 h-5" />
                                <Label className="font-black uppercase tracking-tighter italic text-sm">Première Heure (Début)</Label>
                            </div>
                            <Input 
                                type="time" 
                                value={settings.firstHour}
                                onChange={(e) => setSettings({ ...settings, firstHour: e.target.value })}
                                className="h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-emerald-500 transition-all font-bold"
                            />
                        </div>

                        {/* Last Hour */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-emerald-900">
                                <Clock className="w-5 h-5" />
                                <Label className="font-black uppercase tracking-tighter italic text-sm">Dernière Heure (Fin)</Label>
                            </div>
                            <Input 
                                type="time" 
                                value={settings.lastHour}
                                onChange={(e) => setSettings({ ...settings, lastHour: e.target.value })}
                                className="h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-emerald-500 transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pt-6">
                        <Button 
                            type="submit" 
                            disabled={saving}
                            className="h-16 flex-1 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest italic shadow-xl shadow-emerald-200 transition-all active:scale-95"
                        >
                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enregistrer les paramètres"}
                        </Button>

                        <Button 
                            type="button"
                            onClick={handleGenerateSlots}
                            disabled={generating}
                            variant="outline"
                            className="h-16 flex-1 rounded-[2rem] border-2 border-teal-600 text-teal-700 hover:bg-teal-50 font-black uppercase tracking-widest italic transition-all active:scale-95"
                        >
                            {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 fill-teal-700" />
                                    <span>Générer les créneaux</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
