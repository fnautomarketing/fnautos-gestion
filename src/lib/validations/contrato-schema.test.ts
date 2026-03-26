import { describe, it, expect } from 'vitest'
import { crearContratoSchema, firmarContratoSchema } from './contrato-schema'

// Datos mínimos válidos reutilizables
const datosValidos = {
    tipo_operacion: 'venta' as const,
    comprador_nombre: 'Juan García López',
    comprador_nif: '12345678Z',
    vendedor_nombre: 'JIMMY ANDRES BENITEZ CORTES',
    vendedor_nif: 'B12345678',
    vehiculo_marca: 'BMW',
    vehiculo_modelo: '320d',
    vehiculo_matricula: '1234 BCD',
    vehiculo_bastidor: 'WBAPH5C55BA123456',
    precio_venta: 15000,
}

describe('crearContratoSchema', () => {
    it('acepta datos válidos completos', () => {
        const result = crearContratoSchema.safeParse(datosValidos)
        expect(result.success).toBe(true)
    })

    it('acepta datos con todos los campos opcionales', () => {
        const result = crearContratoSchema.safeParse({
            ...datosValidos,
            comprador_direccion: 'Calle Mayor 1',
            comprador_ciudad: 'Madrid',
            comprador_codigo_postal: '28001',
            comprador_telefono: '600123456',
            comprador_email: 'juan@email.com',
            vehiculo_version: 'Sport Line',
            vehiculo_fecha_matriculacion: '2020-01-15',
            vehiculo_kilometraje: 50000,
            vehiculo_color: 'Negro',
            vehiculo_combustible: 'diesel',
            forma_pago: 'transferencia',
            iva_porcentaje: 21,
            vehiculo_estado_declarado: 'Buen estado general',
            vehiculo_libre_cargas: true,
            documentacion_entregada: ['Permiso de circulación', 'Ficha técnica'],
            notas_internas: 'Cliente habitual',
        })
        expect(result.success).toBe(true)
    })

    // ── Validaciones NIF/CIF ─────────────────────────────

    it('acepta NIF español válido (8 dígitos + letra)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, comprador_nif: '12345678Z' })
        expect(result.success).toBe(true)
    })

    it('acepta CIF de empresa válido (letra + 7 dígitos + control)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, comprador_nif: 'B12345678' })
        expect(result.success).toBe(true)
    })

    it('acepta NIE válido (X/Y/Z + 7 dígitos + letra)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, comprador_nif: 'X1234567L' })
        expect(result.success).toBe(true)
    })

    it('rechaza NIF con formato inválido', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, comprador_nif: '123' })
        expect(result.success).toBe(false)
    })

    it('rechaza NIF vacío', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, comprador_nif: '' })
        expect(result.success).toBe(false)
    })

    // ── Validaciones matrícula ────────────────────────────

    it('acepta matrícula nueva española (1234 BCD)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_matricula: '1234 BCD' })
        expect(result.success).toBe(true)
    })

    it('acepta matrícula nueva sin espacio (1234BCD)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_matricula: '1234BCD' })
        expect(result.success).toBe(true)
    })

    it('acepta matrícula antigua española (M-1234-AB)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_matricula: 'M-1234-AB' })
        expect(result.success).toBe(true)
    })

    it('rechaza matrícula con formato inválido', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_matricula: 'XXXX' })
        expect(result.success).toBe(false)
    })

    // ── Validaciones VIN/Bastidor ─────────────────────────

    it('acepta VIN de 17 caracteres válido', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_bastidor: 'WBAPH5C55BA123456' })
        expect(result.success).toBe(true)
    })

    it('rechaza VIN con menos de 17 caracteres', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_bastidor: 'ABC1234' })
        expect(result.success).toBe(false)
    })

    it('rechaza VIN con caracteres prohibidos (I, O, Q)', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_bastidor: 'WBAIH5C55BA12345O' })
        expect(result.success).toBe(false)
    })

    // ── Validaciones precio ──────────────────────────────

    it('rechaza precio negativo', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, precio_venta: -1000 })
        expect(result.success).toBe(false)
    })

    it('rechaza precio cero', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, precio_venta: 0 })
        expect(result.success).toBe(false)
    })

    it('acepta precio decimal', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, precio_venta: 15500.50 })
        expect(result.success).toBe(true)
    })

    // ── Validaciones tipo operación ──────────────────────

    it('acepta tipo compra', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, tipo_operacion: 'compra' })
        expect(result.success).toBe(true)
    })

    it('rechaza tipo operación inválido', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, tipo_operacion: 'alquiler' })
        expect(result.success).toBe(false)
    })

    // ── Campos requeridos ────────────────────────────────

    it('rechaza sin nombre de comprador', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, comprador_nombre: '' })
        expect(result.success).toBe(false)
    })

    it('rechaza sin marca del vehículo', () => {
        const result = crearContratoSchema.safeParse({ ...datosValidos, vehiculo_marca: '' })
        expect(result.success).toBe(false)
    })
})

describe('firmarContratoSchema', () => {
    const firmaValida = {
        token: '550e8400-e29b-41d4-a716-446655440000',
        firma_data: 'data:image/png;base64,' + 'A'.repeat(200),
        aceptar_terminos: true as const,
    }

    it('acepta datos de firma válidos', () => {
        const result = firmarContratoSchema.safeParse(firmaValida)
        expect(result.success).toBe(true)
    })

    it('rechaza firma vacía', () => {
        const result = firmarContratoSchema.safeParse({ ...firmaValida, firma_data: '' })
        expect(result.success).toBe(false)
    })

    it('rechaza firma demasiado corta', () => {
        const result = firmarContratoSchema.safeParse({ ...firmaValida, firma_data: 'corta' })
        expect(result.success).toBe(false)
    })

    it('rechaza sin aceptar términos', () => {
        const result = firmarContratoSchema.safeParse({ ...firmaValida, aceptar_terminos: false })
        expect(result.success).toBe(false)
    })

    it('rechaza token UUID inválido', () => {
        const result = firmarContratoSchema.safeParse({ ...firmaValida, token: 'no-es-uuid' })
        expect(result.success).toBe(false)
    })

    it('acepta token UUID válido', () => {
        const result = firmarContratoSchema.safeParse({
            ...firmaValida,
            token: '123e4567-e89b-12d3-a456-426614174000',
        })
        expect(result.success).toBe(true)
    })
})
