/**
 * Tests internos del filtro de clientes en facturas.
 *
 * Validan la lógica pura de filtrado/construcción de parámetros sin depender
 * de browser ni de Supabase real.
 */
import { describe, it, expect } from 'vitest'

// ─── Helpers de la lógica de URL ─────────────────────────────────────────────

function buildFacturasUrl(params: Record<string, string>): string {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v)
    }
    return `/ventas/facturas?${sp.toString()}`
}

function parseFacturasParams(url: string): Record<string, string> {
    const sp = new URL(url, 'http://localhost').searchParams
    const out: Record<string, string> = {}
    for (const [k, v] of sp.entries()) out[k] = v
    return out
}

// ─── Lógica de filtrado en memoria (misma que en page.tsx) ───────────────────

interface FacturaMock {
    id: string
    cliente_id: string
    estado: string
    total: number
    fecha_emision: string
}

function applyClienteFilter(facturas: FacturaMock[], clienteId: string): FacturaMock[] {
    if (!clienteId) return facturas
    return facturas.filter(f => f.cliente_id === clienteId)
}

function applyEstadoFilter(facturas: FacturaMock[], estado: string): FacturaMock[] {
    if (!estado || estado === 'todas') return facturas
    return facturas.filter(f => f.estado === estado)
}

function applyOrden(facturas: FacturaMock[], orden: string): FacturaMock[] {
    const copy = [...facturas]
    switch (orden) {
        case 'fecha_asc': return copy.sort((a, b) => a.fecha_emision.localeCompare(b.fecha_emision))
        case 'total_desc': return copy.sort((a, b) => b.total - a.total)
        case 'total_asc': return copy.sort((a, b) => a.total - b.total)
        default: return copy.sort((a, b) => b.fecha_emision.localeCompare(a.fecha_emision))
    }
}

// ─── Datos de prueba ─────────────────────────────────────────────────────────

const CLIENTES = {
    C1: 'cliente-uuid-1',
    C2: 'cliente-uuid-2',
}

