export async function checkSubscription(token: string) {
  try {
    const raw = process.env.NEXT_PUBLIC_API_URL || '';
    const API_URL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;

    console.log(`[SubscriptionCheck] [DEBUG] Calling: ${API_URL}/subscriptions/block-status`);
    const res = await fetch(`${API_URL}/subscriptions/block-status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 }
    });

    console.log(`[SubscriptionCheck] [DEBUG] Status: ${res.status}`);
    if (res.ok || res.status === 403) {
      const data = await res.json();
      console.log(`[SubscriptionCheck] [DEBUG] Blocked from server: ${data.blocked}`);
      return {
        blocked: data.blocked ?? false,
        reason: data.reason,
        tenantName: data.tenantName,
        endDate: data.endDate,
      };
    }

    return { blocked: false };
  } catch (error: any) {
    console.error('[SubscriptionCheck] [ERROR]:', error.message || error);
    return { blocked: false }; // Fail open
  }
}
