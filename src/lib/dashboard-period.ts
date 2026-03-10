/**
 * Cálculo de rangos de fechas para el dashboard (mes actual, anterior, trimestre, YTD, último año, custom).
 * Vista Semana/Mes: cuando vista=semana los KPIs usan últimos 7 días; cuando vista=mes usan el período elegido.
 * Uso en Server (dashboard page) y en Client (selector).
 */

export type PeriodoValue = 'actual' | 'anterior' | 'trimestre' | 'ytd' | 'ultimo_anio' | 'custom'

/** Vista de agrupación: semana = últimos 7 días, mes = período seleccionado (mes/trimestre/año). */
export type VistaValue = 'semana' | 'mes'

export function getRangeForPeriodo(
    periodo: PeriodoValue,
    customDesde?: string,
    customHasta?: string
): { desde: string; hasta: string } {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    switch (periodo) {
        case 'actual': {
            const start = new Date(year, month, 1)
            const end = new Date(year, month + 1, 0)
            return { desde: start.toISOString().slice(0, 10), hasta: end.toISOString().slice(0, 10) }
        }
        case 'anterior': {
            const start = new Date(year, month - 1, 1)
            const end = new Date(year, month, 0)
            return { desde: start.toISOString().slice(0, 10), hasta: end.toISOString().slice(0, 10) }
        }
        case 'trimestre': {
            const q = Math.floor(month / 3) + 1
            const start = new Date(year, (q - 1) * 3, 1)
            const end = new Date(year, q * 3, 0)
            return { desde: start.toISOString().slice(0, 10), hasta: end.toISOString().slice(0, 10) }
        }
        case 'ytd': {
            const start = new Date(year, 0, 1)
            const end = new Date(now)
            return { desde: start.toISOString().slice(0, 10), hasta: end.toISOString().slice(0, 10) }
        }
        case 'ultimo_anio': {
            const end = new Date(now)
            const start = new Date(now)
            start.setMonth(start.getMonth() - 12)
            return { desde: start.toISOString().slice(0, 10), hasta: end.toISOString().slice(0, 10) }
        }
        case 'custom':
            return {
                desde: customDesde || new Date(year, month, 1).toISOString().slice(0, 10),
                hasta: customHasta || new Date(year, month + 1, 0).toISOString().slice(0, 10),
            }
        default:
            return getRangeForPeriodo('actual')
    }
}

/** Últimos 7 días (hoy incluido). Para vista=semana. */
export function getRangeForVistaSemana(): { desde: string; hasta: string } {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return {
        desde: start.toISOString().slice(0, 10),
        hasta: end.toISOString().slice(0, 10),
    }
}

/** Parsea searchParams y devuelve periodo + vista + fechas (para uso en Server Component). */
export function parseDashboardPeriod(searchParams: { periodo?: string; vista?: string; desde?: string; hasta?: string } | null) {
    const periodo = (searchParams?.periodo as PeriodoValue) || 'actual'
    const vista = (searchParams?.vista as VistaValue) === 'semana' ? 'semana' : 'mes'

    if (vista === 'semana') {
        const range = getRangeForVistaSemana()
        return { periodo, vista, desde: range.desde, hasta: range.hasta }
    }

    if (periodo === 'custom' && searchParams?.desde && searchParams?.hasta) {
        return {
            periodo: 'custom' as const,
            vista,
            desde: searchParams.desde,
            hasta: searchParams.hasta,
        }
    }

    const range = getRangeForPeriodo(periodo, searchParams?.desde, searchParams?.hasta)
    return { periodo, vista, desde: range.desde, hasta: range.hasta }
}