const FACTURAS: FacturaMock[] = [
    { id: 'f1', cliente_id: CLIENTES.C1, estado: 'pagada', total: 1210, fecha_emision: '2026-01-15' },
    { id: 'f2', cliente_id: CLIENTES.C1, estado: 'emitida', total: 484, fecha_emision: '2026-02-01' },
    { id: 'f3', cliente_id: CLIENTES.C2, estado: 'pagada', total: 726, fecha_emision: '2026-01-20' },
    { id: 'f4', cliente_id: CLIENTES.C2, estado: 'borrador', total: 300, fecha_emision: '2026-02-10' },
    { id: 'f5', cliente_id: CLIENTES.C1, estado: 'vencida', total: 2000, fecha_emision: '2025-12-01' },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Filtro de clientes en facturas', () => {

    describe('URL params: clienteId', () => {
        it('buildFacturasUrl incluye clienteId y clienteLabel', () => {
            const url = buildFacturasUrl({ clienteId: CLIENTES.C1, clienteLabel: 'Empresa ABC' })
            expect(url).toContain(`clienteId=${CLIENTES.C1}`)
            expect(url).toContain('clienteLabel=Empresa+ABC')
        })

        it('parseFacturasParams extrae clienteId correctamente', () => {
            const url = `http://localhost/ventas/facturas?clienteId=${CLIENTES.C1}&estado=pagada`
            const params = parseFacturasParams(url)
            expect(params.clienteId).toBe(CLIENTES.C1)
            expect(params.estado).toBe('pagada')
        })

        it('sin clienteId no añade el parámetro a la URL', () => {
            const url = buildFacturasUrl({ estado: 'pagada' })
            expect(url).not.toContain('clienteId')
        })
    })

    describe('applyClienteFilter', () => {
        it('devuelve todas las facturas cuando clienteId está vacío', () => {
            const result = applyClienteFilter(FACTURAS, '')
            expect(result).toHaveLength(5)
        })

        it('filtra solo las facturas de C1', () => {
            const result = applyClienteFilter(FACTURAS, CLIENTES.C1)
            expect(result).toHaveLength(3)
            expect(result.every(f => f.cliente_id === CLIENTES.C1)).toBe(true)
        })

        it('filtra solo las facturas de C2', () => {
            const result = applyClienteFilter(FACTURAS, CLIENTES.C2)
            expect(result).toHaveLength(2)
            expect(result.every(f => f.cliente_id === CLIENTES.C2)).toBe(true)
        })

        it('devuelve vacío si el clienteId no existe', () => {
            const result = applyClienteFilter(FACTURAS, 'no-existe')
            expect(result).toHaveLength(0)
        })
    })

    describe('combinación cliente + estado', () => {
        it('C1 + pagada = 1 factura', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C1)
            const result = applyEstadoFilter(porCliente, 'pagada')
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('f1')
        })

        it('C1 + emitida = 1 factura', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C1)
            const result = applyEstadoFilter(porCliente, 'emitida')
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('f2')
        })

        it('C2 + borrador = 1 factura', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C2)
            const result = applyEstadoFilter(porCliente, 'borrador')
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('f4')
        })

        it('C1 + borrador = 0 facturas', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C1)
            const result = applyEstadoFilter(porCliente, 'borrador')
            expect(result).toHaveLength(0)
        })

        it('C2 + todas = 2 facturas', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C2)
            const result = applyEstadoFilter(porCliente, 'todas')
            expect(result).toHaveLength(2)
        })
    })

    describe('combinación cliente + estado + orden', () => {
        it('C1 ordenadas por fecha ascendente', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C1)
            const ordenadas = applyOrden(porCliente, 'fecha_asc')
            expect(ordenadas[0].fecha_emision).toBe('2025-12-01')
            expect(ordenadas[1].fecha_emision).toBe('2026-01-15')
            expect(ordenadas[2].fecha_emision).toBe('2026-02-01')
        })

        it('C1 ordenadas por total descendente', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C1)
            const ordenadas = applyOrden(porCliente, 'total_desc')
            expect(ordenadas[0].total).toBe(2000)
            expect(ordenadas[1].total).toBe(1210)
            expect(ordenadas[2].total).toBe(484)
        })

        it('C1 pagadas ordenadas por mayor importe = 1 factura con total 1210', () => {
            const porCliente = applyClienteFilter(FACTURAS, CLIENTES.C1)
            const pagadas = applyEstadoFilter(porCliente, 'pagada')
            const ordenadas = applyOrden(pagadas, 'total_desc')
            expect(ordenadas).toHaveLength(1)
            expect(ordenadas[0].total).toBe(1210)
        })
    })

    describe('paginación de resultados', () => {
        const PAGE_SIZE = 10

        function paginate<T>(items: T[], page: number): { items: T[]; total: number; page: number; totalPages: number } {
            const from = (page - 1) * PAGE_SIZE
            const sliced = items.slice(from, from + PAGE_SIZE)
            return {
                items: sliced,
                total: items.length,
                page,
                totalPages: Math.ceil(items.length / PAGE_SIZE),
            }
        }

        // Simulamos 25 clientes que coinciden
        const clientesMock = Array.from({ length: 25 }, (_, i) => ({
            id: `uuid-${i + 1}`,
            label: `Cliente ${String(i + 1).padStart(2, '0')}`,
            cif: `B${String(i + 1).padStart(8, '0')}`,
        }))

        it('página 1 devuelve 10 de 25 y totalPages=3', () => {
            const r = paginate(clientesMock, 1)
            expect(r.items).toHaveLength(10)
            expect(r.total).toBe(25)
            expect(r.totalPages).toBe(3)
            expect(r.page).toBe(1)
        })

        it('página 2 devuelve los siguientes 10', () => {
            const r = paginate(clientesMock, 2)
            expect(r.items).toHaveLength(10)
            expect(r.items[0].label).toBe('Cliente 11')
            expect(r.items[9].label).toBe('Cliente 20')
        })

        it('página 3 devuelve los 5 restantes', () => {
            const r = paginate(clientesMock, 3)
            expect(r.items).toHaveLength(5)
            expect(r.items[0].label).toBe('Cliente 21')
        })

        it('hasMore es true en página 1 y 2, false en página 3', () => {
            const p1 = paginate(clientesMock, 1)
            const p2 = paginate(clientesMock, 2)
            const p3 = paginate(clientesMock, 3)
            expect(p1.page < p1.totalPages).toBe(true)
            expect(p2.page < p2.totalPages).toBe(true)
            expect(p3.page < p3.totalPages).toBe(false)
        })

        it('con exactamente 10 resultados no hay "Ver más"', () => {
            const r = paginate(clientesMock.slice(0, 10), 1)
            expect(r.totalPages).toBe(1)
            expect(r.page < r.totalPages).toBe(false)
        })

        it('acumular página 1 + página 2 da 20 items únicos', () => {
            const p1 = paginate(clientesMock, 1)
            const p2 = paginate(clientesMock, 2)
            const acumulados = [...p1.items, ...p2.items]
            expect(acumulados).toHaveLength(20)
            const ids = new Set(acumulados.map(c => c.id))
            expect(ids.size).toBe(20) // todos únicos
        })
    })

    describe('limpiar filtros', () => {
        it('sin clienteId + sin estado muestra todas las facturas', () => {
            const r1 = applyClienteFilter(FACTURAS, '')
            const r2 = applyEstadoFilter(r1, 'todas')
            expect(r2).toHaveLength(5)
        })

        it('URL limpia no tiene clienteId', () => {
            const params = parseFacturasParams('http://localhost/ventas/facturas')
            expect(params.clienteId).toBeUndefined()
        })
    })
})
