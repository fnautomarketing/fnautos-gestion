import { z } from 'zod'

export const pagoSchema = z.object({
    factura_id: z.string().uuid(),
    importe: z.number().min(0.01, 'El importe debe ser mayor a 0'),
    fecha_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    metodo_pago: z.enum(['Transferencia', 'Tarjeta', 'Efectivo', 'Domiciliacion', 'Cheque']),
    referencia: z.string().max(255).optional(),
    cuenta_bancaria: z.string().max(100).optional(),
    notas: z.string().optional(),
    marcar_como_pagada: z.boolean().optional().default(false),
})

export type PagoFormData = z.infer<typeof pagoSchema>
