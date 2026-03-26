// ╔══════════════════════════════════════════════════════════╗
// ║  Types — Contratos de compraventa de vehículos          ║
// ╚══════════════════════════════════════════════════════════╝

// ── Enums ─────────────────────────────────────────────────
export type TipoOperacion = 'compra' | 'venta'
export type EstadoContrato = 'borrador' | 'pendiente_firma' | 'firmado' | 'anulado'
export type CombustibleVehiculo = 'gasolina' | 'diesel' | 'hibrido' | 'electrico' | 'gnc' | 'glp' | 'otro'
export type FormaPago = 'efectivo' | 'transferencia' | 'cheque' | 'financiacion' | 'mixto'

// ── Documentos que se pueden entregar con el vehículo ────
export const DOCUMENTOS_ENTREGABLES = [
    'Permiso de circulación',
    'Ficha técnica',
    'Informe ITV vigente',
    'Último recibo IVTM',
    'Manual del propietario',
    'Libro de mantenimiento',
    'Llaves de repuesto',
    'Mando de garaje',
] as const

// ── Type principal del contrato ──────────────────────────
export interface Contrato {
    id: string
    empresa_id: string
    numero_contrato: string
    tipo_operacion: TipoOperacion
    estado: EstadoContrato

    // Datos del comprador
    comprador_nombre: string
    comprador_nif: string
    comprador_direccion: string | null
    comprador_ciudad: string | null
    comprador_codigo_postal: string | null
    comprador_telefono: string | null
    comprador_email: string | null

    // Datos del vendedor
    vendedor_nombre: string
    vendedor_nif: string
    vendedor_direccion: string | null
    vendedor_ciudad: string | null
    vendedor_codigo_postal: string | null
    vendedor_telefono: string | null
    vendedor_email: string | null

    // Datos del vehículo
    vehiculo_marca: string
    vehiculo_modelo: string
    vehiculo_version: string | null
    vehiculo_matricula: string
    vehiculo_bastidor: string
    vehiculo_fecha_matriculacion: string | null
    vehiculo_kilometraje: number | null
    vehiculo_color: string | null
    vehiculo_combustible: CombustibleVehiculo | null

    // Condiciones económicas
    precio_venta: number
    precio_letras: string | null
    forma_pago: FormaPago | null
    iva_porcentaje: number
    iva_importe: number
    total_con_iva: number | null

    // Estado y declaraciones
    vehiculo_estado_declarado: string | null
    vehiculo_libre_cargas: boolean
    documentacion_entregada: string[]
    clausulas_adicionales: string | null

    // Firma digital
    token_firma: string | null
    token_firma_expira: string | null
    firma_comprador_data: string | null
    firma_vendedor_data: string | null
    firmado_en: string | null
    firma_ip: string | null
    firma_user_agent: string | null

    // PDF
    pdf_borrador_url: string | null
    pdf_firmado_url: string | null

    // Relación con cliente
    cliente_id: string | null

    // Metadata
    creado_por: string | null
    notas_internas: string | null
    created_at: string
    updated_at: string
}

// ── Contrato con datos del cliente (join) ────────────────
export interface ContratoConCliente extends Contrato {
    cliente?: {
        nombre_fiscal: string | null
        cif: string | null
        email_principal: string | null
        telefono_principal: string | null
    } | null
}

// ── Contrato para la página pública de firma ─────────────
// Solo datos necesarios, sin info sensible interna
export interface ContratoParaFirma {
    id: string
    numero_contrato: string
    tipo_operacion: TipoOperacion
    estado: EstadoContrato

    comprador_nombre: string
    comprador_nif: string
    vendedor_nombre: string
    vendedor_nif: string

    vehiculo_marca: string
    vehiculo_modelo: string
    vehiculo_version: string | null
    vehiculo_matricula: string
    vehiculo_bastidor: string
    vehiculo_kilometraje: number | null
    vehiculo_color: string | null
    vehiculo_combustible: CombustibleVehiculo | null

    precio_venta: number
    iva_porcentaje: number
    iva_importe: number
    total_con_iva: number | null
    forma_pago: FormaPago | null

    token_firma_expira: string | null
}

// ── Labels para UI ───────────────────────────────────────
export const ESTADO_LABELS: Record<EstadoContrato, string> = {
    borrador: 'Borrador',
    pendiente_firma: 'Pendiente de firma',
    firmado: 'Firmado',
    anulado: 'Anulado',
}

export const ESTADO_COLORS: Record<EstadoContrato, string> = {
    borrador: 'bg-slate-100 text-slate-700',
    pendiente_firma: 'bg-amber-100 text-amber-800',
    firmado: 'bg-emerald-100 text-emerald-800',
    anulado: 'bg-red-100 text-red-700',
}

export const TIPO_LABELS: Record<TipoOperacion, string> = {
    compra: 'Compra',
    venta: 'Venta',
}

export const TIPO_COLORS: Record<TipoOperacion, string> = {
    compra: 'bg-blue-100 text-blue-800',
    venta: 'bg-green-100 text-green-800',
}

export const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia bancaria',
    cheque: 'Cheque',
    financiacion: 'Financiación',
    mixto: 'Pago mixto',
}

export const COMBUSTIBLE_LABELS: Record<CombustibleVehiculo, string> = {
    gasolina: 'Gasolina',
    diesel: 'Diésel',
    hibrido: 'Híbrido',
    electrico: 'Eléctrico',
    gnc: 'GNC',
    glp: 'GLP',
    otro: 'Otro',
}
