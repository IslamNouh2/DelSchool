"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Loader2, User, Wallet } from "lucide-react";
import { EditPayrollModal } from "./EditPayrollModal";
import { PayPayrollModal } from "./PayPayrollModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Payroll } from "./types";
import { OfflineDB, SyncRecord } from "@/lib/db";
import { SyncStatusBadge } from "@/components/pwa/SyncStatusBadge";
import Cookies from "js-cookie";

interface PayrollTableProps {
  periodStart: string;
  periodEnd: string;
}

export function PayrollTable({ periodStart, periodEnd }: PayrollTableProps) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [syncQueue, setSyncQueue] = useState<SyncRecord[]>([]);
  const tenantId = Cookies.get("tenantId") as string;

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      // Use the api instance which has the Base URL configured
      const url = `/payroll?start=${periodStart}&end=${periodEnd}`;
      
      const [res, queue] = await Promise.all([
        api.get(url),
        OfflineDB.getSyncQueue(tenantId)
      ]);
      
      setSyncQueue(queue);
      let mergedData: Payroll[] = res.data || [];

      // Merge pending generation (POST /payroll/generate)
      // Note: backend generate returns {count, generatedPayrolls} but findAll returns Payroll[]
      // Sync queue doesn't store the resulting fiches until synced, but we can show "Processing..." if we wanted.
      // However, usually generate creates many. For simplicity, we mostly care about Edits and Payments.

      // Merge pending updates (PATCH /payroll/:id)
      const pendingUpdates = queue.filter(q => q.url.includes('/payroll/') && q.method === 'PATCH');
      mergedData = mergedData.map(p => {
        const update = pendingUpdates.find(q => q.url.endsWith(`/payroll/${p.id}`));
        if (update) {
            return {
                ...p,
                allowances: String(update.data.allowances),
                deductions: String(update.data.deductions),
                status: update.data.status,
                pending: true
            };
        }
        return p;
      });

      // Merge pending payments (POST /payroll/pay/:id)
      const pendingPayments = queue.filter(q => q.url.includes('/payroll/pay/') && q.method === 'POST');
      mergedData = mergedData.map(p => {
          if (pendingPayments.some(q => q.url.endsWith(`/payroll/pay/${p.id}`))) {
              return { ...p, status: 'PAID', pending: true };
          }
          return p;
      });

      setPayrolls(mergedData);
    } catch (error) {
      console.error("Failed to fetch payrolls", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [periodStart, periodEnd]);

  const handleEdit = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsEditOpen(true);
  };

  const handlePay = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsPayOpen(true);
  };

  const handleUpdateOptimistic = (updated: Payroll) => {
     setPayrolls((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
     );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
      case "SUBMITTED": return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      case "REJECTED": return "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200";
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200";
    }
  };

  if (loading) {
     return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden relative">
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
             <h3 className="font-black text-xl flex items-center gap-3">
                <User className="text-gray-400" />
                Liste des Paies
            </h3>
        </div>

        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-slate-950/50">
            <TableRow className="border-b border-gray-100 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="w-[250px] font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest pl-8 py-6">Employé</TableHead>
              <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-right">Salaire Base</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right text-rose-500">Déductions</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right text-emerald-500">Bonus/Primes</TableHead>
              <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-right">Salaire Net</TableHead>
              <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-center">Statut</TableHead>
              <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-center">Compte</TableHead>
              <TableHead className="text-right font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrolls.length === 0 ? (
                <TableRow>
                     <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                             <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                                <User size={32} />
                            </div>
                            <p className="font-bold uppercase text-xs tracking-widest">Aucune fiche de paie trouvée</p>
                        </div>
                    </TableCell>
                </TableRow>
            ) : (
                payrolls.map((payroll) => (
                <TableRow key={payroll.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 text-sm font-medium">
                    <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm">
                                <AvatarImage src={payroll.employer.photoFileName ? `http://localhost:3000/api/employer/photo/${payroll.employer.photoFileName}` : undefined} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{payroll.employer.firstName[0]}{payroll.employer.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white leading-tight">{payroll.employer.firstName} {payroll.employer.lastName}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payroll.employer.code}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-600 dark:text-gray-300">{Number(payroll.baseSalary).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</TableCell>
                    <TableCell className="text-right font-mono text-rose-600 font-bold">-{Number(payroll.deductions).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 font-bold">+{Number(payroll.allowances).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">{Number(payroll.netSalary).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</TableCell>
                     <TableCell className="text-center">
                         <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className={cn("font-bold border px-3 py-1", getStatusColor(payroll.status))}>
                                {payroll.status}
                            </Badge>
                            {syncQueue.some(q => 
                                (q.url.endsWith(`/payroll/${payroll.id}`) && q.method === 'PATCH') ||
                                (q.url.endsWith(`/payroll/pay/${payroll.id}`) && q.method === 'POST')
                            ) && <SyncStatusBadge id={payroll.id} isPending={true} />}
                         </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-gray-500">
                        {payroll.compte ? payroll.compte.name : '-'}
                    </TableCell>
                    <TableCell className="pr-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           {payroll.status !== "PAID" && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 rounded-full"
                                    onClick={() => handlePay(payroll)}
                                    title="Payer"
                                >
                                    <Wallet className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 rounded-full"
                                onClick={() => handleEdit(payroll)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPayroll && (
        <>
            <EditPayrollModal
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                payroll={selectedPayroll}
                onUpdate={handleUpdateOptimistic}
            />
             <PayPayrollModal
                open={isPayOpen}
                onOpenChange={setIsPayOpen}
                payroll={selectedPayroll}
                onSuccess={(updated) => {
                    handleUpdateOptimistic(updated);
                   // setIsPayOpen(false); // Handled inside modal likely, but can be explicit
                }}
            />
        </>
      )}
    </>
  );
}
