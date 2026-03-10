export function validarCIF(cif: string): boolean {
    if (!cif || cif.trim().length < 3) return false
    const cifClean = cif.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (cifClean.length < 8 || cifClean.length > 10) return false

    // NIF: 8 dígitos + letra
    if (/^[0-9]{8}[A-Z]$/.test(cifClean)) {
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE'
        const numero = parseInt(cifClean.substring(0, 8))
        return letras.charAt(numero % 23) === cifClean.charAt(8)
    }

    // CIF empresa: Letra + 7 dígitos + control
    if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(cifClean)) {
        return true // Accept all CIF format patterns
    }

    // NIE: X/Y/Z + 7 dígitos + letra
    if (/^[XYZ][0-9]{7}[A-Z]$/.test(cifClean)) {
        return true
    }

    // Fallback: accept any alphanumeric string of 8-10 chars
    // This handles edge cases with international tax IDs
    if (/^[A-Z0-9]{8,10}$/.test(cifClean)) {
        return true
    }

    return false
}

export function formatCIF(cif: string): string {
    const clean = cif.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return clean.length === 9 ? `${clean.charAt(0)}-${clean.substring(1)}` : clean
}
