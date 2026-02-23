"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

import { Payroll } from "./types";

interface PayPayrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll | null;
  onSuccess: (updatedPayroll: Payroll) => void;
}

export function PayPayrollModal({
  open,
  onOpenChange,
  payroll,
  onSuccess,
}: PayPayrollModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchAccounts();
      setPaymentMethod("CASH");
      setSelectedAccountId("");
      setSelectedExpenseAccountId("");
    }
  }, [open]);

  const fetchAccounts = async () => {
    try {
      // Fetch all accounts
      const res = await api.get("/compte?limit=1000");
      const allAccounts = res.data.comptes || [];
      
      // Filter Treasury Accounts (Source)
      const treasury = allAccounts.filter((a: any) => 
        ['CAISSE', 'BANQUE'].includes(a.category)
      );
      setAccounts(treasury);
      
      // Filter Expense Accounts (Destination) - mostly Class 6
      const expenses = allAccounts.filter((a: any) => 
        a.code.startsWith('6') || a.category === 'EXPENSE' || a.nature === 'EXPENSE'
      );
      setExpenseAccounts(expenses);

      // Auto-select first treasury account
      if (treasury.length > 0) {
        setSelectedAccountId(treasury[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
      toast.error("Failed to load accounts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      toast.error("Please select a treasury account");
      return;
    }

    if (!payroll) return;

    setLoading(true);
    try {
      const res = await api.post(`/payroll/pay/${payroll.id}`, {
        paymentMethod,
        compteId: parseInt(selectedAccountId),
        expenseAccountId: selectedExpenseAccountId && selectedExpenseAccountId !== "auto" ? parseInt(selectedExpenseAccountId) : undefined
      });

      toast.success("Payroll paid successfully");
      // Use the returned payroll from backend which includes the generated compteId (Expense Account)
      const updatedPayroll: Payroll = res.data.payroll; 
      onSuccess(updatedPayroll);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Payment failed", error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-0">
        <div className={cn("p-8 text-white relative bg-emerald-600")}>
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                <Wallet size={100} />
            </div>
            <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    Payer Salaire
                </DialogTitle>
                <DialogDescription className="text-white/80 font-bold text-xs uppercase tracking-widest mt-2 pl-1">
                    {payroll.employer.firstName} {payroll.employer.lastName}
                </DialogDescription>
            </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces (Cash)</SelectItem>
                  <SelectItem value="BANK">Virement Bancaire</SelectItem>
                  <SelectItem value="CHECK">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compte Source (Trésorerie)</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name} ({acc.balance} DA)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compte Destination (Dépense)</Label>
              <Select
                value={selectedExpenseAccountId}
                onValueChange={setSelectedExpenseAccountId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compte (Optionnel)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="auto">Automatique (Salaire Employé)</SelectItem>
                  {expenseAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
                <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Net to Pay</span>
                    <span className="text-2xl font-black text-emerald-600">
                        {Number(payroll.netSalary).toLocaleString()} DA
                    </span>
                </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
