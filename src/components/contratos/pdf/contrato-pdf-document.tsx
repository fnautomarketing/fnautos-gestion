/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { clientConfig } from '@/config/clients'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Contrato } from '@/types/contratos'
import { FORMA_PAGO_LABELS, COMBUSTIBLE_LABELS } from '@/types/contratos'

// ╔══════════════════════════════════════════════════════════╗
// ║  PDF Contrato de Compraventa — Diseño Premium           ║
// ╚══════════════════════════════════════════════════════════╝

export interface ContratoEmpresaPdf {
    nombre: string
    cif: string
    direccion: string
    ciudad: string
    codigo_postal: string
    telefono: string
    email: string
}

export interface ContratoPdfDocumentProps {
    contrato: Contrato
    empresa: ContratoEmpresaPdf
    logoUrl?: string
}

// ── Paleta de colores (misma que facturas) ───────────────
const C = {
    red: clientConfig.colors.brandGold,
    dark: clientConfig.colors.brandDark,
    slate: '#334155',
    light: '#64748b',
    border: '#e2e8f0',
    bg: '#f8fafc',
    redBg: '#fff5f5',
    redBdr: '#fecaca',
    white: '#ffffff',
    greenBg: '#f0fdf4',
    greenBdr: '#bbf7d0',
    greenText: '#166534',
}

const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy', { locale: es })
const fmtDateLong = (d: string) => format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: es })

const panelStyle = {
    padding: 14,
    backgroundColor: C.redBg,
    borderRadius: 5,
    borderWidth: 1 as const,
    borderColor: C.redBdr,
    borderStyle: 'solid' as const,
}

// ── Estilos ──────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
        color: C.dark,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    logo: { width: 70, height: 70, objectFit: 'contain' },
    headerRight: { textAlign: 'right' },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: C.red,
        marginBottom: 4,
    },
    headerNum: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
    },
    headerDate: { fontSize: 9, color: C.light, marginTop: 2 },
    redLine: {
        height: 3,
        backgroundColor: C.red,
        marginBottom: 16,
        borderRadius: 2,
    },
    // Tipo operación
    tipoOperacion: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        color: C.dark,
        marginBottom: 14,
        paddingVertical: 8,
        backgroundColor: C.bg,
        borderRadius: 4,
    },
    // Panels
    panelsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    panel: {
        flex: 1,
        ...panelStyle,
    },
    panelTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.red,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    panelName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
        marginBottom: 3,
    },
    panelText: {
        fontSize: 8.5,
        color: C.slate,
        marginBottom: 1.5,
    },
    // Vehículo
    vehiculoSection: {
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: C.red,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    vehiculoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    vehiculoItem: {
        width: '50%',
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    vehiculoItemAlt: {
        backgroundColor: C.bg,
    },
    vehiculoLabel: {
        fontSize: 8,
        color: C.light,
        width: '45%',
    },
    vehiculoValue: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
        width: '55%',
    },
    // Económico
    economicoPanel: {
        ...panelStyle,
        borderColor: C.red,
        borderWidth: 1.5 as const,
        marginBottom: 14,
    },
    economicoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    economicoLabel: { fontSize: 9, color: C.slate },
    economicoValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    totalLabel: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
    },
    totalValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: C.red,
    },
    precioLetras: {
        fontSize: 7.5,
        color: C.light,
        marginTop: 4,
        fontStyle: 'italic',
    },
    // Cláusulas
    clausulaTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
        marginBottom: 3,
        marginTop: 8,
    },
    clausulaText: {
        fontSize: 7.5,
        color: C.slate,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    // Firmas
    firmasRow: {
        flexDirection: 'row',
        gap: 30,
        marginTop: 24,
        marginBottom: 12,
    },
    firmaBox: {
        flex: 1,
        alignItems: 'center',
    },
    firmaLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.red,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    firmaImagen: {
        width: 160,
        height: 70,
        objectFit: 'contain',
        marginBottom: 4,
    },
    firmaLinea: {
        width: '80%',
        height: 1,
        backgroundColor: C.dark,
        marginBottom: 4,
    },
    firmaNombre: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
    },
    firmaNif: {
        fontSize: 7.5,
        color: C.light,
    },
    // Footer
    footer: {
        position: 'absolute' as const,
        bottom: 25,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 6.5,
        color: C.light,
    },
    // Firma digital badge
    firmaBadge: {
        padding: 8,
        backgroundColor: C.greenBg,
        borderWidth: 1 as const,
        borderColor: C.greenBdr,
        borderStyle: 'solid' as const,
        borderRadius: 4,
        marginTop: 8,
    },
    firmaBadgeText: {
        fontSize: 7.5,
        color: C.greenText,
        fontFamily: 'Helvetica-Bold',
    },
})

