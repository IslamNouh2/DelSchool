"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type StudentPayment = {
    id: number;
    amount: number;
    date: string;
    method: string;
    status: string;
    student: {
        firstName: string;
        lastName: string;
        studentClasses: Array<{
            Class: {
                ClassName: string;
            }
        }>
    };
};

const RecentStudentPayments = () => {
    const [payments, setPayments] = useState<StudentPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
             try {
                const res = await api.get("/finance/student-payments");
                setPayments(res.data);
            } catch (error) {
                console.error("Failed to fetch student payments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    if (loading) {
         return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
         <div className="bg-white dark:bg-[#1a1c2e] rounded-[32px] p-8 shadow-sm dark:shadow-xl border border-gray-100 dark:border-white/5 h-full flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Paiements Étudiants</h2>
                <button className="text-[10px] font-black text-[#0052cc] hover:text-blue-400 transition-all uppercase tracking-widest">Tout voir</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full">
                    <thead className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-left sticky top-0 bg-white dark:bg-[#1a1c2e] z-10">
                        <tr>
                            <th className="pb-4 pl-2 font-black">Nom étudiant</th>
                            <th className="pb-4 font-black">Classe</th>
                            <th className="pb-4 font-black">Montant</th>
                            <th className="pb-4 text-right font-black">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {payments.map((payment) => (
                            <tr key={payment.id} className="group hover:bg-gray-50/50 dark:hover:bg-[#0b0d17]/50 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-white dark:border-white/5 shadow-sm">
                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${payment.student.firstName}+${payment.student.lastName}&background=random`} />
                                            <AvatarFallback className="font-black text-xs">{payment.student.firstName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-black text-sm text-gray-900 dark:text-gray-100 leading-tight group-hover:text-[#0052cc] transition-colors uppercase tracking-tight">
                                                {payment.student.firstName} {payment.student.lastName}
                                            </div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">{payment.method}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                                    {payment.student.studentClasses[0]?.Class?.ClassName || "N/A"}
                                </td>
                                <td className="py-4 font-black text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                                    {payment.amount.toLocaleString()} DA
                                </td>
                                <td className="py-4 text-right">
                                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-0 shadow-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
                                        PAYÉ
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {payments.length === 0 && (
                    <div className="text-center text-gray-400 py-12 text-sm font-medium">Aucun paiement récent</div>
                )}
            </div>
        </div>
    );
};

export default RecentStudentPayments;
