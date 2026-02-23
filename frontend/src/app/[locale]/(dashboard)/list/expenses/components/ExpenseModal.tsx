"use client";

import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

type ExpenseModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess: () => void;
};

const ExpenseModal = ({ open, setOpen, onSuccess }: ExpenseModalProps) => {
  const t = useTranslations("finance.expenses");
  const [isPending, startTransition] = useTransition();
  
  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAmortization, setIsAmortization] = useState(false);
  const [dateStartConsommation, setDateStartConsommation] = useState("");
  const [dateEndConsommation, setDateEndConsommation] = useState("");
  const [description, setDescription] = useState("");
  
  // Account State
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState("");
  
  // Payment State
  const [addPayment, setAddPayment] = useState(false);
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [selectedTreasuryAccount, setSelectedTreasuryAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    if (open) {
      fetchAccounts();
      resetForm();
    }
  }, [open]);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/compte?limit=1000");
      const accounts = res.data.comptes || [];
      
      // Filter for Expense accounts (Class 6) or accounts categorized as EXPENSE/DEPENSE
      // Also fallback to name check if code/category is missing
      const expenseFilter = (a: any) => {
          if (['CAISSE', 'BANQUE'].includes(a.category)) return false; // Exclude Treasury
          if (a.code && a.code.startsWith('6')) return true;
          if (a.category === 'DEPENSE') return true;
          if (a.nature === 'EXPENSE') return true;
          if (a.name.toLowerCase().includes('charge')) return true;
          if (a.name.toLowerCase().includes('dépense') || a.name.toLowerCase().includes('depense')) return true;
          // Check parent account name (e.g. "Charges")
          if (a.parent && (a.parent.name.toLowerCase().includes('charge') || a.parent.name.toLowerCase().includes('depense'))) return true;
          return false;
      };
      
      setExpenseAccounts(accounts.filter(expenseFilter));
      
      setTreasuryAccounts(accounts.filter((a: any) => ['CAISSE', 'BANQUE'].includes(a.category)));
      
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("GENERAL");
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setIsAmortization(false);
    setDateStartConsommation("");
    setDateEndConsommation("");
    setDescription("");
    setSelectedExpenseAccount("");
    setAddPayment(false);
    setSelectedTreasuryAccount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
        title,
        amount: parseFloat(amount),
        category,
        expenseDate,
        description,
        isAmortization,
        dateEndConsommation: dateEndConsommation || null,
        compteId: selectedExpenseAccount ? parseInt(selectedExpenseAccount) : null,
        // Standardize payment payload structure
        payment: addPayment && selectedTreasuryAccount ? {
            treasuryId: parseInt(selectedTreasuryAccount),
            method: paymentMethod
        } : undefined
      };

      if (!isAmortization) {
          payload.dateStartConsommation = dateStartConsommation || null;
      }

    startTransition(async () => {
        try {
            const res = await api.post("/expense", payload);
            toast.success(t("messages.created"));
            onSuccess();
            setOpen(false);
        } catch (error: any) {
            console.error("Create expense error:", error);
            const message = error.response?.data?.message || t("messages.error_pay");
            toast.error(message);
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("form.add_title")}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Title & Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Expense Title" />
                </div>
                <div className="space-y-2">
                    <Label>Amount (DA)</Label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
                </div>
            </div>

              {/* Date & Category */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t("form.field_date")}</Label>
                    <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>{t("form.field_category")}</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GENERAL">{t("categories.GENERAL")}</SelectItem>
                            <SelectItem value="UTILITIES">{t("categories.UTILITIES")}</SelectItem>
                            <SelectItem value="MAINTENANCE">{t("categories.MAINTENANCE")}</SelectItem>
                            <SelectItem value="SUPPLIES">{t("categories.SUPPLIES")}</SelectItem>
                            <SelectItem value="RENT">{t("categories.RENT")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Expense Account */}
            <div className="space-y-2">
                <Label>{t("form.field_account")}</Label>
                <Select value={selectedExpenseAccount} onValueChange={setSelectedExpenseAccount}>
                    <SelectTrigger><SelectValue placeholder={t("form.placeholder_account")} /></SelectTrigger>
                    <SelectContent>
                        {expenseAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>
                                <span className="font-mono mr-2">{acc.code}</span>
                                {acc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Amortization Toggle */}
            <div className="flex items-center space-x-2 py-2">
                <Checkbox 
                    id="amortization" 
                    checked={isAmortization}
                    onCheckedChange={(c) => setIsAmortization(!!c)}
                />
                <Label htmlFor="amortization">{t("form.amortization")}</Label>
            </div>

             {/* Consumption Dates */}
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
                {!isAmortization && (
                    <div className="space-y-2">
                        <Label>{t("form.start_date")}</Label>
                        <Input type="date" value={dateStartConsommation} onChange={(e) => setDateStartConsommation(e.target.value)} />
                    </div>
                )}
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>{t("form.end_date")}</Label>
                    <Input type="date" value={dateEndConsommation} onChange={(e) => setDateEndConsommation(e.target.value)} />
                    {isAmortization && <span className="text-xs text-gray-500">Start date will be set to Expense Date</span>}
                </div>
            </div>

            {/* Observation */}
            <div className="space-y-2">
                <Label>{t("form.field_description")}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("form.placeholder_description")} />
            </div>

            {/* Payment Toggle */}
            <div className="border-t pt-4 mt-4">
                 <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                        id="payment" 
                        checked={addPayment}
                        onCheckedChange={(c) => setAddPayment(!!c)}
                    />
                    <Label htmlFor="payment" className="font-bold">{t("form.immediate_payment")}</Label>
                </div>

                 {addPayment && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-green-50">
                        <div className="space-y-2">
                            <Label>{t("form.treasury_account")}</Label>
                            <Select value={selectedTreasuryAccount} onValueChange={setSelectedTreasuryAccount}>
                                <SelectTrigger><SelectValue placeholder={t("messages.select_treasury")} /></SelectTrigger>
                                <SelectContent>
                                    {treasuryAccounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id.toString()}>
                                            {acc.name} ({acc.balance ?? 0} DA)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>{t("form.payment_method")}</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger><SelectValueWrapper placeholder="Method" value={paymentMethod} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">{t("methods.CASH")}</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">{t("methods.BANK_TRANSFER")}</SelectItem>
                                    <SelectItem value="CHECK">{t("methods.CHECK")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel" as any)}</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? t("common.saving" as any) : t("finance.accounts.buttons.validate" as any)}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Helper for Select Value display issue if any
const SelectValueWrapper = ({ value, placeholder }: any) => {
    return <span>{value || placeholder}</span>;
}

export default ExpenseModal;
