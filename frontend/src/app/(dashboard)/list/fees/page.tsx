"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, X, Download, Plus, Edit, Trash, CreditCard, MoreHorizontal, Search, Filter, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FeeForm from "@/components/forms/FeeForm";
import CompteTree from "@/components/compte/CompteTree";
import CompteForm from "@/components/compte/CompteForm";

interface Fee {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  classId?: number;
  studentId?: number;
  description?: string;
  class?: { ClassName: string };
  student?: { firstName: string; lastName: string };
  compteId?: number;
  compte?: { name: string };
  payments?: Array<{ id: number; amount: number; status: string }>;
}

interface DashboardStats {
  totalCollected: number;
  totalExpenses: number;
  netBalance: number;
  pendingFees: number;
  paidStudents: number;
  averageFee: number;
}

interface FeeType {
  name: string;
  amount: number;
  color: string;
}

interface StudentFeeStatus {
  id: string;
  studentId: number;
  studentName: string;
  class: string;
  feeId: number;
  feeTitle: string;
  account: string;
  amount: number;
  paid: number;
  pending: number;
  status: string;
}

export default function FeesDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [studentStatus, setStudentStatus] = useState<StudentFeeStatus[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"fee-create" | "fee-update" | "payment">("fee-create");
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Payment modal for student status
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeStatus | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  // Expense states
  const [employers, setEmployers] = useState<any[]>([]);


  // Account states
  const [comptes, setComptes] = useState<any[]>([]);
  const [isCompteDialogOpen, setIsCompteDialogOpen] = useState(false);
  const [compteDialogType, setCompteDialogType] = useState<"create" | "update">("create");
  const [selectedCompte, setSelectedCompte] = useState<any>(null);

  // Filter states
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);

  // Reset selected items when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedFee(null);
    }
  }, [isDialogOpen]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, typesRes, statusRes] = await Promise.all([
        api.get("/fees/dashboard/stats"),
        api.get("/fees/dashboard/types"),
        api.get("/fees/dashboard/student-status"),
      ]);
      setStats(statsRes.data);
      setFeeTypes(typesRes.data);
      setStudentStatus(statusRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: "Could not fetch dashboard data."
      });
    }
  };

  const fetchFees = async () => {
    setLoading(true);
    try {
      const response = await api.get("/fees");
      setFees(response.data);
    } catch (error) {
      console.error("Error fetching fees:", error);
      toast({
        variant: "destructive",
        title: "Error loading fees",
        description: "Could not fetch fees."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/payments/history");
      setHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const fetchEmployers = async () => {
    try {
      const response = await api.get("/employer/list?limit=100");
      setEmployers(response.data.employers || []);
    } catch (error) {
      console.error("Error fetching employers:", error);
    }
  };

  const fetchComptes = async () => {
    try {
      console.log("Fetching accounts...");
      const response = await api.get("/compte", { params: { limit: 1000 } });
      const flat = response.data.comptes || [];
      console.log("Fetched accounts:", flat.length);
      
      // Build tree structure
      const map = new Map<number, any>();
      flat.forEach((c: any) => map.set(c.id, { ...c, children: [] }));
      
      const rootComptes: any[] = [];
      flat.forEach((c: any) => {
        const node = map.get(c.id);
        if (c.id === -1) return; // Skip system root in the UI list
        
        if (c.parentId === -1) {
          // Children of system root are top-level in our UI
          rootComptes.push(node);
        } else {
          const parent = map.get(c.parentId);
          if (parent) parent.children.push(node);
          else rootComptes.push(node); // Fallback for orphans
        }
      });
      
      setComptes(rootComptes);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchFees();
    fetchHistory();
    fetchEmployers();
    fetchComptes();
  }, []);

  const handleDeletePayment = async (id: string) => {
    const paymentId = id.replace('p-', '');
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await api.delete(`/payments/${paymentId}`);
      toast({ title: "Transaction deleted successfully" });
      fetchHistory();
      fetchDashboardData();
      fetchFees();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction"
      });
    }
  };



  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      (item.category?.toLowerCase() || "").includes(historySearch.toLowerCase()) ||
      (item.entityName?.toLowerCase() || "").includes(historySearch.toLowerCase()) ||
      (item.description?.toLowerCase() || "").includes(historySearch.toLowerCase());
    
    const matchesType = historyType === "ALL" || item.type === historyType;
    
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: number, fee: Fee) => {
    if (fee.payments && fee.payments.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete fee",
        description: "Delete payments first."
      });
      return;
    }

    try {
      await api.delete(`/fees/${id}`);
      toast({ title: "Fee deleted successfully" });
      fetchFees();
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error deleting fee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete fee"
      });
    }
  };

  const handleFormSuccess = () => {
    fetchFees();
    fetchDashboardData();
    setIsDialogOpen(false);
  };

  const handleCollectPayment = (student: StudentFeeStatus) => {
    setSelectedStudent(student);
    setPaymentAmount(student.pending.toString());
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedStudent || !paymentAmount) return;

    try {
      // For generic fees (studentId === 0), we need to handle differently
      if (selectedStudent.studentId === 0) {
        // For generic fees, create a payment without student association
        await api.post("/payments/collect-generic", {
          feeId: selectedStudent.feeId,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          date: new Date().toISOString()
        });

        toast({
          title: "Payment Successful",
          description: `Collected DA${paymentAmount} for ${selectedStudent.feeTitle}`,
        });
      } else {
        // For student-specific fees
        await api.post("/payments/collect", {
          studentId: selectedStudent.studentId,
          feeId: selectedStudent.feeId,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          date: new Date().toISOString()
        });

        toast({
          title: "Payment Successful",
          description: `Collected DA${paymentAmount} from ${selectedStudent.studentName}`,
        });
      }

      setShowPaymentModal(false);
      setPaymentAmount("");
      fetchDashboardData();
      fetchFees(); // Refresh fees list as well
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.response?.data?.message || "Could not process payment"
      });
    }
  };

  const handleDeleteCompte = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await api.delete(`/compte/${id}`);
      toast({ title: "Account deleted successfully" });
      fetchComptes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete account"
      });
    }
  };

  const handleEditCompte = (compte: any) => {
    setSelectedCompte(compte);
    setTimeout(() => {
      setCompteDialogType("update");
      setIsCompteDialogOpen(true);
    }, 0);
  };

  const handleAddSubCompte = (parentId: number) => {
    setSelectedCompte({ parentId });
    setTimeout(() => {
      setCompteDialogType("create");
      setIsCompteDialogOpen(true);
    }, 0);
  };

  // Combine student-specific fees with generic fees for Payments tab
  const allPaymentItems = React.useMemo(() => {
    const items: StudentFeeStatus[] = [...studentStatus];
    
    // Add generic fees (not assigned to students or classes)
    fees.forEach(fee => {
      if (!fee.studentId && !fee.classId) {
        const totalPaid = fee.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const pending = fee.amount - totalPaid;
        
        items.push({
          id: `generic-fee-${fee.id}`,
          studentId: 0, // 0 indicates generic fee
          studentName: "General Fee",
          class: "N/A",
          feeId: fee.id,
          feeTitle: fee.title,
          account: fee.compte?.name || "N/A",
          amount: fee.amount,
          paid: totalPaid,
          pending: pending > 0 ? pending : 0,
          status: pending <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
        });
      }
    });
    
    return items;
  }, [studentStatus, fees]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Fees & Payments</h1>
          <p className="text-muted-foreground">Manage student fees and payment records</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="manage">Manage Fees</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Income</span>
                </div>
              </div>
              <h3 className="text-foreground font-semibold text-xl mb-1">
                DA{stats?.totalCollected.toFixed(2) || "0.00"}
              </h3>
              <p className="text-muted-foreground text-sm">Total Collected</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <span className="text-sm">Expense</span>
                </div>
              </div>
              <h3 className="text-foreground font-semibold text-xl mb-1">
                DA{stats?.totalExpenses.toFixed(2) || "0.00"}
              </h3>
              <p className="text-muted-foreground text-sm">Total Expenses</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className={`text-xl font-semibold mb-1 ${stats && stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                DA{stats?.netBalance.toFixed(2) || "0.00"}
              </h3>
              <p className="text-muted-foreground text-sm">Net Balance</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h3 className="text-foreground font-semibold text-xl mb-1">
                DA{stats?.pendingFees.toFixed(2) || "0.00"}
              </h3>
              <p className="text-muted-foreground text-sm">Pending Fees</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-foreground font-semibold text-xl mb-1">{stats?.paidStudents || 0}</h3>
              <p className="text-muted-foreground text-sm">Paid Students</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-foreground font-semibold text-xl mb-1">
                DA{stats?.averageFee.toFixed(2) || "0.00"}
              </h3>
              <p className="text-muted-foreground text-sm">Average Fee</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fee Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <h2 className="text-foreground font-semibold text-lg mb-6">Fee Types</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={feeTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, amount }) => `${name} DA${amount}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {feeTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Fee Structure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-sm border border-border"
            >
              <h2 className="text-foreground font-semibold text-lg mb-4">Fee Structure</h2>
              <div className="space-y-3">
                {feeTypes.map((fee) => (
                  <div key={fee.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fee.color }}></div>
                      <span className="text-foreground font-medium">{fee.name}</span>
                    </div>
                    <span className="text-foreground font-semibold">DA{fee.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Fee Management</h2>
                  <p className="text-sm text-muted-foreground">Create and manage fees</p>
                </div>
                <Button size="sm" onClick={() => { 
                  setTimeout(() => {
                    setDialogType("fee-create"); 
                    setSelectedFee(null); 
                    setIsDialogOpen(true); 
                  }, 0);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Fee
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-muted-foreground">Loading fees...</div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No fees found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">
                              {fee.compte?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {fee.title}
                                {fee.payments && fee.payments.length > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                                    Paid
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>DA{fee.amount.toFixed(2)}</TableCell>
                            <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {fee.class ? `Class: ${fee.class.ClassName}` : fee.student ? `Student: ${fee.student.firstName} ${fee.student.lastName}` : "All"}
                            </TableCell>
                            <TableCell>{fee.description || "-"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {fee.studentId ? (
                                    <DropdownMenuItem onClick={() => {
                                      const student = studentStatus.find(s => s.studentId === fee.studentId);
                                      if (student) handleCollectPayment(student);
                                      else toast({ variant: "destructive", title: "Student not found" });
                                    }}>
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      Collect Payment
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => {
                                      setActiveTab("payments");
                                      setSelectedFeeId(fee.id);
                                      setPaymentSearch("");
                                    }}>
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      View Payments
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { 
                                    setTimeout(() => {
                                      setDialogType("fee-update"); 
                                      setSelectedFee(fee); 
                                      setIsDialogOpen(true); 
                                    }, 0);
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600" 
                                    onClick={() => handleDelete(fee.id, fee)}
                                    disabled={fee.payments && fee.payments.length > 0}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Student Payments</h2>
                  <p className="text-sm text-muted-foreground">Search students and collect payments</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search student or fee..."
                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              {selectedFeeId && (
                <div className="mb-4 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Filtering by Fee: {fees.find(f => f.id === selectedFeeId)?.title || "Unknown Fee"}
                  </span>
                  <button 
                    onClick={() => setSelectedFeeId(null)}
                    className="ml-auto p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Fee Title</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPaymentItems
                      .filter(s => {
                        const matchesSearch = 
                          s.studentName.toLowerCase().includes(paymentSearch.toLowerCase()) || 
                          s.class.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                          s.feeTitle.toLowerCase().includes(paymentSearch.toLowerCase());
                        
                        const matchesStatus = paymentStatusFilter === "ALL" || s.status === paymentStatusFilter;
                        const matchesFee = selectedFeeId ? s.feeId === selectedFeeId : true;
                        
                        return matchesSearch && matchesStatus && matchesFee;
                      })
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.studentId === 0 ? (
                              <span className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                                  General
                                </span>
                                {item.studentName}
                              </span>
                            ) : (
                              item.studentName
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs">
                              {item.class || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>{item.feeTitle}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.account}</TableCell>
                          <TableCell>DA{item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600 dark:text-green-400">DA{item.paid.toFixed(2)}</TableCell>
                          <TableCell className="text-orange-600 dark:text-orange-400">DA{item.pending.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-lg text-xs ${
                              item.status === 'Paid' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              item.status === 'Partial' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                              'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            }`}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.pending > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleCollectPayment(item)}
                              >
                                Collect
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Payment History</h2>
                  <p className="text-sm text-muted-foreground">Track all incoming and outgoing transactions</p>
                </div>
                <Button size="sm" onClick={() => { 
                  setTimeout(() => {
                    setDialogType("fee-create"); 
                    setSelectedFee({ type: 'expense' } as any); 
                    setIsDialogOpen(true); 
                  }, 0);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    value={historyType}
                    onChange={(e) => setHistoryType(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.type}
                            </span>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.entityName}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                          <TableCell className={`text-right font-semibold ${
                            item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.type === 'INCOME' ? '+' : '-'}DA{item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeletePayment(item.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Chart of Accounts</h2>
                  <p className="text-sm text-muted-foreground">Manage your school's account hierarchy</p>
                </div>
                <Button onClick={() => { setSelectedCompte(null); setCompteDialogType("create"); setIsCompteDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Root Account
                </Button>
              </div>
              
              <CompteTree 
                comptes={comptes} 
                onEdit={handleEditCompte} 
                onDelete={handleDeleteCompte} 
                onAddSub={handleAddSubCompte} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fee Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setTimeout(() => {
          setIsDialogOpen(open);
        }, 0);
      }}>
        <DialogContent className="sm:max-w-[500px]">
            <FeeForm 
              type={dialogType === "fee-create" ? "create" : "update"} 
              data={selectedFee} 
              setOpen={setIsDialogOpen} 
              onSuccess={handleFormSuccess} 
            />
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={(open) => {
        setShowPaymentModal(open);
        if (!open) setSelectedStudent(null);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <DialogTitle className="text-foreground font-semibold text-lg">Collect Payment</DialogTitle>
            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {selectedStudent && (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Student</p>
                <p className="text-foreground font-medium">{selectedStudent.studentName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Pending Amount</p>
                <p className="text-foreground font-medium">DA{selectedStudent.pending.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-foreground font-medium mb-2">Payment Amount (DA)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-foreground font-medium mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={handlePaymentSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm Payment
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CompteForm 
        open={isCompteDialogOpen} 
        onOpenChange={setIsCompteDialogOpen} 
        type={compteDialogType} 
        data={selectedCompte} 
        onSuccess={fetchComptes} 
        hideButton 
      />
    </div>
  );
}
