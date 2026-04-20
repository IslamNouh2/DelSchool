import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwtPayload } from '@/lib/jwt-decode';
import SubscriptionStats from '@/components/admin/SubscriptionStats';
import TenantsTable from '@/components/admin/TenantsTable';

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) redirect(`/${locale}/auth/login`);

  const payload = decodeJwtPayload(token);
  // Manual check of role from the decoded payload
  if (!payload || payload.role !== 'SUPER_ADMIN') {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-gray-900 leading-none">Subscription management</h1>
        <p className="text-sm text-gray-500">Manage school plans, billing periods and renewals</p>
      </div>
      
      <SubscriptionStats />
      
      <TenantsTable />
    </div>
  );
}
