import { describe, it, expect, vi, beforeEach } from 'vitest'
import { crearFacturaAction } from '../ventas'
import * as auth from '@/lib/supabase/server'
import * as adminClient from '@/lib/supabase/admin'

// Mock de Supabase
vi.mock('@/lib/supabase/server', () => ({
    createServerClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('ventas-senior.test.ts - Pruebas de Calidad Senior', () => {
    let mockSupabase: any
    let mockAdmin: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
            },
        }

        mockAdmin = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            rpc: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        }

        ;(auth.createServerClient as any).mockResolvedValue(mockSupabase)
        ;(adminClient.createAdminClient as any).mockReturnValue(mockAdmin)
    })

    it('debería calcular fecha_vencimiento automáticamente si no se proporciona (Caso bug reporte)', async () => {
        // 1. Mock rpc para obtenerSiguienteNumero
        mockAdmin.rpc.mockResolvedValueOnce({ data: 'F2026-0005', error: null })
        
        // 2. Mock sngle para series_facturacion y luego para el insert de la factura
        // obtenerSiguienteNumero -> admin.from('series_facturacion').select('codigo').eq('id', ...).single()
        // crearFacturaAction -> admin.from('facturas').insert(...).select().single()
        mockAdmin.single
            .mockResolvedValueOnce({ data: { codigo: 'F2026' }, error: null }) // En obtenerSiguienteNumero
            .mockResolvedValueOnce({ data: { id: 'new-factura-id' }, error: null }) // En crearFacturaAction
        
        // El insert de lineas no usa .single(), usa el resultado directo o .select() si lo tuviera (pero no lo tiene)
        // crearFacturaAction -> admin.from('lineas_factura').insert(...)
        mockAdmin.insert.mockImplementation((data: any) => {
            if (Array.isArray(data)) {
                // Es el insert de líneas (multiple)
                return Promise.resolve({ error: null })
            }
            // Es el insert de la factura
            return mockAdmin
        })

        const formData = new FormData()
        formData.append('empresa_id', '123e4567-e89b-12d3-a456-426614174000')
        formData.append('cliente_id', '123e4567-e89b-12d3-a456-426614174001')
        formData.append('fecha_emision', '2026-04-08')
        formData.append('subtotal', '100')
        formData.append('base_imponible', '100')
        formData.append('iva', '0') // No IVA
        formData.append('total', '100')
        formData.append('lineas', JSON.stringify([{
            concepto: 'Test sin IVA',
            cantidad: 1,
            precio_unitario: 100,
            iva_porcentaje: 0
        }]))

        const result = await crearFacturaAction(formData)

        if (!result.success) {
            throw new Error(`ACTION FAILED: ${result.error}`)
        }

        expect(result.success).toBe(true)
        
        const insertCalls = mockAdmin.insert.mock.calls
        const facturaInsert = insertCalls.find((c: any) => c[0] && !Array.isArray(c[0]) && c[0].fecha_vencimiento)
        
        expect(facturaInsert).toBeDefined()
        expect(facturaInsert[0].fecha_vencimiento).toBe('2026-04-08')
    })
})