// ── Cláusulas legales ────────────────────────────────────

function generarClausulas(contrato: Contrato): Array<{ titulo: string; texto: string }> {
    const clausulas = [
        {
            titulo: 'PRIMERA — Objeto del contrato',
            texto: `El vendedor transmite al comprador la propiedad del vehículo descrito en este contrato, con todos los derechos y obligaciones inherentes al mismo, obligándose el comprador a su aceptación y al pago del precio estipulado.`,
        },
        {
            titulo: 'SEGUNDA — Precio y forma de pago',
            texto: `El precio de la compraventa asciende a la cantidad de ${fmt(contrato.total_con_iva || contrato.precio_venta)} (${contrato.precio_letras || ''}), que el comprador abona mediante ${FORMA_PAGO_LABELS[contrato.forma_pago || 'transferencia'] || 'transferencia bancaria'}. ${contrato.iva_porcentaje > 0 ? `Se aplica un IVA del ${contrato.iva_porcentaje}% (${fmt(contrato.iva_importe)}).` : 'Esta operación no está sujeta a IVA (transmisión entre particulares).'}`,
        },
        {
            titulo: 'TERCERA — Entrega del vehículo',
            texto: `La entrega del vehículo se realizará en el momento de la firma del presente contrato, transmitiéndose la posesión, los riesgos y la responsabilidad sobre el mismo al comprador.`,
        },
        {
            titulo: 'CUARTA — Estado del vehículo',
            texto: `El comprador declara conocer el estado actual del vehículo, habiéndolo examinado previamente y aceptándolo en su estado actual. ${contrato.vehiculo_estado_declarado ? `Estado declarado: ${contrato.vehiculo_estado_declarado}` : 'El vendedor declara que el vehículo se encuentra en buen estado de funcionamiento.'}`,
        },
        {
            titulo: 'QUINTA — Cargas y gravámenes',
            texto: contrato.vehiculo_libre_cargas
                ? 'El vendedor declara expresamente que el vehículo se halla libre de cargas, gravámenes, embargos, multas pendientes y cualquier limitación de dominio.'
                : 'El vendedor declara la existencia de cargas o gravámenes sobre el vehículo, cuyo detalle se especifica en las cláusulas adicionales.',
        },
        {
            titulo: 'SEXTA — Documentación',
            texto: `El vendedor entrega al comprador toda la documentación necesaria para la transferencia del vehículo ante la DGT (Dirección General de Tráfico).${contrato.documentacion_entregada?.length ? ` Documentación entregada: ${contrato.documentacion_entregada.join(', ')}.` : ''}`,
        },
        {
            titulo: 'SÉPTIMA — Impuesto de Transmisiones Patrimoniales',
            texto: `El Impuesto de Transmisiones Patrimoniales (ITP) que grave esta operación será de cuenta y cargo del comprador, quien se obliga a liquidarlo ante la Hacienda de la Comunidad Autónoma correspondiente en el plazo legalmente establecido (30 días hábiles).`,
        },
        {
            titulo: 'OCTAVA — Gastos de transferencia',
            texto: `Los gastos derivados de la transferencia del vehículo ante la DGT serán por cuenta del comprador, salvo pacto en contrario reflejado en cláusulas adicionales.`,
        },
        {
            titulo: 'NOVENA — Vicios ocultos',
            texto: `De conformidad con los artículos 1484 a 1490 del Código Civil, el vendedor responderá de los vicios ocultos que tuviera el vehículo si los conociese y no los hubiere manifestado al comprador. El plazo para su reclamación es de seis meses desde la entrega.`,
        },
        {
            titulo: 'DÉCIMA — Jurisdicción competente',
            texto: `Para la resolución de cualquier controversia derivada de este contrato, las partes se someten a los Juzgados y Tribunales del domicilio del vendedor, con renuncia a cualquier otro fuero que pudiera corresponderles.`,
        },
    ]

    if (contrato.clausulas_adicionales) {
        clausulas.push({
            titulo: 'CLÁUSULA ADICIONAL',
            texto: contrato.clausulas_adicionales,
        })
    }

    return clausulas
}

// ── Componente PDF principal ─────────────────────────────

