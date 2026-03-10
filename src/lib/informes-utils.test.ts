/**
 * Tests unitarios: describirPeriodo, formatFechaRango
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { describirPeriodo, formatFechaRango } from './informes-utils'

describe('describirPeriodo', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    test('este mes devuelve "Este mes"', () => {
        expect(describirPeriodo('2026-03-01', '2026-03-31')).toBe('Este mes')
    })

    test('mes anterior devuelve "Mes anterior"', () => {
        expect(describirPeriodo('2026-02-01', '2026-02-28')).toBe('Mes anterior')
    })

    test('este trimestre devuelve "Este trimestre"', () => {
        expect(describirPeriodo('2026-01-01', '2026-03-31')).toBe('Este trimestre')
    })

    test('últimos 12 meses devuelve "Últimos 12 meses"', () => {
        expect(describirPeriodo('2025-03-15', '2026-03-15')).toBe('Últimos 12 meses')
    })

    test('rango personalizado devuelve "Rango personalizado"', () => {
        expect(describirPeriodo('2026-01-10', '2026-02-20')).toBe('Rango personalizado')
    })
})

describe('formatFechaRango', () => {
    test('formatea fechas en español', () => {
        const result = formatFechaRango('2026-03-01', '2026-03-31')
        expect(result).toMatch(/mar/)
        expect(result).toMatch(/2026/)
    })
})
