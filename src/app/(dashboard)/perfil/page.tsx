import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { PerfilForm } from '@/components/perfil/perfil-form'

function getDisplayName(email: string | null, metadata?: Record<string, unknown>): string {
    const fromMeta = metadata?.full_name
    if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim()
    if (!email) return 'Usuario'
    if (email.toLowerCase().startsWith('administracion@')) return 'Administración'
    const local = email.split('@')[0] || ''
    const cleaned = local.replace(/[._-]+/g, ' ').trim()
    if (!cleaned) return 'Usuario'
    return cleaned
        .split(' ')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

export default async function PerfilPage() {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    let context: Awaited<ReturnType<typeof getUserContext>> | null = null
    try {
        context = await getUserContext()
    } catch {
        // Usuario sin contexto multi-empresa
    }

    const displayName = getDisplayName(user.email || null, user.user_metadata)
    const avatarUrl =
        (user.user_metadata?.avatar_url as string | undefined) || null

    const empresas = (context?.empresas ?? []).map((ue: any) => {
        const emp = ue.empresa
        const nombre = emp?.nombre_comercial || emp?.razon_social || 'Sin nombre'
        return {
            nombre,
            rol: ue.rol ?? 'operador',
            empresa_activa: ue.empresa_activa,
            logo_url: emp?.logo_url ?? null,
        }
    })

    const isAdmin = context?.isAdmin ?? false
    const rol = context?.rol ?? 'operador'

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
                <Link
                    href="/dashboard"
                    className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                >
                    Dashboard
                </Link>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">Mi Perfil</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Mi Perfil
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Información de tu cuenta y empresas vinculadas
                </p>
            </div>

            <PerfilForm
                displayName={displayName}
                email={user.email || ''}
                avatarUrl={avatarUrl}
                createdAt={user.created_at}
                empresas={empresas}
                isAdmin={isAdmin}
                rol={rol}
            />
        </div>
    )
}
