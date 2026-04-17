'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ManageSlideOver from './ManageSlideOver';

type Subscription = {
  plan: string;
  billingPeriod: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  autoRenew: boolean;
};

type Tenant = {
  id: string;
  name: string;
  domain: string;
  subscriptions: Subscription[];
};

export default function TenantsTable() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plan: '',
    billingPeriod: '',
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout|null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const { search, status, plan, billingPeriod } = filters;
      const query = new URLSearchParams({
        search,
        status,
        plan,
        billingPeriod,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants?${query.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTenants(data);
    } catch (err) {
      console.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: val }));
      setPage(1);
    }, 300);
  };

  const daysLeft = (endDate: string) => {
    return Math.round((new Date(endDate).getTime() - Date.now()) / 86400000);
  };

  const periodDays = (period: string) => {
    return period === 'MONTHLY' ? 30 : period === 'QUARTERLY' ? 90 : 365;
  };

  const barColor = (pct: number) => {
    return pct > 40 ? 'bg-green-500' : pct > 15 ? 'bg-amber-400' : 'bg-red-500';
  };

  const textColor = (pct: number) => {
    return pct > 40 ? 'text-green-600' : pct > 15 ? 'text-amber-600' : 'text-red-600';
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Domain', 'Plan', 'Period', 'Start', 'End', 'Status', 'Price/yr DZD'];
    const rows = tenants.map(t => {
      const s = t.subscriptions[0] || {};
      return [t.id, t.name, t.domain, s.plan, s.billingPeriod, s.startDate, s.endDate, s.status, s.price];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'delschool-tenants.csv';
    a.click();
  };

  const paginatedTenants = tenants.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(tenants.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-amber-100 text-amber-800',
      EXPIRED: 'bg-gray-100 text-gray-600',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${classes[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const getPlanBadge = (plan: string) => {
    const classes: Record<string, string> = {
      STARTER: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-teal-100 text-teal-800',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${classes[plan] || 'bg-gray-100'}`}>{plan}</span>;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* TOOLBAR */}
      <div className="p-4 border-b border-gray-50 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            type="text"
            placeholder="Search school, domain, ID..."
            onChange={handleSearchChange}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg w-full max-w-xs outline-none focus:ring-1 focus:ring-gray-300"
          />
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <select
            value={filters.plan}
            onChange={e => setFilters(prev => ({ ...prev, plan: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg outline-none"
          >
            <option value="">All Plans</option>
            <option value="STARTER">STARTER</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <select
            value={filters.billingPeriod}
            onChange={e => setFilters(prev => ({ ...prev, billingPeriod: e.target.value }))}
            className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg outline-none"
          >
            <option value="">All Periods</option>
            <option value="MONTHLY">MONTHLY</option>
            <option value="QUARTERLY">QUARTERLY</option>
            <option value="YEARLY">YEARLY</option>
          </select>
        </div>
        <button
          onClick={exportCSV}
          className="text-sm px-4 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 text-left text-gray-400 font-medium">
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Tenant ID</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Days left</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Price/yr</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Loading tenants...</td></tr>
            ) : paginatedTenants.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">No tenants found</td></tr>
            ) : (
              paginatedTenants.map(tenant => {
                const sub = tenant.subscriptions[0] || {};
                const dl = sub.endDate ? daysLeft(sub.endDate) : 0;
                const totalDays = sub.billingPeriod ? periodDays(sub.billingPeriod) : 365;
                const pct = Math.max(0, Math.min(100, Math.round((dl / totalDays) * 100)));

                return (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 truncate">
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-xs text-gray-500">{tenant.domain}.delschool.dz</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400 truncate">{tenant.id}</td>
                    <td className="px-4 py-3">{getPlanBadge(sub.plan)}</td>
                    <td className="px-4 py-3 text-gray-600 text-[13px]">{sub.billingPeriod || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-[13px]">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-[13px]">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      {sub.endDate && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-[11px] font-medium ${textColor(pct)}`}>
                            {dl < 0 ? `${Math.abs(dl)}d ago` : `${dl}d`}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium text-[13px]">{sub.price?.toLocaleString()} DZD</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedTenantId(tenant.id)}
                        className="text-gray-400 hover:text-gray-900 font-medium text-[13px] transition-colors"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="p-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {Math.min(tenants.length, (page - 1) * itemsPerPage + 1)}–{Math.min(tenants.length, page * itemsPerPage)} of {tenants.length}
        </div>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* SLIDE OVER */}
      <ManageSlideOver
        tenantId={selectedTenantId}
        onClose={() => setSelectedTenantId(null)}
        onUpdated={() => {
          setSelectedTenantId(null);
          fetchTenants();
        }}
      />
    </div>
  );
}
