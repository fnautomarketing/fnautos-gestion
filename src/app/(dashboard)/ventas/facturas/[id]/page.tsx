import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { DetalleFacturaHeader } from '@/components/ventas/detalle-factura-header'
import { RectificativaInfoPopover } from '@/components/ventas/rectificativa-info-popover'
import { InformacionFactura } from '@/components/ventas/informacion-factura'
import { EmpresaInfo } from '@/components/ventas/empresa-info'
import { ClienteInfo } from '@/components/ventas/cliente-info'
import { LineasFacturaTable } from '@/components/ventas/lineas-factura-table'
import { ResumenFinanciero } from '@/components/ventas/resumen-financiero'
import { TimelineEventos } from '@/components/ventas/timeline-eventos'
import { formatFacturaDisplayNumero } from '@/lib/utils'
import { Factura, Cliente, LineaFactura, PagoFactura, EventoFactura } from '@/types/ventas'

interface DetalleFacturaPageProps {
    params: Promise<{ id: string }>
}

type FacturaData = Factura & {
    cliente: Cliente
    lineas: LineaFactura[]
}

export default async function DetalleFacturaPage({
    params,
}: DetalleFacturaPageProps) {
    const { id } = await params

    let supabase: Awaited<ReturnType<typeof getUserContext>>['supabase']
    let empresas: { empresa_id?: string }[] = []
    let isAdmin = false
    try {
        const ctx = await getUserContext()
        supabase = ctx.supabase
        empresas = (ctx.empresas as { empresa_id?: string }[]) || []
        isAdmin = !!ctx.isAdmin
    } catch {
        redirect('/login')
    }

    // Cargar factura por id; luego comprobar que el usuario tiene acceso a su empresa (evita 404 al cambiar de empresa en el selector)
    const { data: factura, error } = await supabase
        .from('facturas')
        .select(
            `
      *,
      cliente:clientes(*),
      lineas:lineas_factura(*)
    `
        )
        .eq('id', id)
        .single()

    if (error || !factura) {
        if (error) console.error('Error fetching invoice:', JSON.stringify({ code: error.code, message: error.message, details: error.details }))
        notFound()
    }

    const tieneAcceso = isAdmin || empresas.some((e) => e.empresa_id === factura.empresa_id)
    if (!tieneAcceso) notFound()

    const facturaData = factura as unknown as FacturaData

    // Obtener empresa emisora
    const { data: empresa } = await supabase
        .from('empresas')
        .select('razon_social, nombre_comercial, direccion, ciudad, codigo_postal, cif, email')
        .eq('id', factura.empresa_id)
        .single()

    const empresaDisplay = empresa ? {
        nombre_fiscal: empresa.razon_social || empresa.nombre_comercial,
        razon_social: empresa.razon_social,
        nombre_comercial: empresa.nombre_comercial,
        cif: empresa.cif || '',
        email: empresa.email,
        direccion: empresa.direccion,
        ciudad: empresa.ciudad,
        codigo_postal: empresa.codigo_postal,
    } : null

    // Obtener eventos de la factura
    const { data: eventos } = await supabase
        .from('eventos_factura')
        .select('*')
        .eq('factura_id', id)
        .order('created_at', { ascending: false })

    // Obtener emails enviados para enriquecer el timeline con "Factura enviada por email"
    const { data: emailsFactura } = await supabase
        .from('emails_factura')
        .select('id, factura_id, enviado_at, created_at, para, estado')
        .eq('factura_id', id)
        .order('enviado_at', { ascending: false })

    // Obtener pagos
    const { data: p } = await supabase
        .from('pagos_factura')
        .select('*')
        .eq('factura_id', id)
        .order('fecha_pago', { ascending: false })

    // Cast to PagoFactura[] to handle potential type inference issues if schema is missing
    const pagos = (p || []) as unknown as PagoFactura[]

    // Obtener rectificativas relacionadas (misma empresa que la factura)
    const { data: rectificativas } = await supabase
        .from('facturas')
        .select('id, serie, numero, fecha_emision, total, estado, tipo_rectificativa, motivo_rectificacion')
        .eq('factura_rectificada_id', id)
        .eq('empresa_id', factura.empresa_id)
        .eq('es_rectificativa', true)
        .order('created_at', { ascending: false })

    const totalPagadoFromPagos = pagos?.reduce((sum, p) => sum + Number(p.importe), 0) || 0
    // Si estado=pagada, usar factura.pagado o total para que Resumen Financiero muestre Pagada correctamente
    const totalPagado = factura.estado === 'pagada'
        ? (Number(factura.pagado) || Number(factura.total) || totalPagadoFromPagos)
        : totalPagadoFromPagos

    // Total efectivo: respeta el signo de retencion_porcentaje
    // Porcentaje negativo (-1%) = resta del total; positivo = suma
    const retPct = Number(factura.retencion_porcentaje) || 0
    // importe_retencion se almacena como ABS en BD; usamos Math.abs para compatibilidad con datos legacy
    const importeRetencionAbs = factura.importe_retencion != null
        ? Math.abs(Number(factura.importe_retencion))
        : Math.abs(retPct * Number(factura.base_imponible) / 100)
    // El efecto sobre el total sigue el signo del porcentaje: negativo = resta, positivo = suma
    const efectoRetencion = retPct < 0 ? -importeRetencionAbs : importeRetencionAbs
    const totalEfectivo = Number(factura.base_imponible) + Number(factura.iva) + efectoRetencion + (Number(factura.importe_recargo) || 0)
    const pendiente = Math.max(0, totalEfectivo - totalPagado)

    // Combinar eventos de estado con eventos de envío de email
    const emailEventos: EventoFactura[] = ((emailsFactura || []) as { id: string, factura_id: string, enviado_at: string | null, created_at: string, para: string[] | string, estado: string }[])
        .filter((e) => e.estado === 'enviado')
        .map((e) => {
            const paraTexto =
                Array.isArray(e.para)
                    ? (e.para[0] || '')
                    : typeof e.para === 'string'
                        ? (e.para.split(',')[0] || e.para)
                        : ''

            return {
                id: `email-${e.id}`,
                factura_id: e.factura_id,
                tipo: 'enviado',
                descripcion: paraTexto
                    ? `Factura enviada por email a ${paraTexto}`
                    : 'Factura enviada por email',
                created_at: (e.enviado_at || e.created_at) as string,
                // Rellenamos campos opcionales que no usa el UI
                user_id: '', 
                empresa_id: '',
                datos_adicionales: null,
            } as unknown as EventoFactura
        })

    const timelineEventos: EventoFactura[] = [
        ...((eventos as unknown as EventoFactura[]) || []),
        ...emailEventos,
    ].sort((a, b) => {
        const da = a.created_at || ''
        const db = b.created_at || ''
        return db.localeCompare(da)
    })

    // Header con acciones
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto min-w-0 pb-1">
                <Link href="/ventas" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors shrink-0">Ventas</Link>
                <span className="shrink-0">›</span>
                <Link href="/ventas/facturas" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors shrink-0">Facturas</Link>
                <span className="shrink-0">›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium truncate min-w-0">
                    {formatFacturaDisplayNumero(facturaData.serie, facturaData.numero)}
                </span>
            </div>

            {/* Aviso de Rectificativa */}
            {facturaData.es_rectificativa && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                            Factura Rectificativa
                            <RectificativaInfoPopover variant="banner" />
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Esta es una factura rectificativa de tipo <strong>{facturaData.tipo_rectificativa}</strong>.
                            {facturaData.motivo_rectificacion && (
                                <span className="block mt-1">Motivo: {facturaData.motivo_rectificacion}</span>
                            )}
                        </p>
                        {facturaData.factura_rectificada_id && (
                            <div className="mt-2 text-sm">
                                <Link
                                    href={`/ventas/facturas/${facturaData.factura_rectificada_id}`}
                                    className="text-red-700 dark:text-red-300 underline hover:no-underline font-medium"
                                >
                                    Ver factura original rectificada
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Aviso si tiene rectificativas asociadas */}
            {rectificativas && rectificativas.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2 mb-3">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Facturas Rectificativas Asociadas ({rectificativas.length})
                        <RectificativaInfoPopover variant="section" />
                    </h3>
                    <div className="space-y-2">
                        {rectificativas.map((rect) => (
                            <Link
                                key={rect.id}
                                href={`/ventas/facturas/${rect.id}`}
                                className="block p-3 bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 rounded-md hover:shadow-sm transition-shadow group"
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <span className="font-mono font-medium group-hover:text-primary transition-colors">
                                            {rect.serie}-{rect.numero}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            ({new Date(rect.fecha_emision).toLocaleDateString('es-ES')})
                                        </span>
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full border border-red-200 dark:border-red-800 capitalize">
                                            {rect.tipo_rectificativa}
                                        </span>
                                    </div>
                                    <div className="font-semibold text-red-600 shrink-0">
                                        {Number(rect.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                                {rect.motivo_rectificacion && (
                                    <div className="text-sm text-slate-500 mt-1 line-clamp-1 italic">
                                        &quot;{rect.motivo_rectificacion}&quot;
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Header con acciones */}
            <DetalleFacturaHeader factura={facturaData} />

            {/* Contenido en 2 columnas */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 min-w-0">
                {/* Columna Principal (8/12) */}
                <div className="lg:col-span-8 space-y-4 sm:space-y-6 min-w-0">
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Información de la Factura */}
                        <InformacionFactura factura={facturaData} />

                        {/* Empresa emisora */}
                        {empresaDisplay && <EmpresaInfo empresa={empresaDisplay} />}

                        {/* Cliente */}
                        <ClienteInfo cliente={facturaData.cliente} />
                    </div>

                    {/* Líneas de Factura */}
                    <LineasFacturaTable lineas={facturaData.lineas} />
                </div>

                {/* Columna Lateral (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Resumen Financiero */}
                    <ResumenFinanciero
                        factura={facturaData}
                        totalPagado={totalPagado}
                        pendiente={pendiente}
                        totalEfectivo={totalEfectivo}
                    />

                    {/* Timeline de Eventos */}
                    <TimelineEventos eventos={timelineEventos} />
                </div>
            </div>
        </div>
    )
}
