'use server'

import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkLoginRateLimit, recordFailedLogin, clearLoginAttempts } from '@/lib/security/rate-limit-login'
import { auditLog } from '@/lib/security/audit-log'

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export async function loginAction(formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        // Rate limit (brute-force)
        const { allowed, retryAfterSec } = checkLoginRateLimit(email || '')
        if (!allowed) {
            return {
                success: false,
                error: `Demasiados intentos. Espera ${retryAfterSec} segundos.`,
            }
        }

        // Validar input
        const parsableData = {
            email: email,
            password: password,
        }

        const validado = loginSchema.parse(parsableData)

        // Crear cliente de Supabase (SSR)
        const supabase = await createServerClient()

        // Intentar login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: validado.email,
            password: validado.password,
        })

        if (error) {
            recordFailedLogin(validado.email)
            console.error('Error en Supabase Auth:', error.message, error.status)
            return {
                success: false,
                error: 'Email o contraseña incorrectos',
            }
        }

        clearLoginAttempts(validado.email)
        auditLog('login', data.user?.id || '', { email: validado.email })

        if (!data.user) {
            return {
                success: false,
                error: 'No se pudo autenticar el usuario',
            }
        }

        return {
            success: true,
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                },
            },
        }
    } catch (error) {
        console.error('Error en loginAction:', error)

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0].message,
            }
        }

        return {
            success: false,
            error: 'Error al iniciar sesión. Por favor, inténtalo de nuevo.',
        }
    }
}

export async function logoutAction() {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) auditLog('logout', user.id, {})

        const { error } = await supabase.auth.signOut()

        if (error) {
            console.warn('Error en logout (Supabase):', error.message)
            // Even if there's an error (e.g. session not found), we should proceed 
            // with the client-side redirect to ensure the user "feels" logged out.
        }

        return {
            success: true,
        }
    } catch (error) {
        console.error('Error en logoutAction:', error)
        // Fallback to success to force redirect
        return {
            success: true,
        }
    }
}
