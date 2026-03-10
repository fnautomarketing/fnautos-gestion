import { Factura } from './ventas'

export type TipoRectificativa = 'total' | 'parcial' | 'error'

export interface FacturaRectificativa extends Factura {
    es_rectificativa: true
    factura_rectificada_id: string
    tipo_rectificativa: TipoRectificativa
    motivo_rectificacion: string
    generar_abono_automatico: boolean
}

export interface FacturaRectificativaInput {
    factura_original_id: string
    tipo_rectificativa: TipoRectificativa
    motivo: string
    lineas_a_rectificar?: string[] // IDs de líneas (para tipo parcial)
    generar_abono: boolean
    serie_id?: string
    fecha_emision?: string
}

export interface LineaRectificada {
    id: string
    descripcion: string
    cantidad: number
    subtotal: number
    importe_iva: number
    total: number
    seleccionada?: boolean
}
