'use server'

import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { describirPeriodo } from '@/lib/informes-utils'
import { clientConfig } from '@/config/clients'

// Interfaces for response data
export interface KPIsData {
    actual: {
        facturacion_total: number
        num_facturas: number
        ticket_medio: number
        dias_cobro_promedio: number
    }
    anterior: {
        facturacion_total: number
        num_facturas: number
        ticket_medio: number
        dias_cobro_promedio: number
    }
    variaciones: {
        facturacion: number
        facturas: number
        ticket_medio: number
        dias_cobro: number
    }
}

export interface EvolucionData {
    periodo: string
    mes: number
    anio: number
    facturacion: number
    num_facturas: number
}

export interface EstadoData {
    estado: string
    cantidad: number
    porcentaje: number
}

export interface TopClienteData {
    cliente_id: string
    cliente_nombre: string
    facturacion: number
    num_facturas: number
}

export interface CategoriaData {
    categoria: string
    facturacion: number
    cantidad: number
}

export interface DesgloseIVAData {
    tipo_iva: number
    base_imponible: number
    cuota_iva: number
    total: number
    porcentaje_del_total: number
}

export interface RankingConceptoData {
    concepto_id: string
    concepto_nombre: string
    categoria: string
    cantidad_vendida: number
    ingresos: number
    porcentaje: number
}

import { getUserContext } from '@/app/actions/usuarios-empresas'

/** Extrae mensaje legible del error (Supabase devuelve { message, details } no Error) */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (error && typeof error === 'object') {
        const o = error as { message?: string; details?: string; hint?: string }
        if (typeof o.message === 'string' && o.message) return o.message
        if (typeof o.details === 'string' && o.details) return o.details
        if (typeof o.hint === 'string' && o.hint) return o.hint
    }
    if (typeof error === 'string') return error
    return 'Error al cargar los datos. Revisa la consola del navegador o que la base de datos esté actualizada.'
}

// Helper wrapper to adapt getUserContext for reports
async function getEmpresaId() {
    const context = await getUserContext()
    // In Global Mode, empresaId is null. This is VALID for reports now.
    // The original threw error if null. We remove that check.
    return {
        supabase: context.supabase,
        empresaId: context.empresaId
    }
}

export async function getKPIsAction(
    fechaDesde?: string,
    fechaHasta?: string,
    empresaIdOverride?: string | null,
    clienteId?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        const params: Record<string, unknown> = {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
        }
        if (clienteId != null) params.p_cliente_id = clienteId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data, error } = await (supabase as any).rpc('get_kpis_ventas', params)

        if (error && isRpcSignatureError(error) && clienteId != null) {
            delete params.p_cliente_id
            const retry = await (supabase as any).rpc('get_kpis_ventas', params)
            data = retry.data
            error = retry.error
        }
        if (error) throw error

        const kpis: KPIsData = typeof data === 'string' ? JSON.parse(data) : data

        return { success: true, data: kpis }
    } catch (error) {
        const msg = getErrorMessage(error)
        console.error('[getKPIsAction]', msg, error)
        return { success: false, error: msg }
    }
}

// Compatibilidad: si la RPC no tiene p_cliente_id (migración antigua), reintentar sin ese parámetro
function isRpcSignatureError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err)
    return /function.*does not exist|argument|parameter|unknown/i.test(msg)
}

