export interface Notificacion {
    id: string
    user_id: string
    empresa_id: string | null
    tipo: 'info' | 'success' | 'warning' | 'error'
    categoria: 'cliente' | 'factura' | 'pago' | 'recordatorio' | 'sistema'
    titulo: string
    mensaje: string
    leida: boolean
    enlace: string | null
    metadata: Record<string, string | number | boolean | null>
    created_at: string
}

export interface NotificacionCreate {
    user_id: string
    empresa_id?: string | null
    tipo: 'info' | 'success' | 'warning' | 'error'
    categoria: 'cliente' | 'factura' | 'pago' | 'recordatorio' | 'sistema'
    titulo: string
    mensaje: string
    enlace?: string | null
    metadata?: Record<string, string | number | boolean | null>
}
