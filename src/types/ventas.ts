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
    // Campos calculados o adicionales que vienen de la DB
    base_imponible?: number | null
    cuota_iva?: number | null
    descuento?: number | null
    retencion_irpf?: number | null
}
export type Cliente = Tables<'clientes'> & {
    email_principal: string
    telefono_principal?: string | null
    total_facturado?: number
    created_at: string
    activo: boolean
}
export type LineaFactura = Tables<'lineas_factura'>
export type PagoFactura = Tables<'pagos'>
export type EventoFactura = Tables<'eventos_factura'>
export type ConceptoCatalogo = Tables<'conceptos_catalogo'>
export type UsuarioEmpresa = Tables<'usuarios_empresas'>
export type EmailFactura = Tables<'emails_factura'>

export interface FacturaWithCliente extends Factura {
    cliente: Cliente | null
    empresa?: {
        nombre_comercial: string | null
        razon_social: string | null
    } | null
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
    icono: string | null
    prefijo: string | null
    sufijo: string | null
    numero_actual: number
    numero_inicial: number
    digitos: number
    tipo: 'general' | 'rectificativa' | 'exportacion' | 'proforma'
    reseteo: 'anual' | 'nunca' | 'mensual' | 'manual'
    facturas_emitidas: number
    created_at: string
    updated_at: string
}

export interface SerieWithEmpresa extends Serie {
    empresa: {
        razon_social: string | null
        nombre_comercial: string | null
    } | null
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

export interface FacturaVencida {
    id: string
    serie: string
    numero: number
    cliente_id: string
    cliente_nombre: string
    cliente_email: string | null
    cliente_telefono: string | null
    fecha_emision: string
    fecha_vencimiento: string
    dias_vencido: number
    total: number
    pendiente: number
    nivel_criticidad: 'atencion' | 'urgente' | 'critico'
    fecha_ultimo_recordatorio: string | null
}
export interface PlantillaPDF {
    id: string
    empresa_id: string
    nombre: string
    descripcion: string | null
    activa: boolean
    predeterminada: boolean
    color_primario: string
    color_secundario: string
    color_encabezado_tabla: string
    alternar_color_filas: boolean
    logo_url: string | null
    logo_posicion: 'izquierda' | 'centro' | 'derecha'
    logo_ancho: number
    logo_alto: number
    fuente: string
    tamano_fuente_base: number
    mostrar_numero_factura: boolean
    mostrar_fecha_emision: boolean
    mostrar_fecha_vencimiento: boolean
    mostrar_notas: boolean
    mostrar_datos_bancarios: boolean
    mostrar_firma: boolean
    mostrar_sello: boolean
    mostrar_qr_pago: boolean
    idiomas: string[]
    texto_cabecera: string | null
    texto_pie: string | null
    facturas_generadas: number
    created_at: string
    updated_at: string
}
