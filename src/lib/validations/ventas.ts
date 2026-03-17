import { z } from 'zod'

export const LineaFacturaSchema = z.object({
    concepto: z.string().min(1, 'El concepto es obligatorio'),
    descripcion: z.string().optional(),
    cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
    precio_unitario: z.number().min(0, 'El precio no puede ser negativo'),
    descuento_porcentaje: z.number().min(0).max(100).default(0),
    iva_porcentaje: z.number().min(0).max(100).default(21),
})

export const GuardarBorradorSchema = z.object({
    cliente_id: z.string().uuid('Cliente inválido'),
    empresa_id: z.string().uuid('Empresa inválida'),
    serie: z.string().optional().nullable(),
    plantilla_pdf_id: z.string().uuid().optional().nullable(),
    fecha_emision: z.string().min(1, 'La fecha de emisión es obligatoria'),
    fecha_vencimiento: z.string().optional().nullable(),
    forma_pago: z.string().optional().nullable(),
    notas: z.string().optional().nullable(),
    descuento_tipo: z.enum(['porcentaje', 'fijo']).default('porcentaje'),
    descuento_valor: z.number().default(0),
    recargo_equivalencia: z.boolean().default(false),
    es_externa: z.boolean().default(false),
    numero_manual: z.string().optional().nullable(),
    archivo_url: z.string().optional().nullable(),
    recargo_porcentaje: z.number().min(0).default(5.2),
    retencion_porcentaje: z.number().min(-1).max(100).default(0), // Allow negative for IRPF -1%
    importe_descuento: z.number().optional().nullable(),
    importe_retencion: z.number().optional().nullable(),
    subtotal: z.number(),
    base_imponible: z.number(),
    iva: z.number(),
    total: z.number(),
    divisa: z.string().default('EUR'),
    tipo_cambio: z.number().min(0).default(1.0),
    lineas: z.array(LineaFacturaSchema).min(1, 'Debe haber al menos una línea'),
})

export const CrearFacturaSchema = GuardarBorradorSchema

export const EditarFacturaSchema = z.object({
    factura_id: z.string().uuid(),
    empresa_id: z.string().uuid(),
    cliente_id: z.string().uuid().optional().nullable(),
    fecha_emision: z.string().optional().nullable(),
    notas: z.string().optional().nullable(),
    serie: z.string().uuid().optional().nullable(),
    plantilla_pdf_id: z.string().uuid().optional().nullable(),
    divisa: z.string().optional().nullable(),
    tipo_cambio: z.number().min(0).optional().nullable(),
    lineas: z.array(LineaFacturaSchema).optional(),
    descuento_tipo: z.enum(['porcentaje', 'fijo']).optional().nullable(),
    descuento_valor: z.number().min(0).optional().nullable(),
    recargo_equivalencia: z.boolean().optional().nullable(),
    recargo_porcentaje: z.number().min(0).optional().nullable(),
    retencion_porcentaje: z.number().min(0).max(100).optional().nullable(),
    archivo_url: z.string().optional().nullable(),
    es_externa: z.boolean().optional(),
})

export const AnularFacturaSchema = z.object({
    facturaId: z.string().uuid(),
    motivo: z.string().min(1, 'El motivo es obligatorio'),
})

export const DuplicarFacturaSchema = z.object({
    facturaIdOriginal: z.string().uuid(),
    fechaEmision: z.string(),
    serie: z.string().min(1),
    mantenerCliente: z.boolean().default(true),
})

export const EliminarFacturaSchema = z.object({
    id: z.string().uuid(),
})
