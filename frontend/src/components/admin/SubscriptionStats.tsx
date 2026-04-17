'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

type Stats = {
  total: number;
  active: number;
  trial: number;
  expiringIn30Days: number;
  expired: number;
  estimatedMRR: number;
};

export default function SubscriptionStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/subscriptions/stats');
        setStats(res.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-red-500 text-sm">Failed to load stats. Please refresh.</p>;
  }

  const items = [
    { label: 'Total schools', value: stats.total, colorClass: 'text-gray-900' },
    { label: 'Active', value: stats.active, colorClass: 'text-gray-900' },
    { label: 'Trial', value: stats.trial, colorClass: 'text-gray-900' },
    { label: 'Expiring in 30 days', value: stats.expiringIn30Days, colorClass: stats.expiringIn30Days > 0 ? 'text-amber-500' : 'text-gray-900' },
    { label: 'Expired', value: stats.expired, colorClass: stats.expired > 0 ? 'text-red-500' : 'text-gray-900' },
    { label: 'Est. MRR', value: `${stats.estimatedMRR.toLocaleString('fr-DZ')} DZD`, colorClass: 'text-gray-900' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
          <p className={`text-xl font-medium ${item.colorClass}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
