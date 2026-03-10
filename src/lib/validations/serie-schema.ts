import { z } from 'zod'

export const serieSchema = z.object({
    codigo: z.string().min(1).max(20).regex(/^[A-Z0-9-_]+$/, 'Solo mayúsculas, números, guiones y guiones bajos'),
    nombre: z.string().min(3).max(255),
    descripcion: z.string().optional(),
    icono: z.string().max(10).optional(),

    prefijo: z.string().max(50).optional(),
    sufijo: z.string().max(50).optional(),
    numero_inicial: z.number().int().min(1).default(1),
    digitos: z.number().int().min(1).max(10).default(3),

    tipo: z.enum(['general', 'rectificativa', 'exportacion', 'proforma']).default('general'),
    reseteo: z.enum(['nunca', 'anual', 'manual']).default('anual'),
    activa: z.boolean().default(true),
    predeterminada: z.boolean().default(false),
})

export type SerieFormData = z.infer<typeof serieSchema>
