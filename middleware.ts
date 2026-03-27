import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request)

    // Security Headers (Security Fortress)
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    // CSP: Next.js requiere unsafe-inline para hydration; object-src y base-uri restringen más
    const cspBase = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'self' blob:; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: wss:; form-action 'self'"
    const csp = process.env.NODE_ENV === 'production' ? `${cspBase}; upgrade-insecure-requests` : cspBase
    response.headers.set('Content-Security-Policy', csp)
    // Permissions-Policy: deshabilitar APIs no usadas
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    )

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