export function ContratoPdfDocument({ contrato, empresa, logoUrl }: ContratoPdfDocumentProps) {
    const clausulas = generarClausulas(contrato)
    const tipoTexto = contrato.tipo_operacion === 'venta'
        ? 'CONTRATO DE VENTA DE VEHÍCULO'
        : 'CONTRATO DE COMPRA DE VEHÍCULO'
    const ahora = fmtDateLong(contrato.created_at || new Date().toISOString())

    const vehiculoItems = [
        { label: 'Marca', value: contrato.vehiculo_marca },
        { label: 'Modelo', value: contrato.vehiculo_modelo },
        { label: 'Versión', value: contrato.vehiculo_version },
        { label: 'Matrícula', value: contrato.vehiculo_matricula },
        { label: 'Nº Bastidor (VIN)', value: contrato.vehiculo_bastidor },
        { label: '1ª Matriculación', value: contrato.vehiculo_fecha_matriculacion ? fmtDate(contrato.vehiculo_fecha_matriculacion) : null },
        { label: 'Kilometraje', value: contrato.vehiculo_kilometraje ? `${contrato.vehiculo_kilometraje.toLocaleString('es-ES')} km` : null },
        { label: 'Color', value: contrato.vehiculo_color },
        { label: 'Combustible', value: contrato.vehiculo_combustible ? COMBUSTIBLE_LABELS[contrato.vehiculo_combustible] : null },
    ].filter(item => item.value)

    return (
        <Document>
            {/* ═══ PÁGINA 1: Datos ═══ */}
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    <View>
                        {logoUrl ? (
                            <Image src={logoUrl} style={s.logo} />
                        ) : (
                            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.dark }}>
                                {empresa.nombre}
                            </Text>
                        )}
                        <Text style={{ fontSize: 7, color: C.light, marginTop: 2 }}>
                            {empresa.cif}
                        </Text>
                    </View>
                    <View style={s.headerRight}>
                        <Text style={s.headerTitle}>CONTRATO</Text>
                        <Text style={s.headerNum}>{contrato.numero_contrato}</Text>
                        <Text style={s.headerDate}>{ahora}</Text>
                    </View>
                </View>
                <View style={s.redLine} />

                {/* Tipo de operación */}
                <Text style={s.tipoOperacion}>{tipoTexto}</Text>

                {/* Vendedor y Comprador */}
                <View style={s.panelsRow}>
                    <View style={s.panel}>
                        <Text style={s.panelTitle}>EL VENDEDOR</Text>
                        <Text style={s.panelName}>{contrato.vendedor_nombre}</Text>
                        <Text style={s.panelText}>NIF/CIF: {contrato.vendedor_nif}</Text>
                        {contrato.vendedor_direccion && <Text style={s.panelText}>{contrato.vendedor_direccion}</Text>}
                        {(contrato.vendedor_ciudad || contrato.vendedor_codigo_postal) && (
                            <Text style={s.panelText}>{contrato.vendedor_codigo_postal} {contrato.vendedor_ciudad}</Text>
                        )}
                        {contrato.vendedor_telefono && <Text style={s.panelText}>Tel: {contrato.vendedor_telefono}</Text>}
                        {contrato.vendedor_email && <Text style={s.panelText}>{contrato.vendedor_email}</Text>}
                    </View>
                    <View style={s.panel}>
                        <Text style={s.panelTitle}>EL COMPRADOR</Text>
                        <Text style={s.panelName}>{contrato.comprador_nombre}</Text>
                        <Text style={s.panelText}>NIF/CIF: {contrato.comprador_nif}</Text>
                        {contrato.comprador_direccion && <Text style={s.panelText}>{contrato.comprador_direccion}</Text>}
                        {(contrato.comprador_ciudad || contrato.comprador_codigo_postal) && (
                            <Text style={s.panelText}>{contrato.comprador_codigo_postal} {contrato.comprador_ciudad}</Text>
                        )}
                        {contrato.comprador_telefono && <Text style={s.panelText}>Tel: {contrato.comprador_telefono}</Text>}
                        {contrato.comprador_email && <Text style={s.panelText}>{contrato.comprador_email}</Text>}
                    </View>
                </View>

                {/* Datos del vehículo */}
                <View style={s.vehiculoSection}>
                    <Text style={s.sectionTitle}>DATOS DEL VEHÍCULO</Text>
                    <View style={[{ ...panelStyle }, s.vehiculoGrid]}>
                        {vehiculoItems.map((item, i) => (
                            <View key={i} style={[s.vehiculoItem, i % 2 === 0 ? s.vehiculoItemAlt : {}]}>
                                <Text style={s.vehiculoLabel}>{item.label}</Text>
                                <Text style={s.vehiculoValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Condiciones económicas */}
                <View style={s.economicoPanel}>
                    <Text style={s.sectionTitle}>CONDICIONES ECONÓMICAS</Text>
                    <View style={s.economicoRow}>
                        <Text style={s.economicoLabel}>Precio base</Text>
                        <Text style={s.economicoValue}>{fmt(contrato.precio_venta)}</Text>
                    </View>
                    {contrato.iva_porcentaje > 0 && (
                        <View style={s.economicoRow}>
                            <Text style={s.economicoLabel}>IVA ({contrato.iva_porcentaje}%)</Text>
                            <Text style={s.economicoValue}>{fmt(contrato.iva_importe)}</Text>
                        </View>
                    )}
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>TOTAL</Text>
                        <Text style={s.totalValue}>{fmt(contrato.total_con_iva || contrato.precio_venta)}</Text>
                    </View>
                    {contrato.precio_letras && (
                        <Text style={s.precioLetras}>
                            En letras: {contrato.precio_letras}
                        </Text>
                    )}
                    <View style={[s.economicoRow, { marginTop: 6 }]}>
                        <Text style={s.economicoLabel}>Forma de pago</Text>
                        <Text style={s.economicoValue}>
                            {FORMA_PAGO_LABELS[contrato.forma_pago || 'transferencia'] || 'Transferencia bancaria'}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Contrato {contrato.numero_contrato} — {empresa.nombre} ({empresa.cif})</Text>
                    <Text style={s.footerText}>Página 1/2</Text>
                </View>
            </Page>

            {/* ═══ PÁGINA 2: Cláusulas + Firmas ═══ */}
            <Page size="A4" style={s.page}>
                <Text style={[s.sectionTitle, { marginBottom: 4, marginTop: 0 }]}>
                    CLÁUSULAS DEL CONTRATO
                </Text>
                <View style={s.redLine} />

                {clausulas.map((cl, i) => (
                    <View key={i} wrap={false}>
                        <Text style={s.clausulaTitle}>{cl.titulo}</Text>
                        <Text style={s.clausulaText}>{cl.texto}</Text>
                    </View>
                ))}

                {/* Zona de firmas */}
                <View style={s.firmasRow}>
                    <View style={s.firmaBox}>
                        <Text style={s.firmaLabel}>EL VENDEDOR</Text>
                        {contrato.firma_vendedor_data ? (
                            <Image src={contrato.firma_vendedor_data} style={s.firmaImagen} />
                        ) : (
                            <View style={{ width: 160, height: 70 }} />
                        )}
                        <View style={s.firmaLinea} />
                        <Text style={s.firmaNombre}>{contrato.vendedor_nombre}</Text>
                        <Text style={s.firmaNif}>{contrato.vendedor_nif}</Text>
                    </View>
                    <View style={s.firmaBox}>
                        <Text style={s.firmaLabel}>EL COMPRADOR</Text>
                        {contrato.firma_comprador_data ? (
                            <Image src={contrato.firma_comprador_data} style={s.firmaImagen} />
                        ) : (
                            <View style={{ width: 160, height: 70 }} />
                        )}
                        <View style={s.firmaLinea} />
                        <Text style={s.firmaNombre}>{contrato.comprador_nombre}</Text>
                        <Text style={s.firmaNif}>{contrato.comprador_nif}</Text>
                    </View>
                </View>

                {/* Badge de firma digital si firmado */}
                {contrato.estado === 'firmado' && contrato.firmado_en && (
                    <View style={s.firmaBadge}>
                        <Text style={s.firmaBadgeText}>
                            ✓ Documento firmado electrónicamente el {fmtDateLong(contrato.firmado_en)} — Firma electrónica simple (SES) válida según Reglamento eIDAS (UE) 910/2014
                        </Text>
                    </View>
                )}

                {/* Fecha y lugar */}
                <View style={{ marginTop: 16, textAlign: 'center' }}>
                    <Text style={{ fontSize: 8.5, color: C.slate }}>
                        En {empresa.ciudad || '[ciudad]'}, a {ahora}
                    </Text>
                </View>

                {/* Footer */}
                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Contrato {contrato.numero_contrato} — {empresa.nombre} ({empresa.cif})</Text>
                    <Text style={s.footerText}>Página 2/2</Text>
                </View>
            </Page>
        </Document>
    )
}
