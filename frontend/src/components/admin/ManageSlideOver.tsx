'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PLAN_PRICES, Plan, BillingPeriod } from '@/lib/pricing.constants';

interface ManageSlideOverProps {
  tenantId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ManageSlideOver({ tenantId, onClose, onUpdated }: ManageSlideOverProps) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const [form, setForm] = useState({
    plan: 'STARTER',
    billingPeriod: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    autoRenew: true,
  });

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${tenantId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch tenant data');
      const data = await res.json();
      setTenant(data);
      
      const sub = data.subscriptions?.[0] || {};
      setForm({
        plan: sub.plan || 'STARTER',
        billingPeriod: sub.billingPeriod || 'MONTHLY',
        startDate: sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: sub.status || 'ACTIVE',
        autoRenew: sub.autoRenew ?? true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchTenant();
    } else {
      setTenant(null);
      setError('');
      setConfirmSuspend(false);
    }
  }, [tenantId, fetchTenant]);

  const handleApplyChanges = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Update failed');
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${tenantId}/renew`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Renewal failed');
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${tenantId}/suspend`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Suspension failed');
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!tenantId) return null;

  const currentSub = tenant?.subscriptions?.[0];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Panel */}
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Manage Subscription</h2>
            <p className="text-sm text-gray-500">{tenant?.name || 'Loading...'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 font-bold">X</button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="animate-spin border-2 border-gray-300 border-t-gray-900 rounded-full w-8 h-8 mb-4" />
            <p className="text-sm text-gray-500">Loading school details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Section A: Current */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Subscription</h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div>
                  <p className="text-gray-500 text-[11px]">Plan</p>
                  <p className="font-medium">{currentSub?.plan || 'None'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px]">Status</p>
                  <p className="font-medium text-blue-600">{currentSub?.status || 'None'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px]">Ends</p>
                  <p className="font-medium">{currentSub?.endDate ? new Date(currentSub.endDate).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px]">Auto</p>
                  <p className="font-medium">{currentSub?.autoRenew ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </section>

            {/* Section B: Change Form */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Update Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Plan</label>
                  <select 
                    value={form.plan} 
                    onChange={e => setForm({...form, plan: e.target.value})}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Billing Period</label>
                  <div className="flex gap-2">
                    {['MONTHLY', 'QUARTERLY', 'YEARLY'].map(p => (
                      <button
                        key={p}
                        onClick={() => setForm({...form, billingPeriod: p})}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.billingPeriod === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Preview */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                  {(['MONTHLY','QUARTERLY','YEARLY'] as const).map(p => (
                    <span key={p} className={form.billingPeriod === p ? 'font-medium text-[11px] text-blue-800' : 'text-blue-400 text-[11px]'}>
                      {p}: {PLAN_PRICES[form.plan as Plan][p].toLocaleString()} DZD
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">New Status</label>
                    <select 
                      value={form.status} 
                      onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="TRIAL">TRIAL</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block whitespace-nowrap overflow-hidden">Start Date</label>
                    <input 
                      type="date" 
                      value={form.startDate}
                      onChange={e => setForm({...form, startDate: e.target.value})}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="autoRenew" 
                    checked={form.autoRenew} 
                    onChange={e => setForm({...form, autoRenew: e.target.checked})}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-0"
                  />
                  <label htmlFor="autoRenew" className="text-sm text-gray-700">Auto-renew subscription</label>
                </div>

                <button
                  onClick={handleApplyChanges}
                  disabled={saving}
                  className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <div className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" />}
                  Apply changes
                </button>
              </div>
            </section>

            {/* Section C: Quick Actions */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRenew}
                  disabled={saving}
                  className="py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <div className="animate-spin border-2 border-gray-300 border-t-gray-900 rounded-full w-4 h-4" />}
                  Renew Now
                </button>

                {!confirmSuspend ? (
                  <button
                    onClick={() => setConfirmSuspend(true)}
                    className="py-2 border border-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Suspend
                  </button>
                ) : (
                  <div className="col-span-1 flex items-center gap-2">
                    <button
                      onClick={handleSuspend}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmSuspend(false)}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </section>

            {/* Section D: History */}
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Billing History</h3>
              <div className="space-y-1">
                {(tenant?.subscriptions?.[0]?.history || []).sort((a: any, b: any) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 text-[13px]">
                    <span className="text-gray-400 text-[11px] w-20 shrink-0">{new Date(h.changedAt).toLocaleDateString()}</span>
                    <span className="flex-1 text-gray-700 font-normal">{h.event}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-medium">{h.plan}</span>
                  </div>
                ))}
                {(!tenant?.subscriptions?.[0]?.history?.length) && <p className="text-xs text-gray-400 italic">No history recorded.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