export async function getEvolucionFacturacionAction(
    fechaDesde?: string,
    fechaHasta?: string,
    empresaIdOverride?: string | null,
    clienteId?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        const params: Record<string, unknown> = {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
        }
        if (clienteId != null) params.p_cliente_id = clienteId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data, error } = await (supabase as any).rpc('get_evolucion_facturacion', params)

        if (error && isRpcSignatureError(error) && clienteId != null) {
            delete params.p_cliente_id
            const retry = await (supabase as any).rpc('get_evolucion_facturacion', params)
            data = retry.data
            error = retry.error
        }
        if (error) throw error

        const result: EvolucionData[] = typeof data === 'string' ? JSON.parse(data) : (data || [])
        return { success: true, data: result }
    } catch (error) {
        console.error('[getEvolucionFacturacionAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function getEstadoFacturasAction(
    fechaDesde?: string,
    fechaHasta?: string,
    empresaIdOverride?: string | null,
    clienteId?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        const params: Record<string, unknown> = {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
        }
        if (clienteId != null) params.p_cliente_id = clienteId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data, error } = await (supabase as any).rpc('get_estado_facturas', params)

        if (error && isRpcSignatureError(error) && clienteId != null) {
            delete params.p_cliente_id
            const retry = await (supabase as any).rpc('get_estado_facturas', params)
            data = retry.data
            error = retry.error
        }
        if (error) throw error

        const result: EstadoData[] = typeof data === 'string' ? JSON.parse(data) : (data || [])
        return { success: true, data: result }
    } catch (error) {
        console.error('[getEstadoFacturasAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function getTopClientesAction(
    fechaDesde?: string,
    fechaHasta?: string,
    limite = 10,
    empresaIdOverride?: string | null,
    clienteId?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        const params: Record<string, unknown> = {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
            p_limite: limite,
        }
        if (clienteId != null) params.p_cliente_id = clienteId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data, error } = await (supabase as any).rpc('get_top_clientes', params)
        if (error && isRpcSignatureError(error) && clienteId != null) {
            delete params.p_cliente_id
            const retry = await (supabase as any).rpc('get_top_clientes', params)
            data = retry.data
            error = retry.error
        }
        if (error) throw error

        const result: TopClienteData[] = typeof data === 'string' ? JSON.parse(data) : (data || [])
        return { success: true, data: result }
    } catch (error) {
        console.error('[getTopClientesAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function getFacturacionPorCategoriaAction(
    fechaDesde?: string,
    fechaHasta?: string,
    empresaIdOverride?: string | null,
    clienteId?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        const params: Record<string, unknown> = {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
        }
        if (clienteId != null) params.p_cliente_id = clienteId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data, error } = await (supabase as any).rpc('get_facturacion_por_categoria', params)
        if (error && isRpcSignatureError(error) && clienteId != null) {
            delete params.p_cliente_id
            const retry = await (supabase as any).rpc('get_facturacion_por_categoria', params)
            data = retry.data
            error = retry.error
        }
        if (error) throw error

        const result: CategoriaData[] = typeof data === 'string' ? JSON.parse(data) : (data || [])
        return { success: true, data: result }
    } catch (error) {
        console.error('[getFacturacionPorCategoriaAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function getDesgloseIVAAction(
    fechaDesde?: string,
    fechaHasta?: string,
    empresaIdOverride?: string | null,
    clienteId?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        const params: Record<string, unknown> = {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
        }
        if (clienteId != null) params.p_cliente_id = clienteId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data, error } = await (supabase as any).rpc('get_desglose_iva', params)
        if (error && isRpcSignatureError(error) && clienteId != null) {
            delete params.p_cliente_id
            const retry = await (supabase as any).rpc('get_desglose_iva', params)
            data = retry.data
            error = retry.error
        }
        if (error) throw error

        const result: DesgloseIVAData[] = typeof data === 'string' ? JSON.parse(data) : (data || [])
        return { success: true, data: result }
    } catch (error) {
        console.error('[getDesgloseIVAAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function getRankingConceptosAction(
    fechaDesde?: string,
    fechaHasta?: string,
    limite = 10,
    empresaIdOverride?: string | null
) {
    try {
        const { supabase, empresaId: ctxEmpresaId } = await getEmpresaId()
        const empresaId = empresaIdOverride !== undefined ? empresaIdOverride : ctxEmpresaId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('get_ranking_conceptos', {
            p_empresa_id: empresaId,
            p_fecha_desde: fechaDesde || null,
            p_fecha_hasta: fechaHasta || null,
            p_limite: limite,
        })

        if (error) throw error

        const result: RankingConceptoData[] = typeof data === 'string' ? JSON.parse(data) : (data || [])
        return { success: true, data: result }
    } catch (error) {
        console.error('[getRankingConceptosAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function exportarInformeExcelAction(
    fechaDesde: string,
    fechaHasta: string,
    empresaId?: string | null,
    clienteId?: string | null,
    empresaNombre?: string | null,
    clienteNombre?: string | null
) {
    try {
        const [kpis, evolucion, topClientes, desgloseIVA] = await Promise.all([
            getKPIsAction(fechaDesde, fechaHasta, empresaId ?? undefined, clienteId ?? undefined),
            getEvolucionFacturacionAction(fechaDesde, fechaHasta, empresaId, clienteId),
            getTopClientesAction(fechaDesde, fechaHasta, 50, empresaId, clienteId),
            getDesgloseIVAAction(fechaDesde, fechaHasta, empresaId, clienteId),
        ])

        const workbook = new ExcelJS.Workbook()
        workbook.creator = `${clientConfig.nombreCorto} ERP`
        workbook.created = new Date()

        // Hoja 0: Resumen del informe (filtros aplicados) - como SAP, Oracle, Power BI
        const descPeriodo = describirPeriodo(fechaDesde, fechaHasta)
        const fechaDesdeFmt = format(new Date(fechaDesde), "d 'de' MMMM 'de' yyyy", { locale: es })
        const fechaHastaFmt = format(new Date(fechaHasta), "d 'de' MMMM 'de' yyyy", { locale: es })
        const ahora = format(new Date(), "d/MM/yyyy HH:mm:ss", { locale: es })

        const sheetResumen = workbook.addWorksheet('Resumen del informe')
        sheetResumen.columns = [{ width: 28 }, { width: 45 }]
        sheetResumen.addRow([])
        sheetResumen.addRow(['Informe de ventas', `${clientConfig.nombreCorto} ERP`]).getCell(1).font = { bold: true, size: 14 }
        sheetResumen.addRow([])
        sheetResumen.addRow(['Filtros aplicados', '']).getCell(1).font = { bold: true }
        sheetResumen.addRow(['Período', `${fechaDesdeFmt} – ${fechaHastaFmt}`])
        sheetResumen.addRow(['Descripción del período', descPeriodo])
        sheetResumen.addRow(['Empresa', empresaId ? (empresaNombre || empresaId) : 'Todas las empresas (Visión global)'])
        sheetResumen.addRow(['Cliente', clienteId ? (clienteNombre || clienteId) : 'Todos los clientes'])
        sheetResumen.addRow([])
        sheetResumen.addRow(['Fecha de generación', ahora])

        // Hoja 1: KPIs
        const sheetKPIs = workbook.addWorksheet('KPIs')
        sheetKPIs.columns = [
            { header: 'Métrica', key: 'metrica', width: 30 },
            { header: 'Valor Actual', key: 'actual', width: 20 },
            { header: 'Valor Anterior', key: 'anterior', width: 20 },
            { header: 'Variación', key: 'variacion', width: 15 },
        ]

        if (kpis.success && kpis.data) {
            sheetKPIs.addRow({
                metrica: 'Facturación Total',
                actual: `${kpis.data.actual.facturacion_total.toFixed(2)}€`,
                anterior: `${kpis.data.anterior.facturacion_total.toFixed(2)}€`,
                variacion: `${kpis.data.variaciones.facturacion}%`,
            })
            sheetKPIs.addRow({
                metrica: 'Número de Facturas',
                actual: kpis.data.actual.num_facturas,
                anterior: kpis.data.anterior.num_facturas,
                variacion: kpis.data.variaciones.facturas,
            })
            sheetKPIs.addRow({
                metrica: 'Ticket Medio',
                actual: `${kpis.data.actual.ticket_medio.toFixed(2)}€`,
                anterior: `${kpis.data.anterior.ticket_medio.toFixed(2)}€`,
                variacion: `${kpis.data.variaciones.ticket_medio}%`,
            })
        }

        // Hoja 2: Top Clientes
        const sheetClientes = workbook.addWorksheet('Top Clientes')
        sheetClientes.columns = [
            { header: 'Cliente', key: 'cliente', width: 40 },
            { header: 'Facturación', key: 'facturacion', width: 20 },
            { header: 'Nº Facturas', key: 'num_facturas', width: 15 },
        ]

        if (topClientes.success && topClientes.data) {
            topClientes.data.forEach((cliente: TopClienteData) => {
                sheetClientes.addRow({
                    cliente: cliente.cliente_nombre,
                    facturacion: `${cliente.facturacion.toFixed(2)}€`,
                    num_facturas: cliente.num_facturas,
                })
            })
        }

        // Hoja 3: Desglose IVA
        const sheetIVA = workbook.addWorksheet('Desglose IVA')
        sheetIVA.columns = [
            { header: 'Tipo IVA %', key: 'tipo_iva', width: 12 },
            { header: 'Base imponible', key: 'base', width: 18 },
            { header: 'Cuota IVA', key: 'cuota', width: 18 },
            { header: 'Total', key: 'total', width: 18 },
            { header: '% del total', key: 'porcentaje', width: 14 },
        ]
        if (desgloseIVA.success && desgloseIVA.data) {
            desgloseIVA.data.forEach((row: DesgloseIVAData) => {
                sheetIVA.addRow({
                    tipo_iva: `${row.tipo_iva}%`,
                    base: row.base_imponible.toFixed(2),
                    cuota: row.cuota_iva.toFixed(2),
                    total: row.total.toFixed(2),
                    porcentaje: `${row.porcentaje_del_total}%`,
                })
            })
        }

        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer()

        // Convertir a base64 para enviar al cliente
        const base64 = Buffer.from(buffer).toString('base64')

        return { success: true, data: base64 }
    } catch (error) {
        console.error('[exportarInformeExcelAction]', error)
        return { success: false, error: getErrorMessage(error) }
    }
}
