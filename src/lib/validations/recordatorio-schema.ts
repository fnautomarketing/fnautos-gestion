import { z } from 'zod'

export const recordatorioSchema = z.object({
    factura_id: z.string().uuid().or(z.array(z.string().uuid())), // Una o múltiples facturas
    tipo: z.enum(['email', 'sms', 'llamada']),
    plantilla: z.string().optional(),
    asunto: z.string().optional(),
    contenido: z.string().min(10, 'El contenido es demasiado corto'),

    email_destinatario: z.string().email().optional(),
    telefono_destinatario: z.string().optional(),
    emails_cc: z.array(z.string().email()).optional(),

    fecha_programado: z.string().optional(), // ISO date
    tono: z.enum(['cordial', 'firme', 'urgente', 'legal']).default('cordial'),

    adjuntar_factura: z.boolean().default(true),
    adjuntos_adicionales: z.array(z.string()).optional(),

    // Para llamadas
    resultado_llamada: z.string().optional(),
    persona_contactada: z.string().optional(),
    fecha_compromiso_pago: z.string().optional(),
    siguiente_accion: z.string().optional(),

    notas: z.string().optional(),
})

export type RecordatorioFormData = z.infer<typeof recordatorioSchema>
