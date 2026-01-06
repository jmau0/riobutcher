import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('auth')

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (authCookie?.value !== 'true') {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    if (request.nextUrl.pathname === '/login') {
        if (authCookie?.value === 'true') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
}
