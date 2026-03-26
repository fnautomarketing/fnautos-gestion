// ╔══════════════════════════════════════════════════════════╗
// ║  Utilidades — Contratos de compraventa                  ║
// ╚══════════════════════════════════════════════════════════╝

/**
 * Genera el siguiente número de contrato para una empresa.
 * Formato: CV-YYYY-XXXXX
 * Ejemplo: CV-2026-00001, CV-2026-00042
 */
export function generarNumeroContrato(ultimoNumero: number, año: number): string {
    const siguiente = ultimoNumero + 1
    return `CV-${año}-${String(siguiente).padStart(5, '0')}`
}

/**
 * Extrae el número secuencial de un número de contrato.
 * Ejemplo: "CV-2026-00042" → 42
 */
export function extraerSecuencialContrato(numeroContrato: string): number {
    const match = numeroContrato.match(/CV-\d{4}-(\d{5})/)
    return match ? parseInt(match[1], 10) : 0
}

/**
 * Verifica si un token de firma ha expirado.
 */
export function isTokenExpirado(expira: string | null): boolean {
    if (!expira) return false
    return new Date(expira) < new Date()
}

/**
 * Calcula el IVA y total con IVA.
 */
export function calcularIVA(precioBase: number, ivaPorcentaje: number): {
    ivaImporte: number
    totalConIva: number
} {
    const ivaImporte = +(precioBase * ivaPorcentaje / 100).toFixed(2)
    const totalConIva = +(precioBase + ivaImporte).toFixed(2)
    return { ivaImporte, totalConIva }
}

// ── Conversión de número a letras (español) ─────────────

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const ESPECIALES = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE']
const DECENAS_PREFIJO = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function convertirGrupo(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'CIEN'

    const c = Math.floor(n / 100)
    const resto = n % 100

    let resultado = CENTENAS[c]

    if (resto === 0) return resultado

    if (c > 0) resultado += ' '

    if (resto < 10) {
        resultado += UNIDADES[resto]
    } else if (resto < 16) {
        resultado += ESPECIALES[resto - 10]
    } else if (resto < 20) {
        resultado += 'DIECI' + UNIDADES[resto - 10].toLowerCase()
        // Capitalize: DIECISEIS, etc.
        resultado = resultado.replace(/dieci/, 'DIECI')
    } else {
        const d = Math.floor(resto / 10)
        const u = resto % 10
        if (d === 2 && u > 0) {
            resultado += 'VEINTI' + UNIDADES[u]
        } else if (u === 0) {
            resultado += DECENAS_PREFIJO[d]
        } else {
            resultado += DECENAS_PREFIJO[d] + ' Y ' + UNIDADES[u]
        }
    }

    return resultado
}

function convertirNumero(n: number): string {
    if (n === 0) return 'CERO'
    if (n < 0) return 'MENOS ' + convertirNumero(Math.abs(n))

    let resultado = ''

    // Millones
    const millones = Math.floor(n / 1000000)
    if (millones > 0) {
        if (millones === 1) {
            resultado += 'UN MILLÓN '
        } else {
            resultado += convertirGrupo(millones) + ' MILLONES '
        }
    }

    // Miles
    const miles = Math.floor((n % 1000000) / 1000)
    if (miles > 0) {
        if (miles === 1) {
            resultado += 'MIL '
        } else {
            resultado += convertirGrupo(miles) + ' MIL '
        }
    }

    // Unidades
    const unidades = n % 1000
    if (unidades > 0) {
        resultado += convertirGrupo(unidades)
    }

    return resultado.trim()
}

/**
 * Convierte un precio numérico a texto en español para contratos legales.
 * Ejemplo: 15500.50 → "QUINCE MIL QUINIENTOS EUROS CON CINCUENTA CÉNTIMOS"
 */
export function precioEnLetras(precio: number): string {
    const euros = Math.floor(Math.abs(precio))
    const centimos = Math.round((Math.abs(precio) - euros) * 100)

    let resultado = convertirNumero(euros) + ' EUROS'
    if (centimos > 0) {
        resultado += ' CON ' + convertirNumero(centimos) + ' CÉNTIMOS'
    }
    return resultado
}
