import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PlantillaEditor } from '@/components/plantillas/plantilla-editor'

interface EditarPlantillaPageProps {
    params: Promise<{ id: string }>
}

export default async function EditarPlantillaPage({ params }: EditarPlantillaPageProps) {
    const { id } = await params

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil) throw new Error('Usuario sin empresa')

    const { data: plantilla } = await supabase
        .from('plantillas_pdf')
        .select('*')
        .eq('id', id)
        .eq('empresa_id', perfil.empresa_id)
        .single()

    if (!plantilla) notFound()

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Plantillas PDF › {plantilla.nombre} › Editar
            </div>

            {/* Header */}
            <h1 className="text-4xl font-serif font-bold">Editar: {plantilla.nombre}</h1>
            <p className="text-slate-600 dark:text-slate-400">
                Modifica la configuración de esta plantilla PDF
            </p>

            {/* Editor con valores por defecto */}
            <PlantillaEditor plantillaId={id} defaultValues={plantilla as any} />
        </div>
    )
}
