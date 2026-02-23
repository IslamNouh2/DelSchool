"use client";

import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

type PayExpenseModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  expense: any;
  onSuccess: () => void;
};

const PayExpenseModal = ({ open, setOpen, expense, onSuccess }: PayExpenseModalProps) => {
  const t = useTranslations("finance.expenses");
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [selectedTreasuryAccount, setSelectedTreasuryAccount] = useState("");
  const [allAccounts, setAllAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  useEffect(() => {
     // Reset selection when method changes
     setSelectedTreasuryAccount("");
     
     // Filter based on method
     if (paymentMethod === 'CASH') {
         setTreasuryAccounts(allAccounts.filter((a: any) => a.category === 'CAISSE'));
     } else {
         setTreasuryAccounts(allAccounts.filter((a: any) => a.category === 'BANQUE'));
     }
  }, [paymentMethod, allAccounts]);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/compte?limit=1000");
      const accounts = res.data.comptes || [];
      setAllAccounts(accounts.filter((a: any) => ['CAISSE', 'BANQUE'].includes(a.category)));
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTreasuryAccount) {
        toast.error("Please select a treasury account");
        return;
    }

    startTransition(async () => {
        try {
            await api.post(`/expense/${expense.id}/pay`, {
                treasuryId: parseInt(selectedTreasuryAccount),
                method: paymentMethod
            });
            toast.success(t("messages.paid"));
            onSuccess();
            setOpen(false);
        } catch (error: any) {
            console.error("Pay expense error:", error);
            const message = error.response?.data?.message || t("messages.error_pay");
            toast.error(message);
        }
    });
  };

  if (!expense) return null;

  // Render SelectValue manually to avoid hydration issues if needed, but SelectValue is standard
  const SelectValueWrapper = ({ value, placeholder }: any) => {
    return <span>{value || placeholder}</span>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("form.pay_title")}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-4 border border-slate-100 dark:border-slate-800">
                <div className="text-sm text-gray-500">{t("table.title")}</div>
                <div className="font-bold text-gray-900 dark:text-white mb-2">{expense.title}</div>
                <div className="text-sm text-gray-500">{t("form.field_amount")}</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500">{Number(expense.amount).toLocaleString()} DA</div>
            </div>

            <div className="space-y-2">
                <Label>{t("form.payment_method")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CASH">{t("methods.CASH")}</SelectItem>
                        <SelectItem value="BANK_TRANSFER">{t("methods.BANK_TRANSFER")}</SelectItem>
                        <SelectItem value="CHECK">{t("methods.CHECK")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

             <div className="space-y-2">
                <Label>{t("form.treasury_account")} ({paymentMethod === 'CASH' ? t("categories.GENERAL") : t("categories.UTILITIES")})</Label>
                <Select value={selectedTreasuryAccount} onValueChange={setSelectedTreasuryAccount}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("messages.select_treasury")}>
                             {treasuryAccounts.find(a => a.id.toString() === selectedTreasuryAccount)?.name || t("messages.select_treasury")}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {treasuryAccounts.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">{t("table.no_data")}</div>
                        ) : (
                            treasuryAccounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id.toString()}>
                                    {acc.name} ({acc.balance ?? 0} DA)
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel" as any)}</Button>
                <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    {isPending ? t("common.saving" as any) : t("finance.accounts.buttons.validate" as any)}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayExpenseModal;
