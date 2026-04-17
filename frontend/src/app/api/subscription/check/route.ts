import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ blocked: false });
  }

  try {
    const raw = process.env.NEXT_PUBLIC_API_URL || '';
    const API_URL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;

    const res = await fetch(
      `${API_URL}/subscriptions/check`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ blocked: false });
  }
}
