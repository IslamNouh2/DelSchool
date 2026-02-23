"use client";

import React, { use, useTransition, useOptimistic, useState, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/api";
import { Wallet, Loader2, Landmark } from "lucide-react";

interface ParameterData {
    isPaidSystem: boolean;
    isIndividualMode: boolean;
}

const fetchParams = async (): Promise<ParameterData> => {
    try {
        const [paidRes, subRes] = await Promise.all([
            api.get("/parameter/School_System_Paid"),
            api.get("/parameter/Subscription_Individual_Mode")
        ]);

        return {
            isPaidSystem: !!paidRes.data?.okActive,
            isIndividualMode: !!subRes.data?.okActive,
        };
    } catch (error) {
        console.error("Error fetching params:", error);
        return { isPaidSystem: false, isIndividualMode: false };
    }
};

// Use a state-managed promise if we want SSR to work with Suspense in client components
// But simpler for now: just fetch on client mount if SSR is causing flickers
export default function ParametersPage() {
    const [paramsPromise] = useState(() => typeof window !== "undefined" ? fetchParams() : new Promise<ParameterData>(() => {}));

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1 px-4">
                <h1 className="text-4xl font-black tracking-tighter uppercase text-emerald-900 italic">Configuration Financière</h1>
                <p className="text-muted-foreground font-medium text-sm">Définissez le modèle économique et les modes d'abonnement.</p>
            </div>
            
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>}>
                <ParametersForm promise={paramsPromise} />
            </Suspense>
        </div>
    );
}

function ParametersForm({ promise }: { promise: Promise<ParameterData> }) {
    const resolvedData = use(promise);
    const [data, setData] = useState<ParameterData>(resolvedData);
    const [isPending, startTransition] = useTransition();

    const [optimisticParams, setOptimisticParams] = useOptimistic(
        data,
        (state, newUpdate: Partial<ParameterData>) => ({ ...state, ...newUpdate })
    );

    const handleToggle = async (key: keyof ParameterData, value: boolean) => {
        startTransition(async () => {
            setOptimisticParams({ [key]: value });
            try {
                let paramName = "";
                if (key === "isPaidSystem") paramName = "School_System_Paid";
                else if (key === "isIndividualMode") paramName = "Subscription_Individual_Mode";

                await api.patch(`/parameter/${paramName}`, { okActive: value });
                setData(prev => ({ ...prev, [key]: value }));
                toast.success("Paramètre financier mis à jour");
            } catch (error) {
                toast.error("Erreur de synchronisation");
            }
        });
    };

    return (
        <div className="space-y-10">
            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)] bg-white/60 backdrop-blur-md rounded-[3.5rem] overflow-hidden group">
                <CardHeader className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl transition-all group-hover:bg-white/20" />
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-2xl">
                            <Landmark className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Gestion des Flux</CardTitle>
                            <CardDescription className="text-emerald-50 font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Configurez le cœur financier de l'école.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className={`flex flex-col justify-between p-8 rounded-[2.5rem] border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 ${optimisticParams.isPaidSystem ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : 'border-gray-100 bg-gray-50/30'}`}>
                            <div className="flex items-start justify-between mb-8">
                                <div className={`p-4 rounded-2xl ${optimisticParams.isPaidSystem ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <Checkbox 
                                    id="isPaid" 
                                    checked={optimisticParams.isPaidSystem} 
                                    onCheckedChange={(checked) => handleToggle("isPaidSystem", !!checked)}
                                    className="w-8 h-8 rounded-xl border-2 border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="isPaid" className="font-black text-2xl text-emerald-950 uppercase tracking-tighter italic cursor-pointer">Système Payant</Label>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-2 leading-relaxed">
                                    Activez cette option pour gérer les frais d'inscription, les mensualités et les relevés de compte.
                                </p>
                            </div>
                        </div>

                        <div className={`flex flex-col justify-between p-8 rounded-[2.5rem] border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 ${!optimisticParams.isPaidSystem ? 'opacity-40 grayscale pointer-events-none' : optimisticParams.isIndividualMode ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : 'border-gray-100 bg-gray-50/30'}`}>
                             <div className="flex items-start justify-between mb-8">
                                <div className={`p-4 rounded-2xl ${optimisticParams.isIndividualMode ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <Checkbox 
                                    id="isInd" 
                                    checked={optimisticParams.isIndividualMode} 
                                    onCheckedChange={(checked) => handleToggle("isIndividualMode", !!checked)}
                                    disabled={!optimisticParams.isPaidSystem}
                                    className="w-8 h-8 rounded-xl border-2 border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="isInd" className="font-black text-2xl text-emerald-950 uppercase tracking-tighter italic cursor-pointer">Abonnement Individuel</Label>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-2 leading-relaxed">
                                    {optimisticParams.isIndividualMode 
                                        ? "Les abonnements sont gérés spécifiquement pour chaque élève selon son cursus." 
                                        : "Les abonnements sont appliqués de manière groupée à toutes les classes."}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isPending && (
                <div className="fixed bottom-12 right-12 bg-emerald-900 text-white px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl z-50 animate-in slide-in-from-bottom-10">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Synchronisation bancaire...</span>
                </div>
            )}
        </div>
    );
}


