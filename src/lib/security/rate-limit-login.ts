/**
 * Rate limiting simple para login (brute-force).
 * Limitado por email: máx 5 intentos fallidos en 15 min.
 * Nota: En serverless (Vercel) cada instancia tiene su propia memoria;
 * para producción multi-instancia considerar Upstash Redis.
 */
const WINDOW_MS = 15 * 60 * 1000 // 15 min
const MAX_ATTEMPTS = 5

const attempts = new Map<string, { count: number; firstAt: number }>()

function cleanup() {
    const now = Date.now()
    for (const [key, val] of attempts.entries()) {
        if (now - val.firstAt > WINDOW_MS) attempts.delete(key)
    }
}

export function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterSec?: number } {
    cleanup()
    const key = email.toLowerCase().trim()
    const now = Date.now()
    const entry = attempts.get(key)

    if (!entry) return { allowed: true }

    if (now - entry.firstAt > WINDOW_MS) {
        attempts.delete(key)
        return { allowed: true }
    }

    if (entry.count >= MAX_ATTEMPTS) {
        const retryAfterSec = Math.ceil((entry.firstAt + WINDOW_MS - now) / 1000)
        return { allowed: false, retryAfterSec }
    }

    return { allowed: true }
}

export function recordFailedLogin(email: string): void {
    const key = email.toLowerCase().trim()
    const now = Date.now()
    const entry = attempts.get(key)

    if (!entry) {
        attempts.set(key, { count: 1, firstAt: now })
        return
    }

    if (now - entry.firstAt > WINDOW_MS) {
        attempts.set(key, { count: 1, firstAt: now })
        return
    }

    entry.count += 1
}

export function clearLoginAttempts(email: string): void {
    attempts.delete(email.toLowerCase().trim())
}
