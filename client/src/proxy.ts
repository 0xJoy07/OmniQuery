import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect all routes under /dashboard
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('session_token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload) {
            // Token is invalid or expired
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session_token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
