import { z } from 'zod'

export const facturaRectificativaSchema = z.object({
    factura_original_id: z.string().uuid(),
    tipo_rectificativa: z.enum(['total', 'parcial', 'error']),
    motivo: z.string().min(20, 'El motivo debe tener al menos 20 caracteres'),
    lineas_a_rectificar: z.array(z.string().uuid()).optional(),
    generar_abono: z.boolean().default(true),
}).refine((data) => {
    if (data.tipo_rectificativa === 'parcial') {
        return data.lineas_a_rectificar && data.lineas_a_rectificar.length > 0
    }
    return true
}, {
    message: 'Debe seleccionar al menos una línea para rectificación parcial',
    path: ['lineas_a_rectificar'],
})

export type FacturaRectificativaFormData = z.infer<typeof facturaRectificativaSchema>
