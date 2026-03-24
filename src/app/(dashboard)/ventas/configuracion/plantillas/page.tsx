import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlantillasGrid } from '@/components/plantillas/plantillas-grid'

export default async function PlantillasPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil?.empresa_id) throw new Error('Usuario sin empresa')

    const { data: plantillas } = await supabase
        .from('plantillas_pdf')
        .select('*')
        .eq('empresa_id', perfil.empresa_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Plantillas PDF
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold">Plantillas de Factura</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                        Personaliza el diseño de tus facturas PDF y documentos comerciales
                    </p>
                </div>
                <Link href="/ventas/configuracion/plantillas/nueva" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto min-h-[44px] bg-linear-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-300 font-bold">
                        + Nueva Plantilla
                    </Button>
                </Link>
            </div>

            {/* Grid de plantillas */}
            <PlantillasGrid plantillas={(plantillas as any) || []} />
        </div>
    )
}
