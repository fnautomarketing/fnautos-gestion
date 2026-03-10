import { z } from 'zod'

// Esquema de validación para plantillas PDF siguiendo el patrón de serie-schema.ts
export const plantillaSchema = z.object({
    nombre: z.string().min(3, 'Mínimo 3 caracteres').max(255),
    descripcion: z.string().optional(),

    // Logo
    logo_url: z.string().url().optional().or(z.literal('')),
    logo_posicion: z.enum(['izquierda', 'centro', 'derecha']).default('izquierda'),
    logo_ancho: z.number().int().min(50).max(300).default(120),
    logo_alto: z.number().int().min(30).max(150).default(60),

    // Colores
    color_primario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#1a365d'),
    color_secundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#718096'),
    color_encabezado_tabla: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#2d3748'),

    // Fuente
    fuente: z.enum(['Helvetica', 'Times-Roman', 'Courier', 'Arial']).default('Helvetica'),
    tamano_fuente_base: z.number().int().min(8).max(14).default(10),

    // Estructura - campos booleanos
    idiomas: z.array(z.enum(['es', 'en', 'fr', 'de', 'pt'])).min(1).default(['es']),
    mostrar_numero_factura: z.boolean().default(true),
    mostrar_fecha_emision: z.boolean().default(true),
    mostrar_fecha_vencimiento: z.boolean().default(true),
    mostrar_datos_bancarios: z.boolean().default(true),
    mostrar_notas: z.boolean().default(true),
    mostrar_qr_pago: z.boolean().default(false),
    alternar_color_filas: z.boolean().default(true),
    mostrar_firma: z.boolean().default(false),
    mostrar_sello: z.boolean().default(false),

    // Textos personalizados
    texto_cabecera: z.string().optional(),
    texto_pie: z.string().optional(),

    // Estado
    activa: z.boolean().default(true),
    predeterminada: z.boolean().default(false),
})

export type PlantillaFormData = z.infer<typeof plantillaSchema>
