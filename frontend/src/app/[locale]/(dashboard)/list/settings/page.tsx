"use client";

import React, { useState, useEffect, useCallback, useMemo, useTransition, useOptimistic, use, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import api from "@/lib/api";
import { Plus, Trash2, Save, Loader2, GraduationCap } from "lucide-react";
import { useSocket } from "@/providers/SocketProvider";
import TransitionDialog from "@/components/TransitionDialog";
import PayrollSettings from "./PayrollSettings";

interface SchoolYear {
  id: number;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface ParameterData {
    transitionMode: "auto" | "manual";
}

const fetchTransitionParams = async (): Promise<ParameterData> => {
    try {
        const res = await api.get("/parameter/Transition_Mode");
        return {
            transitionMode: res.data?.okActive ? "auto" : "manual",
        };
    } catch (error) {
        console.error("Error fetching transition params:", error);
        return { transitionMode: "manual" };
    }
};

export default function SettingsPage() {
  const [transPromise] = useState(() => typeof window !== "undefined" ? fetchTransitionParams() : new Promise<ParameterData>(() => {}));
  const [activeTab, setActiveTab] = useState("school-year");
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { refreshKey } = useSocket();

  const [newYear, setNewYear] = useState({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    semesters: [
      { name: "الفصل الأول", startDate: "", endDate: "" },
      { name: "الفصل الثاني", startDate: "", endDate: "" },
    ] as { name: string; startDate: string; endDate: string }[],
  });

  useEffect(() => {
    fetchSchoolYears();
  }, [refreshKey]);

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get("/school-year");
      setSchoolYears(response.data);
    } catch (error) {
      console.error("Error fetching school years:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
        try {
            await api.post("/school-year", newYear);
            toast.success("Année scolaire ajoutée");
            setNewYear({ 
              year: "", 
              startDate: "", 
              endDate: "", 
              isCurrent: false,
              semesters: [
                { name: "الفصل الأول", startDate: "", endDate: "" },
                { name: "الفصل الثاني", startDate: "", endDate: "" },
              ]
            });
            fetchSchoolYears();
        } catch (error) {
            toast.error("Échec de l'ajout");
        }
    });
  };

  const handleDeleteYear = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette année ?")) return;
    startTransition(async () => {
        try {
            await api.delete(`/school-year/${id}`);
            toast.success("Année scolaire supprimée");
            fetchSchoolYears();
        } catch (error) {
            toast.error("Échec de la suppression");
        }
    });
  };

  const addSemesterField = () => {
    setNewYear({
      ...newYear,
      semesters: [...newYear.semesters, { name: "", startDate: "", endDate: "" }]
    });
  };

  const removeSemesterField = (index: number) => {
    const semesters = [...newYear.semesters];
    semesters.splice(index, 1);
    setNewYear({ ...newYear, semesters });
  };

  const updateSemester = (index: number, field: string, value: string) => {
    const semesters = [...newYear.semesters];
    semesters[index] = { ...semesters[index], [field]: value };
    setNewYear({ ...newYear, semesters });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight uppercase text-blue-900 dark:text-blue-300 italic">Configuration de l&apos;Établissement</h1>
        <p className="text-muted-foreground font-medium text-sm">Gérez la chronologie académique et les paramètres globaux.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-10 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-700 p-1 shadow-sm">
          <TabsTrigger value="school-year" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">Années Scolaires</TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">Paie &amp; Présence</TabsTrigger>
          <TabsTrigger value="transition" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">Transition Annuelle</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-6">
            <PayrollSettings />
        </TabsContent>

        <TabsContent value="school-year" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 border-none shadow-2xl rounded-[2.5rem] bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="font-black text-xl uppercase tracking-tighter text-blue-900 dark:text-blue-300 italic">Nouvelle Année</CardTitle>
                <CardDescription className="font-medium text-[10px] uppercase">Ajouter une période académique.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <form onSubmit={handleAddYear} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="year" className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Désignation (ex: 2024-2025)</Label>
                    <Input
                      id="year"
                      placeholder="2024-2025"
                      value={newYear.year}
                      onChange={(e) => setNewYear({ ...newYear, year: e.target.value })}
                      required
                      className="rounded-2xl border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 h-12 font-bold focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Date de Début</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newYear.startDate}
                          onChange={(e) => setNewYear({ ...newYear, startDate: e.target.value })}
                          required
                          className="rounded-2xl border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 h-12 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="font-black text-[10px] uppercase text-muted-foreground tracking-widest">Date de Fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newYear.endDate}
                          onChange={(e) => setNewYear({ ...newYear, endDate: e.target.value })}
                          required
                          className="rounded-2xl border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 h-12 font-bold"
                        />
                      </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <Label className="font-black text-[10px] uppercase text-blue-900 dark:text-blue-300 tracking-widest italic">Semestres / الفصول</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addSemesterField} className="h-8 rounded-lg text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                        <Plus className="w-3 h-3 mr-1" /> Ajouter
                      </Button>
                    </div>
                    {newYear.semesters.map((sem, idx) => (
                      <div key={idx} className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 relative group/sem">
                        <div className="flex gap-4 items-end">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Nom du semestre"
                              value={sem.name}
                              onChange={(e) => updateSemester(idx, "name", e.target.value)}
                              required
                              className="h-10 text-xs font-bold rounded-xl border-none bg-white dark:bg-gray-900 shadow-sm"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeSemesterField(idx)} 
                            className="h-10 w-10 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl opacity-0 group-hover/sem:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="date"
                            value={sem.startDate}
                            onChange={(e) => updateSemester(idx, "startDate", e.target.value)}
                            required
                            className="h-10 text-[10px] font-bold rounded-xl border-none bg-white dark:bg-gray-900 shadow-sm"
                          />
                          <Input
                            type="date"
                            value={sem.endDate}
                            onChange={(e) => updateSemester(idx, "endDate", e.target.value)}
                            required
                            className="h-10 text-[10px] font-bold rounded-xl border-none bg-white dark:bg-gray-900 shadow-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/50 transition-all hover:bg-blue-100/50 dark:hover:bg-blue-900/30">
                    <Checkbox
                      id="isCurrent"
                      checked={newYear.isCurrent}
                      onCheckedChange={(checked) => setNewYear({ ...newYear, isCurrent: !!checked })}
                      className="w-5 h-5 rounded-lg border-2 border-blue-600 data-[state=checked]:bg-blue-600"
                    />
                    <Label htmlFor="isCurrent" className="font-black text-[10px] uppercase cursor-pointer text-blue-900 dark:text-blue-300 tracking-wider">Définir comme année en cours</Label>
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black shadow-xl shadow-blue-500/20 uppercase text-xs tracking-widest active:scale-[0.98]" disabled={isPending}>
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-3" /> Ajouter</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-white/50 dark:bg-gray-900/50 backdrop-blur-md overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="font-black text-xl uppercase tracking-tighter text-blue-900 dark:text-blue-300 italic">Chronologie Académique</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Liste des années scolaires enregistrées.</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">Année Scolaire</th>
                      <th className="px-8 py-5">Période</th>
                      <th className="px-8 py-5">Statut</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {schoolYears.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <p className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-600 tracking-widest">Aucune année définie</p>
                        </td>
                      </tr>
                    ) : (
                      schoolYears.map((sy) => (
                        <tr key={sy.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors group">
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-gray-900 dark:text-gray-100">{sy.year}</span>
                          </td>
                          <td className="px-8 py-6 font-bold text-xs text-muted-foreground uppercase">
                            {new Date(sy.startDate).toLocaleDateString()} — {new Date(sy.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-6">
                            {sy.isCurrent ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest animate-pulse">En Cours</span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-widest">Archivée</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteYear(sy.id)}
                              className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                              disabled={isPending}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transition" className="space-y-6">
         <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
                <TransitionForm promise={transPromise} />
         </Suspense>
        </TabsContent>
      </Tabs>

      {isPending && (
          <div className="fixed bottom-12 right-12 bg-gray-900 border border-white/10 px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl z-50 animate-in slide-in-from-bottom-10">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Mise à jour système...</span>
          </div>
      )}
    </div>
  );
}

function TransitionForm({ promise }: { promise: Promise<ParameterData> }) {
    const resolvedData = use(promise);
    const [data, setData] = useState<ParameterData>(resolvedData);
    const [isPending, startTransition] = useTransition();
    const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);

    const [optimisticParams, setOptimisticParams] = useOptimistic(
        data,
        (state, newUpdate: Partial<ParameterData>) => ({ ...state, ...newUpdate })
    );

    const handleToggle = async (key: keyof ParameterData, value: any) => {
        startTransition(async () => {
            setOptimisticParams({ [key]: value });
            try {
                const paramName = "Transition_Mode";
                const okActive = value === "auto";
                await api.patch(`/parameter/${paramName}`, { okActive });
                setData(prev => ({ ...prev, [key]: value }));
                toast.success("Mode de transition mis à jour");
            } catch (error) {
                toast.error("Erreur lors de la mise à jour");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5">
            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(37,99,235,0.1)] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-[3rem] overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
                    <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">Configuration Transition</CardTitle>
                    <CardDescription className="text-blue-100 font-medium uppercase text-xs tracking-widest mt-2">Gérez le passage entre les années scolaires.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                    <div className="space-y-6">
                        <Label className="text-xl font-black uppercase text-blue-900 dark:text-blue-300 tracking-tighter italic">Mode de transition des élèves</Label>
                        <RadioGroup
                            value={optimisticParams.transitionMode}
                            onValueChange={(val) => handleToggle("transitionMode", val)}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className={`flex items-center space-x-4 border-2 p-8 rounded-[2.5rem] cursor-pointer transition-all hover:shadow-xl ${optimisticParams.transitionMode === 'auto' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/10 scale-[1.02]' : 'border-gray-100 dark:border-gray-700 grayscale hover:grayscale-0'}`}>
                                <RadioGroupItem value="auto" id="auto" className="border-blue-600 w-5 h-5" />
                                <Label htmlFor="auto" className="cursor-pointer font-black block leading-tight">
                                    <span className="text-lg block mb-1 uppercase tracking-tighter italic">Distribution Automatique</span>
                                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-widest">Le système équilibre les classes</span>
                                </Label>
                            </div>
                            <div className={`flex items-center space-x-4 border-2 p-8 rounded-[2.5rem] cursor-pointer transition-all hover:shadow-xl ${optimisticParams.transitionMode === 'manual' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/10 scale-[1.02]' : 'border-gray-100 dark:border-gray-700 grayscale hover:grayscale-0'}`}>
                                <RadioGroupItem value="manual" id="manual" className="border-blue-600 w-5 h-5" />
                                <Label htmlFor="manual" className="cursor-pointer font-black block leading-tight">
                                    <span className="text-lg block mb-1 uppercase tracking-tighter italic">Distribution Manuelle</span>
                                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-widest">L&apos;admin choisit les classes</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {optimisticParams.transitionMode === "manual" && (
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                             <Button
                                className="w-full h-16 rounded-[2rem] bg-gradient-to-r from-purple-600 to-blue-700 hover:from-purple-700 hover:to-blue-800 text-white font-black text-lg shadow-2xl shadow-blue-500/30 uppercase tracking-[0.2em] transition-all hover:-translate-y-1 active:scale-[0.98]"
                                onClick={() => setIsTransitionDialogOpen(true)}
                            >
                                <GraduationCap className="w-7 h-7 mr-4" /> Lancer la transition annuelle
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TransitionDialog
                isOpen={isTransitionDialogOpen}
                onOpenChange={setIsTransitionDialogOpen}
            />
        </div>
    );
}
