import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConceptosTabla } from '@/components/conceptos/conceptos-tabla'
import { ConceptosStats } from '@/components/conceptos/conceptos-stats'
import { Upload, Plus } from 'lucide-react'

export default async function ConceptosPage({
    searchParams,
}: {
    searchParams: { search?: string; categoria?: string; tipo?: string; iva?: string }
}) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    if (!perfil) throw new Error('Usuario sin empresa')

    // Cargar conceptos con filtros
    let query = supabase
        .from('conceptos_catalogo')
        .select('*')
        .eq('empresa_id', perfil.empresa_id)

    if (searchParams.search) {
        const s = sanitizeSearchInput(searchParams.search)
        if (s) query = query.or(`nombre.ilike.%${s}%,codigo.ilike.%${s}%`)
    }

    if (searchParams.categoria && searchParams.categoria !== 'todas') {
        query = query.eq('categoria', searchParams.categoria)
    }

    if (searchParams.tipo && searchParams.tipo !== 'todos') {
        query = query.eq('tipo', searchParams.tipo)
    }

    if (searchParams.iva && searchParams.iva !== 'todos') {
        query = query.eq('iva_porcentaje', parseFloat(searchParams.iva || '0'))
    }

    query = query.order('veces_usado', { ascending: false })

    const { data: conceptos } = await query

    // Stats
    const totalConceptos = conceptos?.length || 0
    const masUsado = conceptos?.[0] || null
    const precioPromedio = totalConceptos > 0
        ? conceptos!.reduce((sum, c) => sum + (c.precio_base || 0), 0) / totalConceptos
        : 0

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="text-sm text-slate-500 mb-1">
                        Ventas › Configuración › Catálogo
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Catálogo de Conceptos</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Gestiona tus servicios y productos para una facturación ágil y estandarizada.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link href="/ventas/configuracion/conceptos/importar" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
                            <Upload className="h-4 w-4 mr-2" />
                            Importar CSV
                        </Button>
                    </Link>
                    <Link href="/ventas/configuracion/conceptos/nuevo" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto min-h-[44px] bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Concepto
                        </Button>
                    </Link>
                </div>
            </div>

            <ConceptosStats
                totalConceptos={totalConceptos}
                masUsado={masUsado?.nombre || 'N/A'}
                precioPromedio={precioPromedio}
            />

            <ConceptosTabla conceptos={conceptos || []} />
        </div>
    )
}
