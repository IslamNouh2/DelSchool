export async function checkSubscription(token: string) {
  try {
    const raw = process.env.NEXT_PUBLIC_API_URL || '';
    const API_URL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;

    const res = await fetch(`${API_URL}/subscriptions/check`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return { blocked: false };
    }

    if (res.status === 403) {
      const data = await res.json();
      return {
        blocked: true,
        reason: data.reason,
        tenantName: data.tenantName,
        endDate: data.endDate,
      };
    }

    return { blocked: false };
  } catch (error) {
    console.error('Subscription check error:', error);
    return { blocked: false }; // Fail open
  }
}
