import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { EditarFacturaForm } from '@/components/ventas/editar-factura-form'
import { EmpresaInfo } from '@/components/ventas/empresa-info'
import { formatFacturaDisplayNumero } from '@/lib/utils'

export default async function EditarFacturaPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    let empresas: { empresa_id?: string }[] = []
    let isAdmin = false
    try {
        const ctx = await getUserContext()
        empresas = (ctx.empresas as { empresa_id?: string }[]) || []
        isAdmin = !!ctx.isAdmin
    } catch {
        redirect('/login')
    }

    // Cargar factura por id; comprobar acceso por empresas del usuario (evita 404 al editar factura de otra empresa del selector)
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
        notFound()
    }

    const tieneAcceso = isAdmin || empresas.some((e) => e.empresa_id === factura.empresa_id)
    if (!tieneAcceso) notFound()

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

    // No permitir editar facturas anuladas
    if (factura.estado === 'anulada') {
        redirect(`/ventas/facturas/${id}?error=no_editable`)
    }

    // Cargar historial de cambios
    const { data: cambios } = await supabase
        .from('eventos_factura')
        .select('*')
        .eq('factura_id', id)
        .in('tipo', ['modificado', 'creado', 'pagado']) // Include 'pagado' to context
        .order('created_at', { ascending: false })
        .limit(10)

    // Cargar clientes para selector (solo si es borrador), filtrados por empresa de la factura
    let clientes: any[] = []
    if (factura.estado === 'borrador' && factura.empresa_id) {
        const { data: ces } = await supabase
            .from('clientes_empresas')
            .select('cliente_id')
            .eq('empresa_id', factura.empresa_id)
        const clienteIds = (ces || []).map((c: { cliente_id: string }) => c.cliente_id)
        if (clienteIds.length > 0) {
            const { data } = await supabase
                .from('clientes')
                .select('*')
                .in('id', clienteIds)
                .eq('activo', true)
                .order('nombre_fiscal')
            clientes = data || []
        }
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500 animate-in slide-in-from-top-4 duration-500">
                <Link href="/ventas" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Ventas</Link>
                <span>›</span>
                <Link href="/ventas/facturas" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Facturas</Link>
                <span>›</span>
                <Link href={`/ventas/facturas/${id}`} className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{formatFacturaDisplayNumero(factura.serie, factura.numero)}</Link>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">Editar</span>
            </div>

            {/* Empresa emisora */}
            {empresaDisplay && (
                <div className="max-w-md">
                    <EmpresaInfo empresa={empresaDisplay} />
                </div>
            )}

            {/* Formulario */}
            <EditarFacturaForm
                factura={factura as any}
                empresaId={factura.empresa_id}
                cambios={cambios || []}
                clientes={clientes}
            />
        </div>
    )
}
