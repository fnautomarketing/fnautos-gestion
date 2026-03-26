import { describe, it, expect } from 'vitest'
import {
    generarNumeroContrato,
    extraerSecuencialContrato,
    isTokenExpirado,
    calcularIVA,
    precioEnLetras,
} from './contrato-utils'

describe('generarNumeroContrato', () => {
    it('genera el primer número: CV-2026-00001', () => {
        expect(generarNumeroContrato(0, 2026)).toBe('CV-2026-00001')
    })

    it('genera números incrementales', () => {
        expect(generarNumeroContrato(41, 2026)).toBe('CV-2026-00042')
    })

    it('formatea con ceros a la izquierda', () => {
        expect(generarNumeroContrato(8, 2026)).toBe('CV-2026-00009')
    })

    it('funciona para números grandes', () => {
        expect(generarNumeroContrato(99999, 2026)).toBe('CV-2026-100000')
    })

    it('usa el año correcto', () => {
        expect(generarNumeroContrato(0, 2027)).toBe('CV-2027-00001')
    })
})

describe('extraerSecuencialContrato', () => {
    it('extrae el número secuencial', () => {
        expect(extraerSecuencialContrato('CV-2026-00042')).toBe(42)
    })

    it('extrae primer número', () => {
        expect(extraerSecuencialContrato('CV-2026-00001')).toBe(1)
    })

    it('retorna 0 para formato inválido', () => {
        expect(extraerSecuencialContrato('INVALID')).toBe(0)
    })

    it('retorna 0 para string vacío', () => {
        expect(extraerSecuencialContrato('')).toBe(0)
    })
})

describe('isTokenExpirado', () => {
    it('retorna false si no hay fecha de expiración', () => {
        expect(isTokenExpirado(null)).toBe(false)
    })

    it('retorna true si el token ha expirado (ayer)', () => {
        const ayer = new Date(Date.now() - 86400000).toISOString()
        expect(isTokenExpirado(ayer)).toBe(true)
    })

    it('retorna false si el token no ha expirado (mañana)', () => {
        const manana = new Date(Date.now() + 86400000).toISOString()
        expect(isTokenExpirado(manana)).toBe(false)
    })

    it('retorna true si expiró hace 1 minuto', () => {
        const haceUnMinuto = new Date(Date.now() - 60000).toISOString()
        expect(isTokenExpirado(haceUnMinuto)).toBe(true)
    })
})

describe('calcularIVA', () => {
    it('calcula IVA al 21%', () => {
        const { ivaImporte, totalConIva } = calcularIVA(10000, 21)
        expect(ivaImporte).toBe(2100)
        expect(totalConIva).toBe(12100)
    })

    it('calcula IVA al 0% (entre particulares)', () => {
        const { ivaImporte, totalConIva } = calcularIVA(15000, 0)
        expect(ivaImporte).toBe(0)
        expect(totalConIva).toBe(15000)
    })

    it('calcula IVA reducido al 10%', () => {
        const { ivaImporte, totalConIva } = calcularIVA(5000, 10)
        expect(ivaImporte).toBe(500)
        expect(totalConIva).toBe(5500)
    })

    it('maneja decimales correctamente', () => {
        const { ivaImporte, totalConIva } = calcularIVA(9999.99, 21)
        expect(ivaImporte).toBe(2100)
        expect(totalConIva).toBe(12099.99)
    })
})

describe('precioEnLetras', () => {
    it('convierte 1000 a "MIL EUROS"', () => {
        expect(precioEnLetras(1000)).toBe('MIL EUROS')
    })

    it('convierte 15000 a "QUINCE MIL EUROS"', () => {
        expect(precioEnLetras(15000)).toBe('QUINCE MIL EUROS')
    })

    it('convierte 100 a "CIEN EUROS"', () => {
        expect(precioEnLetras(100)).toBe('CIEN EUROS')
    })

    it('convierte 1 a "UN EUROS"', () => {
        expect(precioEnLetras(1)).toBe('UN EUROS')
    })

    it('convierte 21 a "VEINTIUN EUROS"', () => {
        const result = precioEnLetras(21)
        expect(result).toContain('VEINTI')
        expect(result).toContain('EUROS')
    })

    it('convierte número con céntimos', () => {
        const result = precioEnLetras(1500.50)
        expect(result).toContain('MIL QUINIENTOS EUROS')
        expect(result).toContain('CINCUENTA CÉNTIMOS')
    })

    it('convierte 0 a "CERO EUROS"', () => {
        expect(precioEnLetras(0)).toBe('CERO EUROS')
    })

    it('convierte 1000000 a "UN MILLÓN EUROS"', () => {
        expect(precioEnLetras(1000000)).toBe('UN MILLÓN EUROS')
    })
})
