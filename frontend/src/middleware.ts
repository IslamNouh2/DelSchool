import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERN = /^\/(?:[a-z]{2}\/)?(?:dashboard|list|report-card|admin)(?:\/.*)?$/;
const PUBLIC_PATTERN = /^\/(?:[a-z]{2}\/)?(?:login|register|_next|api|favicon)(?:\/.*)?$/;

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // تجاهل الروتات العامة
    if (PUBLIC_PATTERN.test(pathname)) {
        return intlMiddleware(request);
    }

    // تحقق من الروتات المحمية
    if (PROTECTED_PATTERN.test(pathname)) {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;

        // --- DIAGNOSTIC LOGGING ---
        console.log(`[Middleware] [${new Date().toISOString()}] Checking path: ${pathname}`);
        console.log(`[Middleware] accessToken: ${accessToken ? 'PRESENT' : 'MISSING'}`);
        console.log(`[Middleware] refreshToken: ${refreshToken ? 'PRESENT' : 'MISSING'}`);
        console.log(`[Middleware] JWT_ACCESS_SECRET state: ${process.env.JWT_ACCESS_SECRET ? 'DEFINED (Length: ' + process.env.JWT_ACCESS_SECRET.length + ')' : 'UNDEFINED'}`);

        const locale = pathname.split('/')[1];
        const redirectLocale = routing.locales.includes(locale as any) ? locale : 'en';

        if (!accessToken && !refreshToken) {
            console.log('[Middleware] Redirecting to login: No tokens found.');
            return NextResponse.redirect(new URL(`/${redirectLocale}/login`, request.url));
        }

        if (accessToken) {
            try {
                const payload: any = await verifyToken(accessToken);
                
                // --- Subscription Check ---
                // Skip check for paths that shouldn't be blocked (auth, blocked itself, etc.)
                const isBlockedPath = pathname.includes('/blocked');
                
                if (payload?.tenantId && !isBlockedPath) {
                    try {
                        const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${payload.tenantId}`, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        });

                        if (apiRes.status === 403) {
                            const data = await apiRes.json();
                            if (data.blocked) {
                                console.log(`[Middleware] Subscription BLOCKED: ${data.reason}. Redirecting.`);
                                return NextResponse.redirect(new URL(`/${redirectLocale}/blocked?reason=${data.reason}`, request.url));
                            }
                        }
                    } catch (fetchError) {
                        console.error('[Middleware] Subscription check failed:', fetchError);
                        // If backend is down, we usually allow progress to avoid total outage
                    }
                }

                if (payload?.role) {
                    console.log(`[Middleware] Access GRANTED. Role: ${payload.role}`);
                    return intlMiddleware(request);
                } else {
                    console.log('[Middleware] Token payload missing role.');
                }
            } catch (e: any) {
                console.error('[Middleware] Token Verification ERROR:', e.message || e);
            }
        }

        if (refreshToken) {
            console.log('[Middleware] accessToken failed/missing but refreshToken present. Passing to backend.');
            return intlMiddleware(request);
        }

        console.log('[Middleware] Fallback: Redirecting to login.');
        return NextResponse.redirect(new URL(`/${redirectLocale}/login`, request.url));
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: [
        '/',
        '/(ar|en|fr)/:path*',
        '/dashboard/:path*',
        '/list/:path*',
        '/admin/:path*',
        '/report-card/:path*',
    ],
};