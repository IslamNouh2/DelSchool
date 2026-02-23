"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Calculator, Settings2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface GeneratePayrollModalProps {
  defaultStart: string;
  defaultEnd: string;
  onSuccess: () => void;
}

export function GeneratePayrollModal({
  defaultStart,
  defaultEnd,
  onSuccess,
}: GeneratePayrollModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  // Initialized expenseDate in the previous tool call, ensuring clean state declaration here if needed or merged.
  // Actually, I inserted it into the previous replacement block. 
  // But wait, the previous block started at line 141 (render). I need to add state definition at top.
  // Wait, I see I added `const [expenseDate...` in the ReplacementContent of first call, 
  // BUT the TargetContent there was inside validation logic? No, it was render.
  // The first call TargetContent was lines 141+.
  // So `const [expenseDate`... was inserted inside the return/JSX? That's invalid.
  // I need to correct the previous call or fix it here.
  // I will check the file content after updates, but likely I inserted it in the middle of JSX which is wrong.
  // I will fix it by placing the state definition at the top.

  
  const [employers, setEmployers] = useState<any[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState<string>("all");
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const fetchData = async () => {
      try {
          const [empRes, accRes] = await Promise.all([
              api.get("/employer/list?limit=1000"),
              api.get("/compte?limit=1000")
          ]);

          setEmployers(empRes.data.employers || []);
          
          const relevantAccounts = accRes.data.comptes || [];
          setAccounts(relevantAccounts);

          // Auto-select "Salaires" account if found
          const salaryAccount = relevantAccounts.find((a: any) => 
              a.code.startsWith("63") || a.name.toLowerCase().includes("salaire")
          );
          if (salaryAccount) {
              setSelectedAccountId(salaryAccount.id.toString());
          }

      } catch (error) {
          console.error("Failed to fetch data", error);
      }
  };

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const handleGenerate = async () => {
    if (!selectedEmployerId || selectedEmployerId === "all") {
        toast.error("Veuillez sélectionner un employé.");
        return;
    }

    setLoading(true);
    try {
      const payload: any = {
          period_start: new Date(start).toISOString(),
          period_end: new Date(end).toISOString(),
          date: new Date(expenseDate).toISOString(),
          employerId: parseInt(selectedEmployerId),
      };

      if (selectedAccountId) {
          payload.compteId = parseInt(selectedAccountId);
      }

      if (selectedAccountId) {
          payload.compteId = parseInt(selectedAccountId);
      }

      const res = await api.post("/payroll/generate", payload);

      const data = res.data;
      toast.success(`Generated ${data.count} payroll records successfully.`);
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error("Error generating payroll.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (val) fetchData();
    }}>
      <DialogTrigger asChild>
         <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 px-6">
            <Calculator className="mr-2" size={20} />
            Générer Paie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
        <div className="bg-indigo-600 p-8 text-white relative">
             <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                <Calculator size={100} />
            </div>
            <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                     <div className="p-2 bg-white/20 rounded-full">
                        <Settings2 size={24} />
                    </div>
                    Générer la Paie
                </DialogTitle>
                <DialogDescription className="text-white/80 font-bold text-xs uppercase tracking-widest mt-2 pl-1">
                    Calcul automatique des salaires
                </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-8 space-y-6">

  

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Date Début Consommation</label>
                    <Input 
                        type="date" 
                        value={start} 
                        onChange={(e) => setStart(e.target.value)} 
                         className="rounded-xl h-12 bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Date Fin Consommation</label>
                    <Input 
                        type="date" 
                        value={end} 
                        onChange={(e) => setEnd(e.target.value)} 
                         className="rounded-xl h-12 bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                    />
                </div>
            </div>

            <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Date Dépense</label>
                    <Input 
                        type="date" 
                        value={expenseDate} 
                        onChange={(e) => setExpenseDate(e.target.value)} 
                         className="rounded-xl h-12 bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                    />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Employé (Requis)</label>
                <select 
                    value={selectedEmployerId}
                    onChange={(e) => setSelectedEmployerId(e.target.value)}
                    className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Sélectionner un employé...</option>
                    {employers.map((emp) => (
                        <option key={emp.employerId} value={emp.employerId}>
                            {emp.firstName} {emp.lastName} ({emp.code})
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest ml-1">Compte de Charges (Salaires)</label>
                <select 
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Sélectionner un compte...</option>
                    {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                        </option>
                    ))}
                </select>
            </div>
            
            <p className="text-sm text-gray-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100 dark:bg-slate-800 dark:border-slate-700">
                Cette action calculera les salaires de base, appliquera les déductions pour les absences et les retards, et générera les fiches de paie pour la période sélectionnée.
            </p>

            <div className="flex gap-4">
                 <Button 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="flex-1 h-12 rounded-xl border-gray-200"
                >
                    Annuler
                </Button>
                <Button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmer la génération
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
