import { z } from 'zod'

export const pagoSchema = z.object({
    factura_id: z.string().uuid(),
    importe: z.number().min(0.01, 'El importe debe ser mayor a 0'),
    fecha_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    metodo_pago: z.enum(['transferencia', 'tarjeta', 'efectivo', 'domiciliacion', 'cheque', 'otro']),
    referencia: z.string().max(255).optional(),
    cuenta_bancaria: z.string().max(100).optional(),
    notas: z.string().optional(),
    conciliado: z.boolean().default(false),
    marcar_como_pagada: z.boolean().default(false),
})

export type PagoFormData = z.infer<typeof pagoSchema>
