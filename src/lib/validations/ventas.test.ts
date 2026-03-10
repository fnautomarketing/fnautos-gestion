import { describe, it, expect } from 'vitest'
import { LineaFacturaSchema, GuardarBorradorSchema } from './ventas'

describe('LineaFacturaSchema', () => {
    it('should validate a correct line', () => {
        const validLine = {
            concepto: 'Consultoría',
            cantidad: 1,
            precio_unitario: 100,
            iva_porcentaje: 21,
            descuento_porcentaje: 0
        }
        expect(LineaFacturaSchema.safeParse(validLine).success).toBe(true)
    })

    it('should reject negative price', () => {
        const invalidLine = {
            concepto: 'Consultoría',
            cantidad: 1,
            precio_unitario: -10,
        }
        expect(LineaFacturaSchema.safeParse(invalidLine).success).toBe(false)
    })
})

describe('GuardarBorradorSchema', () => {
    it('should validate minimal draft', () => {
        const validDraft = {
            cliente_id: '123e4567-e89b-12d3-a456-426614174000',
            empresa_id: '123e4567-e89b-12d3-a456-426614174000',
            serie: 'F2024',
            fecha_emision: new Date(),
            fecha_vencimiento: new Date(),
            subtotal: 100,
            base_imponible: 100,
            iva: 21,
            total: 121,
            lineas: [{
                concepto: 'Item 1',
                cantidad: 1,
                precio_unitario: 100
            }]
        }
        expect(GuardarBorradorSchema.safeParse(validDraft).success).toBe(true)
    })
})
