import { describe, it, expect } from 'vitest'
import { clienteSchema } from './cliente-schema'

describe('clienteSchema', () => {
    it('debe validar un cliente completo válido', () => {
        const validClient = {
            nombre_fiscal: 'Empresa Test S.L.',
            cif: 'A08001851', // CIF válido
            direccion: 'Calle Test 123',
            codigo_postal: '28001',
            ciudad: 'Madrid',
            pais: 'España',
            telefono_principal: '600123456',
            email_principal: 'test@empresa.com',
            tipo_cliente: 'empresa',
            dias_vencimiento: 30,
            iva_aplicable: 21
        }

        const result = clienteSchema.safeParse(validClient)
        expect(result.success).toBe(true)
    })

    it('debe fallar si falta nombre fiscal', () => {
        const invalidClient = {
            cif: 'A08001851'
        }
        const result = clienteSchema.safeParse(invalidClient)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('nombre_fiscal')
        }
    })

    it('debe validar cliente sin teléfono (opcional)', () => {
        const clientSinTelefono = {
            nombre_fiscal: 'ROIELLA S.L',
            cif: 'B60710282',
            direccion: 'AVD.prat de la riba 180 nv 7',
            codigo_postal: '08780',
            ciudad: 'Palleja',
            email_principal: 'contacto@roiella.es',
        }
        const result = clienteSchema.safeParse(clientSinTelefono)
        expect(result.success).toBe(true)
    })

    it('debe fallar con email inválido', () => {
        const client = {
            nombre_fiscal: 'Test',
            cif: 'A08001851',
            direccion: 'Calle',
            codigo_postal: '28001',
            ciudad: 'Madrid',
            telefono_principal: '600',
            email_principal: 'no-es-un-email'
        }
        const result = clienteSchema.safeParse(client)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues.some(i => i.path.includes('email_principal'))).toBe(true)
        }
    })
})
