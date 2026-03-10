/**
 * Sanitiza strings para uso en filtros .ilike() / .or() de Supabase/PostgREST.
 * Escapa % y _ (comodines de LIKE) para evitar ReDoS y filtros inesperados.
 * Limita longitud y caracteres peligrosos.
 */
const MAX_SEARCH_LENGTH = 200
const DANGEROUS_PATTERN = /[%_\\'";\x00-\x1f]/g

export function sanitizeSearchInput(input: string | null | undefined): string {
    if (input == null || typeof input !== 'string') return ''
    let s = input.trim().slice(0, MAX_SEARCH_LENGTH)
    // Escapar comodines LIKE: % -> \% , _ -> \_
    s = s.replace(/%/g, '\\%').replace(/_/g, '\\_')
    // Eliminar caracteres de control y comillas
    s = s.replace(DANGEROUS_PATTERN, '')
    return s
}

/**
 * Valida que una URL sea segura para usar en href (solo http/https).
 * Evita javascript:, data:, etc.
 */
export function isSafeUrl(url: string | null | undefined): url is string {
    if (url == null || typeof url !== 'string') return false
    const trimmed = url.trim()
    if (!trimmed) return false
    try {
        const parsed = new URL(trimmed)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}
