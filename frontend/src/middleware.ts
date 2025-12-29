import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { verifyToken } from './lib/auth';

const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');
    return new TextEncoder().encode(secret); // `jose` needs Uint8Array
};

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // const { payload } = await jwtVerify(token, getJwtSecretKey());
        // const role = (payload.role as string).toLowerCase();

        // // Example: redirect if role doesn't match path
        // if (!request.nextUrl.pathname.startsWith(`/${role}`)) {
        //     return NextResponse.redirect(new URL('/login', request.url));
        // }
        const payload = await verifyToken(token);

        if (!payload || !payload.role) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const role = (payload.role as string).toLowerCase();

        // Redirect to role-based route if not already there
        if (!request.nextUrl.pathname.startsWith(`/${role}`)) {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }

        return NextResponse.next();

        return NextResponse.next();
    } catch (error) {
        console.error('Invalid token', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/(admin|teacher|student)(.*)', '/dashboard', '/list(.*)'],
};
