import { describe, it, expect } from 'vitest'
import { validarCIF } from './cif-validator'

describe('validarCIF', () => {
    it('debe validar un CIF de empresa válido', () => {
        // Ejemplos reales o matemáticamente válidos
        expect(validarCIF('B12345678')).toBe(false) // Falso, checksum incorrecto
        expect(validarCIF('A08001851')).toBe(true) // FC Barcelona (ejemplo público)
    })

    it('debe validar un NIF de persona física válido', () => {
        // Algoritmo DNI: 12345678Z -> 12345678 % 23 = 14 -> Z
        expect(validarCIF('12345678Z')).toBe(true)
    })

    it('debe rechazar formatos inválidos', () => {
        expect(validarCIF('')).toBe(false)
        expect(validarCIF('123')).toBe(false)
        expect(validarCIF('ABCDEFG')).toBe(false)
    })

    it('debe rechazar CIFs con checksum incorrecto', () => {
        expect(validarCIF('A08001852')).toBe(false) // Modificado el último dígito
    })
})
