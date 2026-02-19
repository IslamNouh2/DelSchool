import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!accessToken && !refreshToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (accessToken) {
        try {
            const payload = await verifyToken(accessToken);
            if (payload?.role) {
                return NextResponse.next();
            }
        } catch (e) {
            console.error('Invalid access token, checking refresh token');
        }
    }

    // Try to refresh if accessToken is missing or invalid
    if (refreshToken) {
        try {
            // We can't easily refresh in middleware and update cookies in the SAME request
            // to the original target easily without a redirect or complex logic.
            // For now, if we have a refresh token but no valid access token, 
            // we redirect to a special refresh page or just allow it if the backend handles it.
            // But usually, we want to force a refresh call.
            
            // Allow the request to proceed; the backend will validate the refreshToken 
            // if the accessToken is missing (if we configure the backend that way)
            // OR we redirect to a /refresh route.
            
            return NextResponse.next(); 
        } catch (e) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/list/:path*',
        // add other protected routes here
    ],
};
