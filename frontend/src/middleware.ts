import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        // No token → redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const payload = await verifyToken(token);

        if (!payload?.role) {
            // Invalid token payload → redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Token is valid → allow request
        return NextResponse.next();
    } catch (e) {
        console.error('Invalid token', e);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/list/:path*',
        // add other protected routes here
    ],
};
