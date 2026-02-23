"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit2, Wallet } from "lucide-react";
import { Payroll } from "./types";
import { toast } from "sonner";
import api from "@/lib/api";

interface EditPayrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll;
  onUpdate: (updated: Payroll) => void;
}

export function EditPayrollModal({
  open,
  onOpenChange,
  payroll,
  onUpdate,
}: EditPayrollModalProps) {
  const [allowances, setAllowances] = useState(payroll.allowances);
  const [deductions, setDeductions] = useState(payroll.deductions);
  const [status, setStatus] = useState(payroll.status);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reset state when payroll changes
  useEffect(() => {
    setAllowances(payroll.allowances);
    setDeductions(payroll.deductions);
    setStatus(payroll.status);
  }, [payroll]);

  const handleSave = async () => {
      setLoading(true);
      
      const newAllowances = parseFloat(String(allowances));
      const newDeductions = parseFloat(String(deductions));
      const baseSalary = parseFloat(String(payroll.baseSalary));
      const newNetSalary = baseSalary + newAllowances - newDeductions;

      // Optimistic Update
        const optimisticPayroll: Payroll = {
            ...payroll,
            allowances: String(newAllowances),
            deductions: String(newDeductions),
            netSalary: String(newNetSalary),
            status,
        };
        
        startTransition(() => {
            onUpdate(optimisticPayroll);
            onOpenChange(false);
        });

      try {
        const res = await api.patch(`/payroll/${payroll.id}`, {
            allowances: newAllowances,
            deductions: newDeductions,
            status,
        });
        
        toast.success("Payroll updated successfully");
      } catch (error) {
          toast.error("Failed to update payroll on server");
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const calculatedNet = (
      parseFloat(String(payroll.baseSalary)) + 
      parseFloat(String(allowances || 0)) - 
      parseFloat(String(deductions || 0))
  ).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
        <div className="bg-indigo-600 p-8 text-white relative">
             <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                <Edit2 size={100} />
            </div>
             <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                     <div className="p-2 bg-white/20 rounded-full">
                        <Wallet size={24} />
                    </div>
                    Modifier Paie
                </DialogTitle>
                <div className="text-white/80 font-bold text-xs uppercase tracking-widest mt-2 pl-1">
                    {payroll.employer.firstName} {payroll.employer.lastName} ({payroll.employer.code})
                </div>
            </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
            <div className="space-y-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="base" className="text-right text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest">
                    Salaire Base
                    </Label>
                    <Input id="base" value={payroll.baseSalary} disabled className="col-span-3 rounded-xl h-12 bg-gray-50 border-gray-100 font-mono font-bold" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="allowances" className="text-right text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest">
                    Primes (+)
                    </Label>
                    <Input
                    id="allowances"
                    type="number"
                    value={allowances}
                    onChange={(e) => setAllowances(e.target.value)}
                    className="col-span-3 rounded-xl h-12 bg-gray-50 border-gray-100 font-mono font-bold text-emerald-600"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="deductions" className="text-right text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest">
                    Déductions (-)
                    </Label>
                    <Input
                    id="deductions"
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="col-span-3 rounded-xl h-12 bg-gray-50 border-gray-100 font-mono font-bold text-rose-600"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest">
                    Statut
                    </Label>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                        <SelectTrigger className="col-span-3 rounded-xl h-12 bg-gray-50 border-gray-100 font-bold">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">Brouillon</SelectItem>
                            <SelectItem value="SUBMITTED">Soumis</SelectItem>
                            <SelectItem value="APPROVED">Approuvé</SelectItem>
                            <SelectItem value="REJECTED">Rejeté</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4 pt-4 border-t border-gray-100">
                    <Label className="text-right text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest">
                    Net à Payer
                    </Label>
                    <div className="col-span-3 font-black text-2xl text-indigo-600">
                        {Number(calculatedNet).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </div>
                </div>
            </div>

            <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les modifications
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
