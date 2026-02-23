"use client";

import Pagination from "@/components/PaginationBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useOptimistic, useTransition, useEffect, useCallback } from "react";
import ExpenseModal from "./components/ExpenseModal";
import PayExpenseModal from "./components/PayExpenseModal";
import { 
    Edit, 
    Trash2, 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Plus, 
    Search,
    History,
    Calendar,
    Filter,
    RefreshCw,
    Loader2,
    Banknote
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/providers/SocketProvider";
import { useTranslations } from "next-intl";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  isPaid: boolean;
  compte?: {
      name: string;
      code: string;
  };
};

const ExpenseList = () => {
  const t = useTranslations("finance.expenses");
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [expenseToPay, setExpenseToPay] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { refreshKey } = useSocket();
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = useCallback(async () => {
      setLoading(true);
      try {
          const res = await api.get("/expense");
          if (Array.isArray(res.data)) {
              setData(res.data);
          } else {
               setData([]); 
          }
      } catch (error) {
          console.error("Failed to fetch expenses", error);
          toast.error(t("messages.error_fetch"));
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      fetchData();
  }, [fetchData, refreshKey]);

  const [optimisticExpenses, addOptimisticExpense] = useOptimistic(
    data,
    (state, action: { type: 'delete', id: number } | { type: 'add', expense: Expense }) => {
        if (action.type === 'delete') {
            return state.filter(exp => exp.id !== action.id);
        } else if (action.type === 'add') {
            return [action.expense, ...state];
        }
        return state;
    }
  );

  // Filter logic
  const filteredExpenses = optimisticExpenses.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

  // Stats calculation
  const totalExpenses = optimisticExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const unpaidExpenses = optimisticExpenses
    .filter(item => !item.isPaid)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50/50 dark:bg-slate-950/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-3 bg-lamaSky rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                  <Wallet size={24} />
              </div>
              {t("title")}
              <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                   {optimisticExpenses.length} Total
              </span>
           </h1>
           <p className="text-gray-500 font-medium mt-2 max-w-lg">
              {t("subtitle")}
           </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
                variant="outline" 
                onClick={fetchData}
                disabled={loading}
                className="h-11 w-11 p-0 rounded-xl"
            >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                    placeholder={t("search")} 
                    className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button 
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-lamaSky hover:bg-lamaSkyLight text-white font-bold h-11 px-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
                <Plus className="mr-2 h-5 w-5" />
                {t("new_expense")}
            </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={100} />
              </div>
              <div className="relative z-10">
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Total Dépenses
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                      {totalExpenses.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                  </h3>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingDown size={100} />
              </div>
               <div className="relative z-10">
                  <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Reste à Payer (Impayé)
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                      {unpaidExpenses.toLocaleString()} <span className="text-base text-gray-400">DA</span>
                  </h3>
              </div>
          </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden relative">
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-black text-xl flex items-center gap-3">
                <History className="text-gray-400" />
                Historique des dépenses
            </h3>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-gray-50">
                    <Calendar size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-gray-50">
                    <Filter size={18} />
                </Button>
            </div>
        </div>

        <Table>
             <TableHeader className="bg-gray-50/50 dark:bg-slate-950/50">
                <TableRow className="border-b border-gray-100 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="w-[180px] font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest pl-8 py-6">{t("table.date")}</TableHead>
                    <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">{t("table.title")}</TableHead>
                    <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">{t("table.category")}</TableHead>
                    <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">{t("table.account")}</TableHead>
                    <TableHead className="font-bold text-gray-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">{t("table.status")}</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-8 text-emerald-600">{t("table.amount")}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        </TableCell>
                    </TableRow>
                ) : currentExpenses.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                                    <History size={32} />
                                </div>
                                <p className="font-bold uppercase text-xs tracking-widest">{t("table.no_data")}</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    currentExpenses.map((expense) => (
                        <TableRow 
                            key={expense.id} 
                            className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 text-sm font-medium"
                        >
                            <TableCell className="pl-8 py-4 text-gray-500">
                                {new Date(expense.expenseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <span className="text-gray-900 dark:text-white font-bold">{expense.title}</span>
                            </TableCell>
                            <TableCell>
                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                    {t(`categories.${expense.category}` as any)}
                                </span>
                            </TableCell>
                            <TableCell>
                                 <span className="text-xs font-mono text-gray-500">
                                    {expense.compte ? `${expense.compte.code} - ${expense.compte.name}` : '-'}
                                 </span>
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${expense.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {expense.isPaid ? t("table.paid") : t("table.unpaid")}
                                </span>
                            </TableCell>
                            <TableCell className="text-right pr-8 font-bold text-gray-900 dark:text-white">
                                {Number(expense.amount).toLocaleString()} DA
                            </TableCell>
                            <TableCell className="pr-6">
                                <ActionButtons 
                                    item={expense} 
                                    addOptimistic={addOptimisticExpense} 
                                    onSuccess={fetchData} 
                                    onPay={(item) => {
                                        setExpenseToPay(item);
                                        setPayModalOpen(true);
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
        
        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
             <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
      </div>

      {/* MODAL */}
      <ExpenseModal 
        open={isModalOpen} 
        setOpen={setIsModalOpen}
        onSuccess={fetchData}
      />

       <PayExpenseModal
        open={payModalOpen}
        setOpen={setPayModalOpen}
        expense={expenseToPay}
        onSuccess={fetchData}
      />
    </div>
  );
};

const ActionButtons = ({ item, addOptimistic, onSuccess, onPay }: { item: Expense, addOptimistic: (action: any) => void, onSuccess: () => void, onPay: (item: Expense) => void }) => {
    const t = useTranslations("finance.expenses");
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if(confirm(t("messages.delete_confirm"))) {
            startTransition(async () => {
                 addOptimistic({ type: 'delete', id: item.id });
                 try {
                     await api.delete(`/expense/${item.id}`);
                     toast.success(t("messages.deleted"));
                     onSuccess();
                 } catch (e) {
                     toast.error(t("messages.error_delete"));
                 }
            });
        }
    }

    return (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!item.isPaid && (
                <button 
                    className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors text-gray-400 hover:text-emerald-500"
                    onClick={() => onPay(item)}
                    title="Pay Expense"
                >
                    <Banknote size={16} />
                </button>
            )}
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400 hover:text-blue-600" onClick={() => {/* Handle Edit */}}>
                <Edit size={16} />
            </button>
            <button 
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-gray-400 hover:text-red-500"
                onClick={handleDelete}
                disabled={isPending}
            >
                <Trash2 size={16} />
            </button>
        </div>
    )
}

export default ExpenseList;
