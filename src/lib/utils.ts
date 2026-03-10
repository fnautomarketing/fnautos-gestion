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
