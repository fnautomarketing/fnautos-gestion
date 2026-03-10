import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subYears, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

/** Detecta descripción amigable del período (como SAP, Oracle, Power BI) */
export function describirPeriodo(fechaDesde: string, fechaHasta: string): string {
    const d = new Date(fechaDesde)
    const h = new Date(fechaHasta)
    const hoy = new Date()

    const esEsteMes = isSameDay(d, startOfMonth(hoy)) && isSameDay(h, endOfMonth(hoy))
    const mesAnt = subMonths(hoy, 1)
    const esMesAnterior = isSameDay(d, startOfMonth(mesAnt)) && isSameDay(h, endOfMonth(mesAnt))
    const esEsteTrimestre = isSameDay(d, startOfQuarter(hoy)) && isSameDay(h, endOfQuarter(hoy))
    const haceUnAnio = subYears(hoy, 1)
    const esUltimos12Meses = Math.abs(d.getTime() - haceUnAnio.getTime()) < 2 * 24 * 60 * 60 * 1000 && Math.abs(h.getTime() - hoy.getTime()) < 2 * 24 * 60 * 60 * 1000

    if (esEsteMes) return 'Este mes'
    if (esMesAnterior) return 'Mes anterior'
    if (esEsteTrimestre) return 'Este trimestre'
    if (esUltimos12Meses) return 'Últimos 12 meses'
    return 'Rango personalizado'
}

/** Formatea rango de fechas para display */
export function formatFechaRango(fechaDesde: string, fechaHasta: string): string {
    const d = new Date(fechaDesde)
    const h = new Date(fechaHasta)
    return `${format(d, 'd MMM yyyy', { locale: es })} – ${format(h, 'd MMM yyyy', { locale: es })}`
}
