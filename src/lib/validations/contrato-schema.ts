// ╔══════════════════════════════════════════════════════════╗
// ║  Schemas Zod — Validaciones de contratos                ║
// ╚══════════════════════════════════════════════════════════╝

import { z } from 'zod'

// ── Regex de validación ──────────────────────────────────

// NIF español: 8 dígitos + letra
// NIE español: X/Y/Z + 7 dígitos + letra
// CIF español: Letra + 7 dígitos + dígito/letra
const NIF_REGEX = /^[0-9]{8}[A-Za-z]$|^[A-HJ-NP-SUVW][0-9]{7}[0-9A-Ja-j]$|^[XYZxyz][0-9]{7}[A-Za-z]$/

// Matrícula española nueva: 4 dígitos + 3 letras (ej: 1234 BCD)
// Matrícula española antigua: 1-2 letras + 4 dígitos + 2 letras (ej: M-1234-AB)
const MATRICULA_REGEX = /^[0-9]{4}\s?[B-DF-HJ-NP-TV-Zb-df-hj-np-tv-z]{3}$|^[A-Za-z]{1,2}-?\d{4}-?[A-Za-z]{2}$/

// VIN: exactamente 17 caracteres alfanuméricos (sin I, O, Q)
const VIN_REGEX = /^[A-HJ-NPR-Za-hj-npr-z0-9]{17}$/

// ── Schema del contrato (creación / edición) ─────────────

export const crearContratoSchema = z.object({
    tipo_operacion: z.enum(['compra', 'venta']),

    // ── Comprador ────────────────────────────────────────
    comprador_nombre: z.string().min(1, 'El nombre del comprador es obligatorio').max(200),
    comprador_nif: z.string()
        .min(1, 'El NIF/CIF del comprador es obligatorio')
        .regex(NIF_REGEX, 'Formato de NIF/CIF no válido (ej: 12345678Z o B12345678)'),
    comprador_direccion: z.string().max(300).optional().nullable().default(null),
    comprador_ciudad: z.string().max(100).optional().nullable().default(null),
    comprador_codigo_postal: z.string().max(10).optional().nullable().default(null),
    comprador_telefono: z.string().max(20).optional().nullable().default(null),
    comprador_email: z.string().email('Email no válido').optional().nullable().or(z.literal('')).default(null),

    // ── Vendedor ─────────────────────────────────────────
    vendedor_nombre: z.string().min(1, 'El nombre del vendedor es obligatorio').max(200),
    vendedor_nif: z.string()
        .min(1, 'El NIF/CIF del vendedor es obligatorio')
        .regex(NIF_REGEX, 'Formato de NIF/CIF no válido (ej: 12345678Z o B12345678)'),
    vendedor_direccion: z.string().max(300).optional().nullable().default(null),
    vendedor_ciudad: z.string().max(100).optional().nullable().default(null),
    vendedor_codigo_postal: z.string().max(10).optional().nullable().default(null),
    vendedor_telefono: z.string().max(20).optional().nullable().default(null),
    vendedor_email: z.string().email('Email no válido').optional().nullable().or(z.literal('')).default(null),

    // ── Vehículo ─────────────────────────────────────────
    vehiculo_marca: z.string().min(1, 'La marca es obligatoria').max(100),
    vehiculo_modelo: z.string().min(1, 'El modelo es obligatorio').max(100),
    vehiculo_version: z.string().max(100).optional().nullable().default(null),
    vehiculo_matricula: z.string()
        .min(1, 'La matrícula es obligatoria')
        .regex(MATRICULA_REGEX, 'Formato de matrícula no válido (ej: 1234 BCD)'),
    vehiculo_bastidor: z.string()
        .min(1, 'El número de bastidor es obligatorio')
        .regex(VIN_REGEX, 'El VIN debe tener exactamente 17 caracteres válidos'),
    vehiculo_fecha_matriculacion: z.string().optional().nullable().default(null),
    vehiculo_kilometraje: z.coerce.number().int().min(0, 'Los km no pueden ser negativos').optional().nullable().default(null),
    vehiculo_color: z.string().max(50).optional().nullable().default(null),
    vehiculo_combustible: z.enum(['gasolina', 'diesel', 'hibrido', 'electrico', 'gnc', 'glp', 'otro']).optional().nullable().default(null),

    // ── Económico ────────────────────────────────────────
    precio_venta: z.coerce.number().positive('El precio debe ser mayor que 0'),
    forma_pago: z.enum(['efectivo', 'transferencia', 'cheque', 'financiacion', 'mixto']).default('transferencia'),
    iva_porcentaje: z.coerce.number().min(0, 'El IVA no puede ser negativo').max(100, 'El IVA no puede superar el 100%').default(0),

    // ── Declaraciones ────────────────────────────────────
    vehiculo_estado_declarado: z.string().max(1000).optional().nullable().default(null),
    vehiculo_libre_cargas: z.boolean().default(true),
    documentacion_entregada: z.array(z.string()).default([]),
    clausulas_adicionales: z.string().max(5000).optional().nullable().default(null),

    // ── Relación opcional con cliente existente ──────────
    cliente_id: z.string().uuid().optional().nullable().default(null),

    // ── Notas internas ───────────────────────────────────
    notas_internas: z.string().max(2000).optional().nullable().default(null),
})

// ── Schema de firma digital ──────────────────────────────

export const firmarContratoSchema = z.object({
    token: z.string().uuid('Token de firma inválido'),
    firma_data: z.string().min(100, 'La firma es obligatoria'),
    aceptar_terminos: z.literal(true),
})

// ── Types inferidos de los schemas ───────────────────────

export type CrearContratoInput = z.infer<typeof crearContratoSchema>
export type FirmarContratoInput = z.infer<typeof firmarContratoSchema>
