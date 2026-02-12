import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // 1. Run Supabase auth middleware (which returns a response with cookies)
    // This helper creates a response and refreshes the auth token if needed
    const response = await updateSession(request)

    // 2. Check for referral code in URL
    const ref = request.nextUrl.searchParams.get('ref')
    if (ref) {
        // Set cookie, expiry 30 days
        response.cookies.set('gridpass_ref', ref, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
