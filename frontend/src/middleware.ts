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

        // debug مؤقت - احذفه بعد الحل
        console.log('[Middleware] PATH:', pathname);
        console.log('[Middleware] accessToken exists:', !!accessToken);
        console.log('[Middleware] JWT_SECRET exists:', !!process.env.JWT_ACCESS_SECRET);

        const locale = pathname.split('/')[1];
        const redirectLocale = routing.locales.includes(locale as any) ? locale : 'en';

        if (!accessToken && !refreshToken) {
            return NextResponse.redirect(new URL(`/${redirectLocale}/login`, request.url));
        }

        if (accessToken) {
            try {
                const payload = await verifyToken(accessToken);
                if (payload?.role) {
                    return intlMiddleware(request); // ✅ توكن صحيح
                }
            } catch (e) {
                console.error('[Middleware] verifyToken error:', e);
            }
        }

        // accessToken فاشل لكن refreshToken موجود → خلي الباكند يتعامل معاه
        if (refreshToken) {
            return intlMiddleware(request);
        }

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