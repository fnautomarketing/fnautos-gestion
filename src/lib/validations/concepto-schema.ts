import { z } from 'zod'

export const conceptoSchema = z.object({
    codigo: z.union([z.string().min(1).max(50), z.literal('')]).optional().transform(e => e === '' ? undefined : e), // Auto si vacío
    nombre: z.string().min(3).max(255),
    descripcion: z.string().optional(),

    categoria: z.enum(['transporte', 'almacenaje', 'logistica', 'material', 'otros']),
    tipo: z.enum(['servicio', 'producto']).default('servicio'),

    precio_base: z.number().min(0),
    iva_porcentaje: z.number().min(0).max(100).default(21),
    unidad_medida: z.enum(['servicio', 'hora', 'dia', 'unidad', 'kg', 'm2', 'm3', 'km', 'otro']).default('servicio'),

    codigo_interno: z.string().max(100).optional(),
    proveedor: z.string().max(255).optional(),
    coste_interno: z.number().min(0).optional(),

    activo: z.boolean().default(true),
    destacado: z.boolean().default(false),

    notas_internas: z.string().optional(),
})

export type ConceptoFormData = z.infer<typeof conceptoSchema>

export const importCSVSchema = z.object({
    codigo: z.string(),
    nombre: z.string(),
    descripcion: z.string().optional(),
    categoria: z.enum(['transporte', 'almacenaje', 'logistica', 'material', 'otros']),
    tipo: z.enum(['servicio', 'producto']),
    precio_base: z.number(),
    iva_porcentaje: z.number(),
})
