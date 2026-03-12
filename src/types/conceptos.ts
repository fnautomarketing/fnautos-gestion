export interface ConceptoCatalogo {
    id: string
    empresa_id: string
    codigo: string
    nombre: string
    descripcion: string | null
    categoria: 'transporte' | 'almacenaje' | 'logistica' | 'material' | 'otros'
    tipo: 'servicio' | 'producto'
    precio_base: number
    iva_porcentaje: number
    coste_interno: number | null
    activo: boolean
    destacado: boolean
    veces_usado: number
    ultima_vez_usado: string | null
    created_at: string
    updated_at: string
}
