import { Tables } from './supabase'

// Patching Factura type until supabase types are regenerated
export type Factura = Tables<'facturas'> & {
    descuento_tipo?: 'porcentaje' | 'fijo' | null
    descuento_valor?: number | null
    importe_descuento?: number | null
    recargo_equivalencia?: boolean | null
    recargo_porcentaje?: number | null
    importe_recargo?: number | null
    retencion_porcentaje?: number | null
    plantilla_pdf_id?: string | null
    empresa_id: string
    divisa?: string | null
    tipo_cambio?: number | null
    es_externa?: boolean | null
    archivo_url?: string | null
    numero_manual?: string | null
}
export type Cliente = Tables<'clientes'> & {
    email_principal: string
    telefono_principal?: string | null
    total_facturado?: number
    created_at: string
    activo: boolean
}
export type LineaFactura = Tables<'lineas_factura'>
export type PagoFactura = Tables<'pagos_factura'>
export type EventoFactura = Tables<'eventos_factura'>
export type ConceptoCatalogo = Tables<'conceptos_catalogo'>

export interface FacturaWithCliente extends Factura {
    cliente: Cliente | null
}

export interface FacturaCompleta extends Factura {
    cliente: Cliente | null
    lineas: LineaFactura[]
    pagos: PagoFactura[]
    eventos: EventoFactura[]
}

export interface Serie {
    id: string
    empresa_id: string
    codigo: string
    nombre: string
    predeterminada: boolean
    activa: boolean
    created_at?: string
    icono?: string
    siguiente_numero?: number
}

// Alias for generic "Change" event if needed, but EventoFactura is the DB type
export type Cambio = EventoFactura

export interface Pago {
    id: string
    empresa_id: string
    factura_id: string
    importe: number
    fecha_pago: string
    metodo_pago: string
    referencia: string | null
    cuenta_bancaria: string | null
    conciliado: boolean
    fecha_conciliacion: string | null
    comprobante_url: string | null
    notas: string | null
    creado_por: string
    anulado: boolean
    fecha_anulacion: string | null
    motivo_anulacion: string | null
    created_at: string
    updated_at: string
}

