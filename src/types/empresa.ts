export type TipoEmpresa =
    | 'autonomo'
    | 'sl' // Sociedad Limitada
    | 'sa' // Sociedad Anónima
    | 'cooperativa'
    | 'asociacion'
    | 'fundacion'
    | 'comunidad_bienes'
    | 'otro'

export type RegimenIVA =
    | 'general'
    | 'simplificado'
    | 'recargo_equivalencia'
    | 'exento'

export interface Empresa {
    id: string
    created_at: string
    updated_at: string

    // Datos fiscales
    razon_social: string
    nombre_comercial?: string
    cif: string
    tipo_empresa: TipoEmpresa

    // Dirección
    direccion?: string
    codigo_postal?: string
    ciudad?: string
    provincia?: string
    pais: string
    latitud?: number
    longitud?: number

    // Contacto
    telefono?: string
    email?: string
    web?: string

    // Logo
    logo_url?: string
    logo_filename?: string

    // Datos bancarios
    iban?: string
    swift?: string
    banco?: string
    titular_cuenta?: string

    // Configuración fiscal
    iva_predeterminado: number
    retencion_predeterminada: number
    regimen_iva: RegimenIVA
    aplica_recargo_equivalencia: boolean
    recargo_porcentaje: number

    // Configuración de facturación
    serie_predeterminada_id?: string
    dias_pago_predeterminados: number
    lugar_expedicion?: string
    plantilla_pdf_predeterminada_id?: string

    // Textos legales
    pie_factura?: string
    clausulas_generales?: string

    // Configuración de numeración
    formato_numero_factura: string

    // Configuración regional
    idioma_predeterminado: string
    zona_horaria: string
    formato_fecha: string
    separador_miles: string
    separador_decimales: string

    activo: boolean
}

export interface EmpresaFormData extends Omit<Empresa, 'id' | 'created_at' | 'updated_at'> { }
