"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaymentForm from "@/components/forms/PaymentForm";
import { useSocket } from "@/providers/SocketProvider";

interface Payment {
  id: number;
  amount: number;
  date: string;
  method: string;
  status: string;
  fee?: { title: string };
  student?: { firstName: string; lastName: string };
}

export default function PaymentListPage() {
  const [data, setData] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formType, setFormType] = useState<'create' | 'update'>('create');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { refreshKey } = useSocket();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/payments");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/payments/${id}`);
      toast.success("Payment deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">Payments</h1>
              <p className="text-sm text-muted-foreground">Manage student payments</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => { setFormType('create'); setSelectedPayment(null); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />Create Payment
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">Loading payments...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">${p.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>{p.fee?.title ?? "-"}</TableCell>
                        <TableCell>{p.student ? `${p.student.firstName} ${p.student.lastName}` : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                            Delete
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setFormType('update'); setSelectedPayment(p); setIsDialogOpen(true); }} className="ml-2">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{formType === 'create' ? "Create Payment" : "Edit Payment"}</DialogTitle>
            <DialogDescription>
              Fill in the details to manage the payment.
            </DialogDescription>
          </DialogHeader>
          <PaymentForm
            type={formType}
            data={selectedPayment}
            setOpen={setIsDialogOpen}
            onSuccess={() => { fetchData(); setIsDialogOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
