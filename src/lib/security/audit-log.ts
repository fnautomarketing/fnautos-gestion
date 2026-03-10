/**
 * Logs de auditoría para operaciones sensibles.
 * En producción, integrar con servicio de logging (Datadog, Sentry, etc.)
 */
type AuditEvent = 'login' | 'logout' | 'export_clientes' | 'export_facturas' | 'cambio_empresa' | 'avatar_upload' | 'avatar_delete'

export function auditLog(event: AuditEvent, userId: string, details?: Record<string, unknown>) {
    const entry = {
        ts: new Date().toISOString(),
        event,
        userId,
        ...details,
    }
    if (process.env.NODE_ENV === 'production') {
        console.info('[AUDIT]', JSON.stringify(entry))
    } else {
        console.debug('[AUDIT]', entry)
    }
}
