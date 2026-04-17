import React from 'react';

interface BlockedPageProps {
  params: { locale: string };
  searchParams: { reason?: string; tenantName?: string; endDate?: string };
}

export default function BlockedPage({ params, searchParams }: BlockedPageProps) {
  const { reason, tenantName, endDate } = searchParams;
  const { locale } = params;

  const getMessage = () => {
    switch (reason) {
      case 'EXPIRED':
        return 'Your subscription has expired. Renew to restore access.';
      case 'SUSPENDED':
        return 'Your account has been suspended. Contact your administrator.';
      case 'NO_SUBSCRIPTION':
        return 'No active subscription found. Please contact support.';
      default:
        return 'Access restricted. Please contact support.';
    }
  };

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* 1. Inline SVG lock icon */}
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>

      {/* 2. School name */}
      <h1 className="text-2xl font-medium text-gray-900 mt-6">{tenantName || 'Your school'}</h1>

      {/* 3. Reason message */}
      <p className="text-gray-500 text-base mt-2 text-center max-w-sm">
        {getMessage()}
      </p>

      {/* 4. Expiry info */}
      {reason === 'EXPIRED' && endDate && (
        <p className="text-sm text-red-500 mt-1">Expired on: {new Date(endDate).toLocaleDateString()}</p>
      )}

      {/* 5. Buttons */}
      <div className="flex gap-3 mt-8">
        <a 
          href="mailto:support@delschool.dz" 
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          Contact support
        </a>
        <a 
          href={`/${locale}/auth/login`} 
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700"
        >
          Go to login
        </a>
      </div>
    </div>
  );
}
