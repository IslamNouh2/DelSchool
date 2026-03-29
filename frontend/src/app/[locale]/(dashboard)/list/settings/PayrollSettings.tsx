"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Save, Clock, Calculator, Percent } from "lucide-react";

export default function PayrollSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        Attendance_Late_Threshold: "08:10",
        Payroll_Monthly_Days: "30",
        Payroll_Late_Penalty_Ratio: "3",
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [threshold, days, ratio] = await Promise.all([
                api.get("/parameter/Attendance_Late_Threshold").catch(() => ({ data: null })),
                api.get("/parameter/Payroll_Monthly_Days").catch(() => ({ data: null })),
                api.get("/parameter/Payroll_Late_Penalty_Ratio").catch(() => ({ data: null })),
            ]);

            setSettings({
                Attendance_Late_Threshold: threshold.data?.paramValue || "08:10",
                Payroll_Monthly_Days: days.data?.paramValue || "30",
                Payroll_Late_Penalty_Ratio: ratio.data?.paramValue || "3",
            });
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all(
                Object.entries(settings).map(([key, value]) =>
                    api.patch(`/parameter/${key}`, { paramValue: value }).catch(async () => {
                        // If doesn't exist, create it
                        await api.post("/parameter", { paramName: key, paramValue: value });
                    })
                )
            );
            toast.success("Paramètres mis à jour avec succès");
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-10">
                    <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Paramètres de Paie &amp; Présence</CardTitle>
                    <CardDescription className="text-emerald-100 font-medium uppercase text-xs tracking-widest mt-2">Configurez les règles métier pour les calculs de salaire.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Late Threshold */}
                        <div className="space-y-4 p-6 rounded-[2rem] bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                <Label className="text-lg font-black uppercase text-amber-900 dark:text-amber-300 tracking-tighter italic">Seuil de Retard</Label>
                            </div>
                            <Input
                                type="time"
                                value={settings.Attendance_Late_Threshold}
                                onChange={(e) => setSettings({ ...settings, Attendance_Late_Threshold: e.target.value })}
                                className="h-14 rounded-2xl border-amber-200 dark:border-amber-800/50 bg-white dark:bg-gray-900 font-black text-lg focus:ring-amber-500 shadow-sm"
                            />
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest px-2">
                                Les arrivées après cette heure sont marquées comme &quot;En Retard&quot;.
                            </p>
                        </div>

                        {/* Monthly Days */}
                        <div className="space-y-4 p-6 rounded-[2rem] bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                            <div className="flex items-center gap-3 mb-2">
                                <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <Label className="text-lg font-black uppercase text-blue-900 dark:text-blue-300 tracking-tighter italic">Base de Jours (Mensuel)</Label>
                            </div>
                            <Input
                                type="number"
                                value={settings.Payroll_Monthly_Days}
                                onChange={(e) => setSettings({ ...settings, Payroll_Monthly_Days: e.target.value })}
                                className="h-14 rounded-2xl border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 font-black text-lg focus:ring-blue-500 shadow-sm"
                            />
                            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest px-2">
                                Diviseur utilisé pour calculer le taux journalier (Salaire / X).
                            </p>
                        </div>

                        {/* Penalty Ratio */}
                        <div className="space-y-4 p-6 rounded-[2rem] bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 md:col-span-2">
                            <div className="flex items-center gap-3 mb-2">
                                <Percent className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                <Label className="text-lg font-black uppercase text-rose-900 dark:text-rose-300 tracking-tighter italic">Ratio de Pénalité Retard</Label>
                            </div>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={settings.Payroll_Late_Penalty_Ratio}
                                    onChange={(e) => setSettings({ ...settings, Payroll_Late_Penalty_Ratio: e.target.value })}
                                    className="h-14 w-32 rounded-2xl border-rose-200 dark:border-rose-800/50 bg-white dark:bg-gray-900 font-black text-lg focus:ring-rose-500 shadow-sm"
                                />
                                <div className="text-sm font-black text-rose-800 dark:text-rose-300 uppercase tracking-tighter italic">
                                    {settings.Payroll_Late_Penalty_Ratio} Retards = 1 Jour de Déduction
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest px-2">
                                Définit combien de retards accumulés correspondent à une journée d&apos;absence.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-16 rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-lg shadow-2xl shadow-emerald-500/30 uppercase tracking-[0.2em] transition-all hover:-translate-y-1 active:scale-[0.98]"
                    >
                        {saving ? <Loader2 className="w-7 h-7 animate-spin" /> : <><Save className="w-7 h-7 mr-4" /> Enregistrer les Paramètres</>}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
