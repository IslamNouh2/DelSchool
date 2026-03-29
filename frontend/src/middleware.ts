import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    // 1. Handle i18n routing first
    const response = intlMiddleware(request);

    // 2. Check if the current route is protected (regardless of locale prefix)
    const pathname = request.nextUrl.pathname;
    
    // Check for protected patterns: /dashboard, /list, /report-card or /[locale]/dashboard, /[locale]/list, /[locale]/report-card
    const isDashboardRoute = pathname.match(/^\/(?:[a-z]{2}\/)?dashboard(?:\/.*)?$/);
    const isListRoute = pathname.match(/^\/(?:[a-z]{2}\/)?list(?:\/.*)?$/);
    const isReportCardRoute = pathname.match(/^\/(?:[a-z]{2}\/)?report-card(?:\/.*)?$/);

    if (isDashboardRoute || isListRoute || isReportCardRoute) {
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!accessToken && !refreshToken) {
            // Get current locale from pathname or default
            const locale = pathname.split('/')[1] || 'en';
            const redirectLocale = routing.locales.includes(locale as any) ? locale : 'en';
            return NextResponse.redirect(new URL(`/${redirectLocale}/login`, request.url));
        }

        if (accessToken) {
            try {
                const payload = await verifyToken(accessToken);
                if (payload?.role) {
                    return response; // Proceed with intl response
                }
            } catch (e) {
                console.error('Invalid access token, checking refresh token');
            }
        }

        // If accessToken is invalid but refreshToken exists, proceed and let backend handle
        // or redirect to login if refreshToken is also missing/invalid
        if (!refreshToken) {
            const locale = pathname.split('/')[1] || 'en';
            const redirectLocale = routing.locales.includes(locale as any) ? locale : 'en';
            return NextResponse.redirect(new URL(`/${redirectLocale}/login`, request.url));
        }
    }

    return response;
}

export const config = {
    // Matcher for both i18n and protected routes
    matcher: ['/', '/(ar|en|fr)/:path*', '/dashboard/:path*', '/list/:path*', '/admin/:path*', '/report-card/:path*'],
};
