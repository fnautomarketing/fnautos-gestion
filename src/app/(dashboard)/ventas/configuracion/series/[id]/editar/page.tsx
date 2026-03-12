import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SerieForm } from '@/components/series/serie-form'
import { getUserContext } from '@/app/actions/usuarios-empresas'

interface EditarSeriePageProps {
    params: Promise<{ id: string }>
}

export default async function EditarSeriePage({ params }: EditarSeriePageProps) {
    const { id } = await params
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { empresaId, rol } = await getUserContext()
    const isGlobal = !empresaId && rol === 'admin'

    let query = supabase
        .from('series_facturacion')
        .select('*')
        .eq('id', id)
    if (!isGlobal && empresaId) {
        query = query.eq('empresa_id', empresaId)
    }
    const { data: serie } = await query.single()

    if (!serie) notFound()

    return (
        <div className="w-full space-y-6">
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Series › Editar
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-1 flex-shrink-0 bg-primary rounded-full" />
                <h1 className="text-5xl font-serif font-bold">Editar Serie</h1>
                <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 font-mono text-slate-400">
                    {serie.codigo as string}
                </div>
            </div>

            <SerieForm serieId={id} defaultValues={serie} />
        </div>
    )
}
