"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  CreditCard, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  Settings2,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Subscription {
  id: string;
  tenantId: string;
  plan: string;
  billingPeriod: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  tenant: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions/admin/tenants");
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Failed to fetch subscriptions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg px-3 py-1 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
      case "TRIAL":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-lg px-3 py-1 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Trial</Badge>;
      case "EXPIRED":
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 rounded-lg px-3 py-1 flex items-center gap-1.5"><XCircle className="h-3 w-3" /> Expired</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 rounded-lg px-3 py-1 flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Suspended</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 rounded-lg px-3 py-1">{status}</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.tenant.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Tenant Subscriptions</h2>
          <p className="text-gray-400 text-sm mt-1">Global management of billing cycles and service availability.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search schools..." 
              className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-xl px-4">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Tables Card */}
      <div className="bg-[#0d0f1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-gray-400 font-bold py-5 pl-8">School / Tenant</TableHead>
              <TableHead className="text-gray-400 font-bold">Plan</TableHead>
              <TableHead className="text-gray-400 font-bold">Billing</TableHead>
              <TableHead className="text-gray-400 font-bold">Status</TableHead>
              <TableHead className="text-gray-400 font-bold">Expiry Date</TableHead>
              <TableHead className="text-gray-400 font-bold text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell className="py-8 pl-8"><div className="h-4 w-32 bg-white/5 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-20 bg-white/5 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-20 bg-white/5 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-24 bg-white/5 animate-pulse rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-28 bg-white/5 animate-pulse rounded"></div></TableCell>
                  <TableCell className="text-right pr-8"><div className="h-8 w-8 bg-white/5 animate-pulse rounded ml-auto"></div></TableCell>
                </TableRow>
              ))
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-10 w-10 text-gray-600" />
                    <p>No tenant subscriptions found matching your search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.map((sub) => (
              <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="py-6 pl-8">
                  <div className="flex flex-col">
                    <span className="text-white font-bold group-hover:text-blue-400 transition-colors">{sub.tenant.name}</span>
                    <span className="text-xs text-gray-500 font-mono">ID: {sub.tenant.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-500/5 text-blue-300 border-blue-500/20 font-bold uppercase tracking-wider text-[10px] rounded-md">
                    {sub.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-400 font-medium">{sub.billingPeriod}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(sub.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-3.5 w-3.5 text-gray-600" />
                    {new Date(sub.endDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-xl">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1c2e] border-white/10 text-white w-56 p-2 rounded-2xl shadow-2xl">
                      <DropdownMenuLabel className="text-gray-400 text-xs px-3">Management Options</DropdownMenuLabel>
                      <DropdownMenuItem className="focus:bg-blue-600 focus:text-white rounded-xl cursor-pointer py-2.5">
                        <Settings2 className="mr-2 h-4 w-4" /> Edit Subscription
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-blue-600 focus:text-white rounded-xl cursor-pointer py-2.5">
                        <CreditCard className="mr-2 h-4 w-4" /> Change Billing
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem className="text-rose-400 focus:bg-rose-500/20 focus:text-rose-400 rounded-xl cursor-pointer py-2.5">
                        <ShieldAlert className="mr-2 h-4 w-4" /> Suspend School
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem className="focus:bg-white/10 rounded-xl cursor-pointer py-2.5 text-gray-400">
                        <ExternalLink className="mr-2 h-4 w-4" /> Access Tenant Dashboard
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* History Log / Activity Feed Mini-Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 rounded-3xl p-6">
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Recent Platform Activity
          </h4>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">New school <strong>Alpha Academy</strong> started a PRO trial.</p>
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">2 hours ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
