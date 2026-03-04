"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  RefreshCw, 
  ShieldAlert, 
  TrendingDown, 
  Zap 
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface RiskData {
  studentId: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
  lastCalculatedAt?: string;
}

export default function AiRiskCard({ studentId }: { studentId: number }) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchRisk = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ai/risk/${studentId}`);
      setData(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Not found is fine, means it hasn't been calculated yet
        setData(null);
      } else {
        console.error("Error fetching risk data:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateRisk = async () => {
    try {
      setCalculating(true);
      const response = await api.post(`/ai/risk/${studentId}`);
      setData(response.data);
      toast.success("AI Analysis updated successfully");
    } catch (error: any) {
      console.error("Error calculating risk:", error);
      toast.error("Failed to run AI analysis. Ensure the ML service is active.");
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchRisk();
  }, [studentId]);

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "LOW": return "text-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-500/10";
      case "MEDIUM": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-yellow-500/10";
      case "HIGH": return "text-red-500 bg-red-50 dark:bg-red-900/20 shadow-red-500/10";
      default: return "text-gray-500 bg-gray-50 dark:bg-slate-800 shadow-gray-500/10";
    }
  };

  const getRiskIcon = (level?: string) => {
    switch (level) {
      case "LOW": return <CheckCircle className="w-6 h-6" />;
      case "MEDIUM": return <AlertTriangle className="w-6 h-6" />;
      case "HIGH": return <ShieldAlert className="w-6 h-6" />;
      default: return <Info className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[20px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded-full mb-6"></div>
        <div className="h-24 bg-gray-100 dark:bg-slate-800/50 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-[20px] -z-10 group-hover:opacity-100 transition-opacity opacity-0"></div>
      
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Zap className="w-5 h-5 text-blue-500 fill-blue-500/20" />
              AI Risk Analysis
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={calculateRisk}
              disabled={calculating}
              className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {!data ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4 text-center"
              >
                <div className="inline-flex p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 mb-4 text-gray-400">
                  <TrendingDown className="w-8 h-8" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">No calculation history</p>
                <Button 
                  onClick={calculateRisk} 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-500/20"
                >
                  Start First Scan
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Risk Level Gauge Area */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-white dark:border-white/5">
                  <div className={`p-3 rounded-xl shadow-lg ${getRiskColor(data.riskLevel)}`}>
                    {getRiskIcon(data.riskLevel)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getRiskColor(data.riskLevel)}`}>
                        {data.riskLevel} RISK
                      </span>
                    </div>
                    <p className="text-lg font-black text-gray-900 dark:text-white">
                      {data.riskLevel === 'LOW' && 'On Track'}
                      {data.riskLevel === 'MEDIUM' && 'Watch Closely'}
                      {data.riskLevel === 'HIGH' && 'Critical Priority'}
                    </p>
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="relative group/rec">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover/rec:opacity-100 transition duration-500"></div>
                  <div className="relative p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-blue-500 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      AI Recommendation
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      {data.recommendation}
                    </p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 px-2">
                  <span className="flex items-center gap-1 italic">
                    <Info className="w-3 h-3" />
                    Powered by Islam AI Engine
                  </span>
                  {data.lastCalculatedAt && (
                    <span>Last updated: {new Date(data.lastCalculatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
