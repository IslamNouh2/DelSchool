"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  School,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminStats {
  mrr: number;
  totalTenants: number;
  activeSubscriptions: number;
  expiredCount: number;
}

export default function SaaSAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/subscriptions/admin/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const cards = [
    {
      title: "Monthly Recurring Revenue",
      value: `${stats?.mrr.toLocaleString()} DZD`,
      icon: TrendingUp,
      desc: "Estimated MRR based on active plans",
      color: "from-blue-600/20 to-indigo-600/20",
      border: "border-blue-500/20",
      iconColor: "text-blue-400"
    },
    {
      title: "Active Schools",
      value: stats?.totalTenants.toString() || "0",
      icon: School,
      desc: "Total registered school instances",
      color: "from-emerald-600/20 to-teal-600/20",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400"
    },
    {
      title: "Active Subscriptions",
      value: stats?.activeSubscriptions.toString() || "0",
      icon: CreditCard,
      desc: "Currently active paid/trial plans",
      color: "from-purple-600/20 to-pink-600/20",
      border: "border-purple-500/20",
      iconColor: "text-purple-400"
    },
    {
      title: "Expired Subscriptions",
      value: stats?.expiredCount.toString() || "0",
      icon: AlertTriangle,
      desc: "Schools pending renewal",
      color: "from-orange-600/20 to-red-600/20",
      border: "border-orange-500/20",
      iconColor: "text-orange-400"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Executive Overview</h2>
          <p className="text-gray-400 mt-1">Platform-wide subscription metrics and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-6 shadow-lg shadow-blue-500/20">
            <BarChart3 className="mr-2 h-5 w-5" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${card.color} ${card.border} border backdrop-blur-xl rounded-3xl overflow-hidden group transition-all duration-300 hover:scale-[1.02]`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-black/40 ${card.iconColor}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <ArrowUpRight className="text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                {card.value}
              </div>
              <div className="text-sm font-medium text-white/70">
                {card.title}
              </div>
              <p className="text-xs text-white/40 mt-3 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {card.desc}
              </p>
            </CardContent>
            {/* Background Glow */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-current rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${card.iconColor}`}></div>
          </Card>
        ))}
      </div>

      {/* Main Analysis Section (Placeholder for Charts or Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#0d0f1a] border-white/5 rounded-3xl p-8 min-h-[400px] flex flex-col justify-center items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4">
            <TrendingUp className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-bold text-white">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-400 max-w-sm">
            We&apos;re building comprehensive growth charts and churn analysis tools to help you optimize platform performance.
          </p>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-xl">
            Request Custom Report
          </Button>
        </Card>

        <Card className="bg-[#0d0f1a] border-white/5 rounded-3xl p-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-white text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Database Connection</span>
                <span className="text-emerald-400 font-bold">Stable</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[98%] shadow-[0_0_10px_#10b981]"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Subscription Engine</span>
                <span className="text-emerald-400 font-bold">Operational</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%] shadow-[0_0_10px_#10b981]"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Email Gateway</span>
                <span className="text-blue-400 font-bold">Active</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[95%] shadow-[0_0_10px_#3b82f6]"></div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                <div className="flex gap-3">
                  <BarChart3 className="text-blue-400 h-6 w-6 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Daily Snapshots</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Platform snapshots are taken automatically every 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
