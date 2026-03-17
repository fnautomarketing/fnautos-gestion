import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Número de factura para mostrar: evita duplicar serie si numero ya la incluye (ej. "F2026-0004"). */
export function formatFacturaDisplayNumero(serie: string | null | undefined, numero: string | null | undefined): string {
  if (!numero) return '-'
  if (serie && numero.startsWith(serie + '-')) return numero
  if (serie) return `${serie}-${numero}`
  return numero
}

export function formatCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function isVencida(fechaVencimiento: string | Date | null | undefined): boolean {
  if (!fechaVencimiento) return false
  const vencimiento = typeof fechaVencimiento === 'string' ? new Date(fechaVencimiento) : fechaVencimiento
  const hoy = new Date()
  // Resetear horas para comparar solo fechas
  hoy.setHours(0, 0, 0, 0)
  vencimiento.setHours(0, 0, 0, 0)
  return vencimiento < hoy
}
