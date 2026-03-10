
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UsuariosConfigPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Gestión de Usuarios
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">
                    Administra los usuarios y permisos de tu empresa.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">
                        Próximamente
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        El módulo de gestión de usuarios estará disponible en la próxima actualización.
                        Podrás invitar nuevos miembros y gestionar roles.
                    </p>
                </div>
            </div>
        </div>
    )
}
