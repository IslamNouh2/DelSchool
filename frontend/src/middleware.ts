import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {

    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const payload = await verifyToken(token);

        if (!payload?.role) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const role = (payload.role as string).toLowerCase();

        if (!request.nextUrl.pathname.startsWith(`/${role}`)) {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }

        return NextResponse.next();
    }
    catch (e) {
        console.error('Invalid token', e);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/teacher/:path*',
        '/student/:path*',
        '/dashboard',
        '/list/:path*'
    ],
};
