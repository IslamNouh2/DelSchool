"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PaymentCollectionFormProps {
    data: any;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
}

export default function PaymentCollectionForm({ data, setOpen, onSuccess }: PaymentCollectionFormProps) {
    const [pendingFees, setPendingFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        feeId: "",
        amount: "",
        method: "CASH",
        date: new Date().toISOString().split('T')[0],
        compteId: "",
    });
    const [comptes, setComptes] = useState<any[]>([]);

    useEffect(() => {
        const fetchPendingFees = async () => {
            try {
                const [feesRes, comptesRes] = await Promise.all([
                    api.get(`/student/${data.studentId}/pending-fees`),
                    api.get('/compte?limit=100')
                ]);
                setPendingFees(feesRes.data || []);
                const filteredComptes = (comptesRes.data.comptes || []).filter((c: any) => c.category === 'CAISSE' || c.category === 'BANQUE');
                setComptes(filteredComptes);
                if (filteredComptes.length > 0) {
                    setFormData(prev => ({ ...prev, compteId: String(filteredComptes[0].id) }));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPendingFees();
    }, [data.studentId]);

    const handleFeeChange = (feeId: string) => {
        const fee = pendingFees.find(f => String(f.id) === feeId);
        setFormData({
            ...formData,
            feeId,
            amount: fee ? String(fee.amount) : "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount) return toast.error("Please enter an amount");

        try {
            await api.post("/payments", {
                studentId: data.studentId,
                feeId: formData.feeId ? parseInt(formData.feeId) : undefined,
                amount: parseFloat(formData.amount),
                method: formData.method,
                date: new Date(formData.date).toISOString(),
                compteId: formData.compteId ? parseInt(formData.compteId) : undefined,
                status: "COMPLETED",
            });
            toast.success("Payment recorded successfully");
            onSuccess();
            setOpen(false);
        } catch (error) {
            toast.error("Failed to record payment");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Destination Account (Caisse/Banque)</Label>
                <Select 
                    value={formData.compteId} 
                    onValueChange={(v) => setFormData({ ...formData, compteId: v })}
                >
                    <SelectTrigger className="rounded-xl border-blue-100 bg-blue-50/30">
                        <SelectValue placeholder="Select Caisse..." />
                    </SelectTrigger>
                    <SelectContent>
                        {comptes.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                {c.name} ({c.category})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Select Fee (Optional)</Label>
                <Select value={formData.feeId} onValueChange={handleFeeChange}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="General Payment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">General Payment</SelectItem>
                        {pendingFees.map((f) => (
                            <SelectItem key={f.id} value={String(f.id)}>
                                {f.title} ({f.amount} DA)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Amount (DA)</Label>
                <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="rounded-xl"
                    placeholder="0.00"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="CARD">Card</SelectItem>
                            <SelectItem value="BANK_TRANSFER">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="rounded-xl"
                    />
                </div>
            </div>
            <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 h-11 rounded-xl font-bold mt-2"
                disabled={loading}
            >
                Confirm Payment
            </Button>
        </form>
    );
}
