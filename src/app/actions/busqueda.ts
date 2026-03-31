'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface SearchResult {
    id: string
    type: 'factura' | 'contrato' | 'cliente'
    title: string
    subtitle: string
    href: string
    icon: string
    badge?: string
    badgeColor?: string
}

/**
 * Búsqueda global en Supabase: facturas, contratos y clientes.
 * Limitada a 5 resultados por categoría para velocidad inmediata.
 */
export async function busquedaGlobalAction(query: string): Promise<{ success: boolean; results: SearchResult[] }> {
    if (!query || query.trim().length < 2) {
        return { success: true, results: [] }
    }

    const q = query.trim()
    const admin = createAdminClient()

    try {
        // Ejecutar las 3 búsquedas en paralelo para máxima velocidad
        const [facturasRes, contratosRes, clientesRes] = await Promise.all([
            // ── Facturas ──────────────────────────────────────
            admin
                .from('facturas')
                .select('id, numero, estado, total, fecha_emision')
                .or(`numero.ilike.%${q}%`)
                .order('fecha_emision', { ascending: false })
                .limit(5),

            // ── Contratos ─────────────────────────────────────
            admin
                .from('contratos')
                .select('id, numero, tipo_operacion, comprador_nombre, vendedor_nombre, vehiculo_matricula, estado')
                .or(`numero.ilike.%${q}%,comprador_nombre.ilike.%${q}%,vendedor_nombre.ilike.%${q}%,vehiculo_matricula.ilike.%${q}%`)
                .order('created_at', { ascending: false })
                .limit(5),

            // ── Clientes ──────────────────────────────────────
            admin
                .from('clientes')
                .select('id, nombre_fiscal, nombre_comercial, cif, email_principal, telefono_principal')
                .or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%,cif.ilike.%${q}%,email_principal.ilike.%${q}%`)
                .eq('activo', true)
                .order('nombre_fiscal')
                .limit(5),
        ])

        const results: SearchResult[] = []

        // Mapear facturas
        for (const f of facturasRes.data || []) {
            const estadoLabels: Record<string, string> = {
                emitida: 'Emitida',
                borrador: 'Borrador',
                pagada: 'Pagada',
                anulada: 'Anulada',
                vencida: 'Vencida',
            }
            const estadoColors: Record<string, string> = {
                emitida: 'blue',
                borrador: 'slate',
                pagada: 'green',
                anulada: 'red',
                vencida: 'amber',
            }
            results.push({
                id: f.id,
                type: 'factura',
                title: f.numero || 'Sin número',
                subtitle: `${f.total?.toFixed(2) || '0.00'}€ · ${f.fecha_emision || ''}`,
                href: `/ventas/facturas/${f.id}`,
                icon: 'receipt',
                badge: estadoLabels[f.estado] || f.estado,
                badgeColor: estadoColors[f.estado] || 'slate',
            })
        }

        // Mapear contratos
        for (const c of contratosRes.data || []) {
            const esVenta = c.tipo_operacion === 'venta'
            const estadoLabels: Record<string, string> = {
                borrador: 'Borrador',
                pendiente_firma: 'Pend. Firma',
                firmado: 'Firmado',
                anulado: 'Anulado',
            }
            const estadoColors: Record<string, string> = {
                borrador: 'slate',
                pendiente_firma: 'amber',
                firmado: 'green',
                anulado: 'red',
            }
            results.push({
                id: c.id,
                type: 'contrato',
                title: `${c.numero || 'Contrato'} — ${c.vehiculo_matricula || ''}`,
                subtitle: `${esVenta ? 'Venta a' : 'Compra de'} ${esVenta ? c.comprador_nombre : c.vendedor_nombre}`,
                href: `/ventas/contratos/${c.id}`,
                icon: 'file-text',
                badge: estadoLabels[c.estado] || c.estado,
                badgeColor: estadoColors[c.estado] || 'slate',
            })
        }

        // Mapear clientes
        for (const cl of clientesRes.data || []) {
            results.push({
                id: cl.id,
                type: 'cliente',
                title: cl.nombre_fiscal || cl.nombre_comercial || 'Sin nombre',
                subtitle: [cl.cif, cl.email_principal, cl.telefono_principal].filter(Boolean).join(' · '),
                href: `/ventas/clientes/${cl.id}`,
                icon: 'users',
            })
        }

        return { success: true, results }
    } catch (error) {
        console.error('[busquedaGlobalAction]', error)
        return { success: true, results: [] }
    }
}
