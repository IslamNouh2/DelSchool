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

type ExpenseModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess: () => void;
};

const ExpenseModal = ({ open, setOpen, onSuccess }: ExpenseModalProps) => {
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
            toast.success("Expense created successfully");
            onSuccess();
            setOpen(false);
        } catch (error: any) {
            console.error("Create expense error:", error);
            const message = error.response?.data?.message || "Failed to create expense";
            toast.error(message);
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
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
                    <Label>Date</Label>
                    <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GENERAL">General</SelectItem>
                            <SelectItem value="UTILITIES">Utilities</SelectItem>
                            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                            <SelectItem value="SUPPLIES">Supplies</SelectItem>
                            <SelectItem value="RENT">Rent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Expense Account */}
            <div className="space-y-2">
                <Label>Expense Account (Compte Charge)</Label>
                <Select value={selectedExpenseAccount} onValueChange={setSelectedExpenseAccount}>
                    <SelectTrigger><SelectValue placeholder="Select Expense Account" /></SelectTrigger>
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
                <Label htmlFor="amortization">Is Amortization (Immobilisation/Amortissement)</Label>
            </div>

            {/* Consumption Dates */}
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
                {!isAmortization && (
                    <div className="space-y-2">
                        <Label>Date Début Consommation</Label>
                        <Input type="date" value={dateStartConsommation} onChange={(e) => setDateStartConsommation(e.target.value)} />
                    </div>
                )}
                
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Date Fin Consommation</Label>
                    <Input type="date" value={dateEndConsommation} onChange={(e) => setDateEndConsommation(e.target.value)} />
                    {isAmortization && <span className="text-xs text-gray-500">Start date will be set to Expense Date</span>}
                </div>
            </div>

            {/* Observation */}
            <div className="space-y-2">
                <Label>Observation</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." />
            </div>

            {/* Payment Toggle */}
            <div className="border-t pt-4 mt-4">
                 <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                        id="payment" 
                        checked={addPayment}
                        onCheckedChange={(c) => setAddPayment(!!c)}
                    />
                    <Label htmlFor="payment" className="font-bold">Add Payment (Payer Immédiatement)</Label>
                </div>

                {addPayment && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-green-50">
                        <div className="space-y-2">
                            <Label>Compte Source (Trésorerie)</Label>
                            <Select value={selectedTreasuryAccount} onValueChange={setSelectedTreasuryAccount}>
                                <SelectTrigger><SelectValue placeholder="Select Treasury Account" /></SelectTrigger>
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
                             <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger><SelectValueWrapper placeholder="Method" value={paymentMethod} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">CASH</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                                    <SelectItem value="CHECK">CHECK</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Create Expense"}
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
