import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NuevaFacturaForm } from '@/components/ventas/nueva-factura-form'
import { EmpresaInfo } from '@/components/ventas/empresa-info'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { obtenerOCrearSerieAnualAction } from '@/app/actions/series'

export const dynamic = 'force-dynamic'

export default async function NuevaFacturaPage() {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { empresaId: empresaActivaId, rol, empresas } = await getUserContext()
    const isGlobal = !empresaActivaId && rol === 'admin'

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    const empresaId = empresaActivaId || perfil?.empresa_id
    if (!empresaId && !isGlobal) {
        throw new Error('Usuario sin empresa asignada')
    }

    const empresaIdParaForm = isGlobal ? 'ALL' : empresaId!
    const empresaIds = (empresas as { empresa_id: string; empresa?: { razon_social?: string; nombre_comercial?: string } }[]).map((e) => e.empresa_id).filter(Boolean)
    const empresasParaSelector = (empresas as { empresa_id: string; empresa?: { razon_social?: string; nombre_comercial?: string } }[])
        .filter((e) => e.empresa_id)
        .map((e) => ({
            id: e.empresa_id,
            nombre: (e.empresa?.nombre_comercial || e.empresa?.razon_social || e.empresa_id) as string
        }))
    const empresaIdParaDatos = empresaId || empresaIds[0] || ''
    const empresaIdsParaSeries = isGlobal ? empresaIds : (empresaId ? [empresaId] : [])

    // Asegurar que cada empresa tiene serie del año actual (V2026, Y2026, E2026 → V2027, Y2027, E2027 en 2027)
    for (const eid of empresaIdsParaSeries) {
        await obtenerOCrearSerieAnualAction(eid)
    }

    const { data: empresa } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaIdParaDatos)
        .single()

    // Config de todas las empresas (para retencion_predeterminada al cambiar empresa en Vision Global)
    const { data: empresasConfigs } = isGlobal && empresaIds.length > 0
        ? await supabase
            .from('empresas')
            .select('id, retencion_predeterminada')
            .in('id', empresaIds)
        : { data: [] }
    const empresasConfigsMap: Record<string, { retencion_predeterminada?: number | null }> = {}
    for (const e of empresasConfigs || []) {
        empresasConfigsMap[e.id] = { retencion_predeterminada: e.retencion_predeterminada }
    }

    const empresaIdsParaClientes = isGlobal ? empresaIds : (empresaId ? [empresaId] : [])
    const clientesByEmpresa: Record<string, any[]> = {}
    for (const eid of empresaIdsParaClientes) {
        const { data: ces } = await supabase
            .from('clientes_empresas')
            .select('cliente_id')
            .eq('empresa_id', eid)
        const clienteIds = (ces || []).map((c: { cliente_id: string }) => c.cliente_id)
        if (clienteIds.length > 0) {
            const { data } = await supabase
                .from('clientes')
                .select('*')
                .in('id', clienteIds)
                .eq('activo', true)
                .order('nombre_fiscal')
            clientesByEmpresa[eid] = data || []
        } else {
            clientesByEmpresa[eid] = []
        }
    }
    const clientes = clientesByEmpresa[empresaId || empresaIds[0] || ''] || []

    const { data: series } = empresaIdsParaSeries.length > 0
        ? await supabase
            .from('series_facturacion')
            .select('id, codigo, nombre, predeterminada, empresa_id')
            .in('empresa_id', empresaIdsParaSeries)
            .eq('activa', true)
            .order('predeterminada', { ascending: false })
        : { data: [] }

    return (
        <div className="space-y-6 w-full px-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Ventas</span>
                <span>›</span>
                <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Facturas</span>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Nueva Factura</span>
            </div>

            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Nueva Factura
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">
                    Completa los datos para generar una nueva factura de venta
                </p>
            </div>

            {/* Empresa emisora (oculto en Vision Global: se selecciona en el form) */}
            {empresa && empresaIdParaForm !== 'ALL' && (
                <div className="max-w-md">
                    <EmpresaInfo empresa={{
                        nombre_fiscal: empresa.razon_social || empresa.nombre_comercial,
                        razon_social: empresa.razon_social,
                        nombre_comercial: empresa.nombre_comercial,
                        cif: empresa.cif || '',
                        email: empresa.email,
                        direccion: empresa.direccion,
                        ciudad: empresa.ciudad,
                        codigo_postal: empresa.codigo_postal,
                    }} />
                </div>
            )}

            {/* Formulario */}
            <NuevaFacturaForm
                clientes={clientes || []}
                clientesByEmpresa={clientesByEmpresa}
                series={series || []}
                empresaId={empresaIdParaForm}
                empresaConfig={empresa}
                empresasConfigs={empresasConfigsMap}
                defaultEmpresaId={empresaIds[0]}
                empresas={empresasParaSelector}
            />
        </div>
    )
}
