import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { isSafeUrl } from '@/lib/security/sanitize-search'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, Building2, FileText, Edit, Plus } from 'lucide-react'
import { ClienteFormData } from '@/lib/validations/cliente-schema'

interface Cliente extends ClienteFormData {
    id: string
    created_at: string
    empresa_id?: string | null
    user_id?: string
    total_facturado?: number
    facturas_emitidas?: number
    pendiente_cobro?: number
    ultima_factura_fecha?: string | null
}

export default async function DetalleClientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: clienteRaw } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single()

    const cliente = clienteRaw as unknown as Cliente

    if (!cliente) notFound()

    // Traer facturas del cliente con las empresas a las que el usuario tiene acceso (misma lógica que RLS)
    let facturasList: { id: string; total: number | null; estado: string | null; fecha_emision: string | null; serie: string | null; numero: string }[] = []
    try {
        const ctx = await getUserContext()
        let empresaIds = (ctx.empresas ?? []).map((e: { empresa_id?: string }) => e.empresa_id).filter(Boolean) as string[]
        if (empresaIds.length === 0 && ctx.empresaId) {
            empresaIds = [ctx.empresaId]
        }
        if (empresaIds.length > 0) {
            const admin = createAdminClient()
            const { data } = await admin
                .from('facturas')
                .select('id, total, estado, fecha_emision, serie, numero')
                .eq('cliente_id', id)
                .in('empresa_id', empresaIds)
                .order('fecha_emision', { ascending: false })
            facturasList = (data ?? []) as typeof facturasList
        } else {
            const { data: facturasAll } = await supabase
                .from('facturas')
                .select('id, total, estado, fecha_emision, serie, numero')
                .eq('cliente_id', id)
                .order('fecha_emision', { ascending: false })
            facturasList = (facturasAll ?? []) as typeof facturasList
        }
    } catch {
        const { data: facturasAll } = await supabase
            .from('facturas')
            .select('id, total, estado, fecha_emision, serie, numero')
            .eq('cliente_id', id)
            .order('fecha_emision', { ascending: false })
        facturasList = (facturasAll ?? []) as typeof facturasList
    }

    const emitidasList = facturasList.filter(
        (f) => f.estado && !['borrador', 'anulada'].includes(f.estado)
    )

    const totalFacturado = emitidasList.reduce((s, f) => s + Number(f.total ?? 0), 0)
    const facturasEmitidasCount = emitidasList.length
    const ultimaFacturaFecha =
        emitidasList.length > 0
            ? emitidasList.reduce((max, f) =>
                  (f.fecha_emision ?? '') > max ? (f.fecha_emision ?? '') : max
              , '')
            : null

    // Pendiente de cobro: facturas emitida/vencida/parcial menos pagos registrados
    const facturasConPendiente = emitidasList.filter((f) =>
        ['emitida', 'vencida', 'parcial'].includes(f.estado ?? '')
    )
    const idsConPendiente = facturasConPendiente.map((f) => f.id)
    let pendienteCobro = facturasConPendiente.reduce(
        (s, f) => s + Number(f.total ?? 0),
        0
    )
    if (idsConPendiente.length > 0) {
        const { data: pagos } = await supabase
            .from('pagos_factura')
            .select('factura_id, importe')
            .in('factura_id', idsConPendiente)
        const pagadoPorFactura: Record<string, number> = {}
        for (const p of pagos ?? []) {
            pagadoPorFactura[p.factura_id] =
                (pagadoPorFactura[p.factura_id] ?? 0) + Number(p.importe ?? 0)
        }
        for (const f of facturasConPendiente) {
            pendienteCobro -= pagadoPorFactura[f.id] ?? 0
        }
        if (pendienteCobro < 0) pendienteCobro = 0
    }

    const facturas = facturasList.slice(0, 5)

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

    return (
        <div data-testid="page-cliente-detalle" className="space-y-6 p-2 md:p-6 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/ventas" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    Ventas
                </Link>
                <span>›</span>
                <Link href="/ventas/clientes" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    Clientes
                </Link>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[200px] md:max-w-none">
                    {cliente.nombre_fiscal}
                </span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {cliente.nombre_fiscal}
                        </h1>
                        <Badge
                            className={
                                cliente.activo
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }
                        >
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Cliente desde{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300" suppressHydrationWarning>
                            {new Date(cliente.created_at).toLocaleDateString('es-ES', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/ventas/clientes/${id}/editar`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Cliente
                        </Link>
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                        <Link href={`/ventas/facturas/nueva?cliente=${id}`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Factura
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Total Facturado
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                            {formatCurrency(totalFacturado)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Facturas Emitidas
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1" data-testid="cliente-facturas-emitidas">
                            {facturasEmitidasCount}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Pendiente Cobro
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                            {formatCurrency(pendienteCobro)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Última Factura
                        </p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1" data-testid="cliente-ultima-factura-fecha">
                            <span suppressHydrationWarning>
                                {ultimaFacturaFecha
                                    ? new Date(ultimaFacturaFecha).toLocaleDateString('es-ES')
                                    : '—'}
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Contenido en 2 columnas */}
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-6">
                    {/* Información detallada */}
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Building2 className="h-5 w-5 text-slate-500" />
                                Información detallada
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Datos fiscales
                                    </p>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                        {cliente.nombre_fiscal}
                                    </p>
                                    {cliente.nombre_comercial && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                            Comercial: {cliente.nombre_comercial}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                            CIF: {cliente.cif}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            {cliente.tipo_cliente}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Contacto
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <a
                                                href={`mailto:${cliente.email_principal}`}
                                                className="text-slate-700 dark:text-slate-300 hover:text-primary underline-offset-2 hover:underline"
                                            >
                                                {cliente.email_principal}
                                            </a>
                                        </div>
                                        {cliente.telefono_principal && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Phone className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <a
                                                    href={`tel:${cliente.telefono_principal}`}
                                                    className="text-slate-700 dark:text-slate-300 hover:text-primary"
                                                >
                                                    {cliente.telefono_principal}
                                                </a>
                                            </div>
                                        )}
                                        {cliente.persona_contacto && (
                                            <p className="text-slate-600 dark:text-slate-400 pl-11">
                                                {cliente.persona_contacto}
                                            </p>
                                        )}
                                        {cliente.sitio_web && isSafeUrl(cliente.sitio_web) && (
                                            <a
                                                href={cliente.sitio_web}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="text-primary hover:underline pl-11 block"
                                            >
                                                {cliente.sitio_web}
                                            </a>
                                        )}
                                        {cliente.sitio_web && !isSafeUrl(cliente.sitio_web) && (
                                            <span className="text-slate-500 pl-11 block">{cliente.sitio_web}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Dirección
                                    </p>
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p>{cliente.direccion}</p>
                                            <p>
                                                {cliente.codigo_postal} {cliente.ciudad}
                                            </p>
                                            <p>
                                                {cliente.provincia}, {cliente.pais}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {cliente.iban && (
                                    <div className="sm:col-span-2">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                            Datos bancarios
                                        </p>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                                                {cliente.iban}
                                            </p>
                                            {(cliente.banco || cliente.bic_swift) && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {cliente.banco}
                                                    {cliente.bic_swift ? ` · ${cliente.bic_swift}` : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Últimas facturas */}
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <FileText className="h-5 w-5 text-slate-500" />
                                Últimas facturas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!facturas || facturas.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
                                    No hay facturas registradas para este cliente.
                                </p>
                            ) : (
                                <ul className="space-y-2" data-testid="cliente-ultimas-facturas-list">
                                    {(facturas as any[]).map((f: { id: string; serie?: string | null; numero: string; fecha_emision: string | null; total: number | null; estado: string | null }) => (
                                        <li key={f.id}>
                                            <Link
                                                href={`/ventas/facturas/${f.id}`}
                                                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                        <FileText className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                                            {f.serie ?? ''}-{f.numero}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            <span suppressHydrationWarning>{new Date(f.fecha_emision || '').toLocaleDateString('es-ES')}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                                        {formatCurrency(Number(f.total))}
                                                    </p>
                                                    <Badge
                                                        className={
                                                            f.estado === 'pagada'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs mt-1'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs mt-1'
                                                        }
                                                    >
                                                        {f.estado}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {facturas && facturas.length > 0 && (
                                <div className="mt-4 text-center">
                                    <Link
                                        href={`/ventas/facturas?clienteId=${id}`}
                                        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Ver historial completo
                                        <span>→</span>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Columna lateral */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Configuración comercial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <dt className="text-slate-500 dark:text-slate-400">Forma de pago</dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                                        {(cliente.forma_pago_predeterminada ?? 'transferencia').replace(/_/g, ' ')}
                                    </dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <dt className="text-slate-500 dark:text-slate-400">Vencimiento</dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                                        {cliente.dias_vencimiento ?? 30} días
                                    </dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <dt className="text-slate-500 dark:text-slate-400">Descuento</dt>
                                    <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                                        {cliente.descuento_comercial ?? 0}%
                                    </dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <dt className="text-slate-500 dark:text-slate-400">IVA</dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                                        {cliente.iva_aplicable ?? 21}%
                                    </dd>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <dt className="text-slate-500 dark:text-slate-400">Tarifa</dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                                        {cliente.tarifa_precios ?? 'general'}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {cliente.notas_internas && (
                        <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
                            <CardHeader className="border-b border-amber-200/50 dark:border-amber-800/50 pb-4">
                                <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                                    Notas internas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-sm text-amber-900/90 dark:text-amber-100/90 italic leading-relaxed">
                                    &quot;{cliente.notas_internas}&quot;
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
