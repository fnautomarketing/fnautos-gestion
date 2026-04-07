import { z } from 'zod'
import { validarCIF } from '@/lib/utils/cif-validator'

export const clienteSchema = z.object({
    nombre_fiscal: z.string().min(3).max(255),
    nombre_comercial: z.string().max(255).optional(),
    cif: z.string().refine(validarCIF, { message: 'CIF/NIF no válido' }),
    tipo_cliente: z.enum(['empresa', 'autonomo', 'particular']).default('empresa'),

    email_principal: z.string().email(),
    email_secundario: z.string().email().optional().or(z.literal('')),
    telefono_principal: z.string().min(9).optional().or(z.literal('')),
    telefono_secundario: z.string().optional(),
    persona_contacto: z.string().optional(),
    sitio_web: z.string().url().optional().or(z.literal('')),
    idioma_preferente: z.string().default('es'),

    direccion: z.string().min(5),
    codigo_postal: z.string().regex(/^\d{5}$/),
    ciudad: z.string().min(2),
    provincia: z.string().optional(),
    pais: z.string().default('España'),

    forma_pago_predeterminada: z.string().default('transferencia'),
    descuento_comercial: z.number().min(0).max(100).default(0),
    iva_aplicable: z.number().min(0).max(100).default(21),
    tarifa_precios: z.string().default('general'),

    iban: z.string().regex(/^[A-Z]{2}\d{22}$/).optional().or(z.literal('')),
    banco: z.string().max(100).optional(),
    titular_cuenta: z.string().max(255).optional(),
    bic_swift: z.string().max(15).optional(),

    notas_internas: z.string().optional(),
    activo: z.boolean().default(true),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
