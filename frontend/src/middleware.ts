import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
import { checkSubscription } from './lib/subscription-check';

const PROTECTED_PATTERN = /^\/(?:[a-z]{2}\/)?(?:dashboard|list|report-card|admin)(?:\/.*)?$/;
const PUBLIC_PATTERN = /^\/(?:[a-z]{2}\/)?(?:login|register|_next|api|favicon)(?:\/.*)?$/;

const ROLE_DASHBOARD_MAP: Record<string, string> = {
    ADMIN: 'admin',
    TEACHER: 'teachers',
    STUDENT: 'student',
    FINANCE: 'finance',
    SAAS_OWNER: 'saas-owner',
};

const LANDING_PAGE_PATTERN = /^\/(?:[a-z]{2})?\/?$/;

export async function middleware(request: NextRequest) {
    const start = performance.now();
    const pathname = request.nextUrl.pathname;
    const locale = pathname.split('/')[1] || 'en';
    const redirectLocale = routing.locales.includes(locale as any) ? locale : 'en';

    // تجاهل الروتات الخاصة بـ Next.js والـ Favicon والملفات الثابتة
    if (pathname.includes('/_next') || pathname.includes('/favicon.ico') || pathname.includes('/api/')) {
        return intlMiddleware(request);
    }

    // 1. Redirection Logic for Landing Page (Auto-redirect authenticated users to dashboard)
    if (LANDING_PAGE_PATTERN.test(pathname)) {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        const isBlocked = request.nextUrl.searchParams.get('blocked') === 'true';

        console.log(`[Middleware] [DEBUG] Path: ${pathname} matches LANDING_PAGE_PATTERN.`);
        
        // 🔥 If already blocked by subscription, DO NOT redirect back to dashboard (prevents loop)
        if (isBlocked) {
            console.log('[Middleware] User is blocked by subscription. Staying on landing page.');
            return intlMiddleware(request);
        }

        if (accessToken) {
            try {
                const payload: any = await verifyToken(accessToken);
                console.log(`[Middleware] [DEBUG] verifyToken success. Role: ${payload?.role}`);
                
                if (payload?.role) {
                    const target = ROLE_DASHBOARD_MAP[payload.role] || 'student';
                    const redirectUrl = new URL(`/${redirectLocale}/${target}`, request.url);
                    console.log(`[Middleware] [REDIRECTING] To: ${redirectUrl.toString()}`);
                    return NextResponse.redirect(redirectUrl);
                }
            } catch (e: any) {
                console.error(`[Middleware] [DEBUG] verifyToken error:`, e.message || e);
            }
        }
    }

    // تجاهل الروتات العامة
    if (PUBLIC_PATTERN.test(pathname)) {
        const result = intlMiddleware(request);
        const duration = performance.now() - start;
        if (duration > 500) {
            console.warn(`[Middleware] [PERF] PUBLIC_PATTERN check for ${pathname} took ${duration.toFixed(2)}ms`);
        }
        return result;
    }

    // تحقق من الروتات المحمية
    if (PROTECTED_PATTERN.test(pathname)) {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;

        // --- DIAGNOSTIC LOGGING ---
        console.log(`[Middleware] [${new Date().toISOString()}] Checking path: ${pathname}`);

        if (!accessToken && !refreshToken) {
            console.log('[Middleware] Redirecting to login: No tokens found.');
            return NextResponse.redirect(new URL(`/${redirectLocale}/login`, request.url));
        }

        if (accessToken) {
            console.log(`[Middleware] [DEBUG] accessToken found. Length: ${accessToken.length}. Starts with: ${accessToken.substring(0, 10)}...`);
            try {
                const verifyStart = performance.now();
                const payload: any = await verifyToken(accessToken);
                const verifyDuration = performance.now() - verifyStart;
                
                console.log(`[Middleware] [DEBUG] verifyToken result: ${payload ? 'VALID' : 'INVALID/EXPIRED'}`);
                if (payload) {
                    console.log(`[Middleware] [DEBUG] Payload Role: ${payload.role}, TenantId: ${payload.tenantId}, Sub: ${payload.sub}`);
                }
                
                if (verifyDuration > 100) {
                    console.warn(`[Middleware] [PERF] verifyToken took ${verifyDuration.toFixed(2)}ms`);
                }
                
                // --- Optimized Subscription Check ---
                let subResult = null; 

                if (!subResult) {
                    const subCheckStart = performance.now();
                    subResult = await checkSubscription(accessToken);
                    const subCheckDuration = performance.now() - subCheckStart;

                    if (subCheckDuration > 500) {
                        console.warn(`[Middleware] [PERF] checkSubscription (FETCH) took ${subCheckDuration.toFixed(2)}ms`);
                    }
                }

                if (subResult?.blocked) {
                    const params = new URLSearchParams();
                    params.set('blocked', 'true');
                    if (subResult.reason) params.set('reason', subResult.reason);
                    if (subResult.tenantName) params.set('tenantName', subResult.tenantName);
                    if (subResult.endDate) params.set('endDate', subResult.endDate);
                    
                    // 🔥 AUTH ROLE CHECK: Only admins go to the /blocked page (which has the renew button)
                    const role = payload?.role;
                    const isAdmin = role === 'ADMIN';
                    
                    console.log(`[Middleware] [BLOCKED_CHECK] Path: ${pathname}`);
                    console.log(`[Middleware] [BLOCKED_CHECK] Payload Role: ${role}`);
                    console.log(`[Middleware] [BLOCKED_CHECK] isAdmin: ${isAdmin}`);
                    
                    // Construct target: /[locale]/blocked for admin, /[locale] for others
                    const targetPath = isAdmin ? 'blocked' : '';
                    const redirectUrl = new URL(`/${redirectLocale}/${targetPath}`, request.url);
                    
                    // Transfer all params
                    params.forEach((value, key) => {
                        console.log(`[Middleware] [BLOCKED_CHECK] Setting param: ${key}=${value}`);
                        redirectUrl.searchParams.set(key, value);
                    });
                    
                    console.log(`[Middleware] [REDIRECTING_BLOCKED] To: ${redirectUrl.toString()}`);
                    return NextResponse.redirect(redirectUrl);
                }

                if (payload?.role) {
                    const duration = performance.now() - start;

                    if (duration > 500) {
                        console.warn(
                            `[Middleware] [PERF] PROTECTED access GRANTED for ${pathname} in ${duration.toFixed(2)}ms`
                        );
                    }

                    return intlMiddleware(request);

                } else {
                    console.log('[Middleware] Token payload missing role.');
                    return new Response('Unauthorized', { status: 401 });
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

    const finalResult = intlMiddleware(request);
    const totalDuration = performance.now() - start;
    if (totalDuration > 500) {
        console.warn(`[Middleware] [PERF] Total middleware for ${pathname} took ${totalDuration.toFixed(2)}ms`);
    }
    return finalResult;
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