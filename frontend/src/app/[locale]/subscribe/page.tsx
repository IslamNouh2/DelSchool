'use client';

import React, { useState, use } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Crown,
  Loader2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tenantId?: string }>;
}

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    icon: <Zap className="w-6 h-6 text-indigo-500" />,
    price: { MONTHLY: 3000, QUARTERLY: 8500, YEARLY: 30000 },
    features: ['Up to 100 students', 'Basic Reporting', 'Attendance Tracking', 'Email Support'],
    color: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-100 dark:border-indigo-500/20'
  },
  {
    id: 'PRO',
    name: 'Professional',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
    price: { MONTHLY: 7000, QUARTERLY: 19500, YEARLY: 72000 },
    features: ['Unlimited students', 'Advanced Analytics', 'Financial Management', 'Priority Support', 'Mobile App Access'],
    color: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    popular: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    icon: <Crown className="w-6 h-6 text-amber-500" />,
    price: { MONTHLY: 15000, QUARTERLY: 42000, YEARLY: 150000 },
    features: ['Multi-campus support', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'On-site Training'],
    color: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-100 dark:border-amber-500/20'
  }
];

export default function SubscribePage({ params, searchParams }: PageProps) {
  const { locale } = use(params);
  const { tenantId: queryTenantId } = use(searchParams);
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    setError(null);
    try {
      let tenantId = queryTenantId;

      if (!tenantId) {
        // In a real app, you would get the tenantId from the session/token payload
        // We'll fetch the current user first or use a known endpoint
        const meRes = await axios.get('/api/auth/me');
        tenantId = meRes.data.user.tenantId;
      }

      await axios.post(`/api/subscriptions/${tenantId}`, {
        tenantId,
        plan: planId,
        billingPeriod: billingPeriod,
        startDate: new Date().toISOString(),
        autoRenew: true
      });

      setSuccess(true);
      // Wait a bit then redirect back to dashboard
      setTimeout(() => {
        router.push(`/${locale}/admin`);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Subscription failed:', err);
      setError(err.response?.data?.message || 'Failed to create subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription Active!</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Thank you for renewing. Your school access has been restored. Redirecting you to the dashboard...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-20 selection:bg-indigo-100">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Get back to managing your school with our premium tools. Select the plan that fits your needs.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1">
            {(['MONTHLY', 'QUARTERLY', 'YEARLY'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billingPeriod === period
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {period.charAt(0) + period.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 pt-8">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-8 rounded-3xl bg-white dark:bg-slate-900 border ${
                plan.popular ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10' : 'border-slate-200 dark:border-slate-800'
              } flex flex-col h-full group transition-all hover:translate-y-[-4px]`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full tracking-wider uppercase">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl ${plan.color} flex items-center justify-center border ${plan.border}`}>
                  {plan.icon}
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {plan.price[billingPeriod].toLocaleString()}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">DZD/{billingPeriod.toLowerCase().slice(0, -2)}</span>
                  </div>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Button 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full h-12 rounded-2xl text-lg font-bold transition-all shadow-lg ${
                    plan.popular 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25' 
                      : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ms-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Footer */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center border-t border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Secure Payment</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Instant Activation</span>
          </div>
          <div className="flex flex-col items-center gap-2 col-span-2 sm:col-span-1">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
