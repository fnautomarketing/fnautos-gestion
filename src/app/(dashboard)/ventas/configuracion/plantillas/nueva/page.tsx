import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlantillaEditor } from '@/components/plantillas/plantilla-editor'

export default async function NuevaPlantillaPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Plantillas PDF › Nueva
            </div>

            {/* Header */}
            <h1 className="text-2xl sm:text-4xl font-serif font-bold">Nueva Plantilla de Factura</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Configura el diseño de tu nueva plantilla PDF
            </p>

            {/* Editor */}
            <PlantillaEditor />
        </div>
    )
}
