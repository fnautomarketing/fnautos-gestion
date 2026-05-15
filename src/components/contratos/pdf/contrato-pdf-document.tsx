/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { clientConfig } from '@/config/clients'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Contrato } from '@/types/contratos'
import { FORMA_PAGO_LABELS, COMBUSTIBLE_LABELS } from '@/types/contratos'

// ╔══════════════════════════════════════════════════════════╗
// ║  PDF Contrato de Compraventa de Vehículo                ║
// ║  Cumplimiento Legal:                                     ║
// ║  • Código Civil Español (Arts. 1445-1537, 1254-1258)    ║
// ║  • Real Decreto 2822/1998 (Reglamento General Vehículos)║
// ║  • RGPD (UE) 2016/679 y LOPDGDD 3/2018                 ║
// ║  • LSSI-CE (Ley 34/2002)                                ║
// ║  • Reglamento eIDAS (UE) 910/2014                       ║
// ║  • TRLGDCU (RDL 1/2007) — si aplica consumidor          ║
// ║  • Ley 7/1996 de Ordenación del Comercio Minorista      ║
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
    firmaEmpresaUrl?: string
}

// ── Paleta de colores (coherente con branding) ───────────
const C = {
    brand: clientConfig.colors.brandGold,
    dark: clientConfig.colors.brandDark,
    slate: '#334155',
    light: '#64748b',
    lighter: '#94a3b8',
    border: '#e2e8f0',
    bg: '#f8fafc',
    panelBg: '#fafbfc',
    panelBdr: '#e2e8f0',
    white: '#ffffff',
    greenBg: '#f0fdf4',
    greenBdr: '#bbf7d0',
    greenText: '#166534',
    amberBg: '#fffbeb',
    amberBdr: '#fde68a',
    amberText: '#92400e',
}

// ── Utilidades de formato ────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy', { locale: es })
const fmtDateLong = (d: string) => format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: es })
const fmtDateTime = (d: string) => format(new Date(d), "d 'de' MMMM 'de' yyyy, HH:mm'h'", { locale: es })

// ── Estilos del PDF ──────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 8.5,
        paddingTop: 35,
        paddingBottom: 55,
        paddingHorizontal: 38,
        color: C.dark,
        lineHeight: 1.4,
    },
    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    logo: { width: 65, height: 65, objectFit: 'contain' },
    headerRight: { textAlign: 'right' },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: C.brand,
        marginBottom: 3,
    },
    headerNum: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
    },
    headerDate: { fontSize: 8, color: C.light, marginTop: 2 },
    brandLine: {
        height: 2.5,
        backgroundColor: C.brand,
        marginBottom: 12,
        borderRadius: 2,
    },
    // ── Tipo operación ──
    tipoOperacion: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        color: C.white,
        padding: 7,
        backgroundColor: C.dark,
        borderRadius: 4,
        marginBottom: 12,
        letterSpacing: 1,
    },
    // ── Paneles de partes ──
    panelsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    panel: {
        flex: 1,
        padding: 12,
        backgroundColor: C.panelBg,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: C.panelBdr,
        borderStyle: 'solid' as const,
    },
    panelBrand: {
        flex: 1,
        padding: 12,
        backgroundColor: '#fff8f0',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: C.brand,
        borderStyle: 'solid' as const,
    },
    panelTitle: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.brand,
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    panelName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
        marginBottom: 2,
    },
    panelText: {
        fontSize: 8,
        color: C.slate,
        marginBottom: 1,
    },
    // ── Sección genérica ──
    section: { marginBottom: 12 },
    sectionTitle: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        color: C.brand,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // ── Vehículo grid ──
    vehiculoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: C.border,
        borderStyle: 'solid' as const,
        borderRadius: 4,
        overflow: 'hidden',
    },
    vehiculoItem: {
        width: '50%',
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    vehiculoItemAlt: { backgroundColor: C.bg },
    vehiculoLabel: { fontSize: 7.5, color: C.light, width: '42%' },
    vehiculoValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, width: '58%' },
    // ── Económico ──
    economicoPanel: {
        padding: 12,
        backgroundColor: C.panelBg,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: C.brand,
        borderStyle: 'solid' as const,
        marginBottom: 12,
    },
    economicoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2.5,
    },
    economicoLabel: { fontSize: 8.5, color: C.slate },
    economicoValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.dark },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.dark },
    totalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.brand },
    precioLetras: { fontSize: 7, color: C.light, marginTop: 3, fontStyle: 'italic' },
    // ── Cláusulas ──
    clausulaTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
        marginBottom: 2,
        marginTop: 7,
    },
    clausulaText: {
        fontSize: 7.5,
        color: C.slate,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    clausulaRef: {
        fontSize: 6.5,
        color: C.lighter,
        fontStyle: 'italic',
        marginTop: 1,
    },
    // ── Firmas ──
    firmasRow: {
        flexDirection: 'row',
        gap: 25,
        marginTop: 20,
        marginBottom: 10,
    },
    firmaBox: {
        flex: 1,
        alignItems: 'center',
    },
    firmaLabel: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: C.brand,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    firmaImagen: {
        width: 150,
        height: 65,
        objectFit: 'contain',
        marginBottom: 3,
    },
    firmaLinea: {
        width: '85%',
        height: 0.8,
        backgroundColor: C.dark,
        marginBottom: 3,
    },
    firmaNombre: {
        fontSize: 7.5,
        fontFamily: 'Helvetica-Bold',
        color: C.dark,
    },
    firmaNif: {
        fontSize: 7,
        color: C.light,
    },
    // ── Badge firma digital ──
    firmaBadge: {
        padding: 8,
        backgroundColor: C.greenBg,
        borderWidth: 1,
        borderColor: C.greenBdr,
        borderStyle: 'solid' as const,
        borderRadius: 4,
        marginTop: 10,
    },
    firmaBadgeText: {
        fontSize: 7,
        color: C.greenText,
        fontFamily: 'Helvetica-Bold',
    },
    firmaBadgeDetail: {
        fontSize: 6.5,
        color: C.greenText,
        marginTop: 2,
    },
    // ── Aviso legal ──
    legalNotice: {
        padding: 8,
        backgroundColor: C.amberBg,
        borderWidth: 1,
        borderColor: C.amberBdr,
        borderStyle: 'solid' as const,
        borderRadius: 4,
        marginTop: 8,
    },
    legalNoticeText: {
        fontSize: 6.5,
        color: C.amberText,
    },
    // ── Footer ──
    footer: {
        position: 'absolute' as const,
        bottom: 22,
        left: 38,
        right: 38,
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 6,
        color: C.lighter,
    },
    // ── Documentación entregada ──
    docGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    docBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        backgroundColor: C.greenBg,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: C.greenBdr,
        borderStyle: 'solid' as const,
    },
    docBadgeText: {
        fontSize: 7,
        color: C.greenText,
        fontFamily: 'Helvetica-Bold',
    },
})

// ╔══════════════════════════════════════════════════════════╗
// ║  CLÁUSULAS — Contrato compraventa y garantía V.O.       ║
// ║  Basado en plantilla operativa FN Autos                 ║
// ╚══════════════════════════════════════════════════════════╝

function generarClausulas(contrato: Contrato, empresa: ContratoEmpresaPdf): Array<{ titulo: string; texto: string; ref?: string }> {
    const ivaPorcentaje = contrato.iva_porcentaje || 0
    const totalFinal = contrato.total_con_iva || contrato.precio_venta
    const formaPagoLabel = FORMA_PAGO_LABELS[contrato.forma_pago || 'transferencia'] || 'transferencia bancaria'
    const kmTexto = contrato.vehiculo_kilometraje
        ? `${contrato.vehiculo_kilometraje.toLocaleString('es-ES')} km`
        : 'el kilometraje indicado'
    const estadoVehiculo = contrato.vehiculo_estado_declarado
        ? ` Estado declarado: "${contrato.vehiculo_estado_declarado}".`
        : ''
    const itvEntregada = contrato.documentacion_entregada?.some((d) =>
        d.toLowerCase().includes('itv')
    )

    const clausulas: Array<{ titulo: string; texto: string; ref?: string }> = [
        {
            titulo: 'PRIMERA — Objeto de la compraventa',
            texto: `La parte vendedora VENDE a la parte compradora, que COMPRA, el vehículo de ocasión identificado en el apartado "Datos del Vehículo" de este documento, en el estado técnico y de conservación propio de su antigüedad y de ${kmTexto}, reconociendo el comprador que se trata de un vehículo usado con el desgaste natural correspondiente a su uso.${estadoVehiculo} El comprador declara haber tenido oportunidad de examinar el vehículo y aceptarlo en las condiciones descritas.`,
        },
        {
            titulo: 'SEGUNDA — Precio y forma de pago',
            texto: `El precio de la compraventa se pacta de común acuerdo en ${fmt(totalFinal)}${contrato.precio_letras ? ` (${contrato.precio_letras})` : ''}, importe en el que queda incluido el precio del vehículo en el estado descrito.${ivaPorcentaje > 0 ? ` Incluye IVA al ${ivaPorcentaje}% (${fmt(contrato.iva_importe)}), sobre base imponible de ${fmt(contrato.precio_venta)}.` : ''} El pago se efectuará mediante ${formaPagoLabel}, en el establecimiento o lugar acordado por las partes.${contrato.forma_pago === 'efectivo' ? ' En operaciones con intervención de empresario o profesional, el pago en efectivo quedará sujeto a los límites legales vigentes (Ley 7/2012).' : ''}`,
        },
        {
            titulo: 'TERCERA — Entrega del vehículo y asunción de riesgos',
            texto: `En este acto, o en la fecha que las partes acuerden por escrito, el vendedor hace entrega del vehículo al comprador, quien desde dicha fecha asume la posesión, el uso, las responsabilidades de circulación y cuantas obligaciones o sanciones se deriven del mismo. El vendedor responderá de las cuestiones derivadas del uso o posesión del vehículo hasta la fecha de entrega.`,
        },
        {
            titulo: 'CUARTA — Garantía legal y garantía comercial',
            texto: `El plazo de garantía legal pactado es de doce (12) meses desde la entrega del vehículo. Cuando el comprador tenga la condición de consumidor y el vendedor actúe como profesional, será de aplicación la garantía legal de conformidad del Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios (RDL 1/2007). Adicionalmente, cuando proceda, el comprador podrá beneficiarse de la garantía comercial gestionada por el proveedor externo que el vendedor indique en la documentación entregada, debiendo canalizar las reclamaciones amparadas por dicha cobertura conforme a sus condiciones.`,
        },
        {
            titulo: 'QUINTA — Falta de conformidad',
            texto: `El vendedor responderá ante el comprador de las faltas de conformidad existentes en el momento de la entrega del vehículo, en los términos de la normativa de consumidores y usuarios y del Código Civil. No habrá lugar a responsabilidad por faltas de conformidad que el comprador conociera o no hubiera podido ignorar de manera fundada en el momento de celebrar el contrato.`,
        },
        {
            titulo: 'SEXTA — Derecho a la reparación',
            texto: `En caso de falta de conformidad del vehículo, el titular de la garantía tendrá derecho a exigir su reparación en los términos legalmente previstos, sin perjuicio de lo establecido en la cláusula de política de sustitución y reembolso de este contrato.`,
        },
        {
            titulo: 'SÉPTIMA — Comunicación de incidencias',
            texto: `Para hacer valer sus derechos, el comprador deberá comunicar al vendedor la falta de conformidad apreciada a la mayor brevedad desde que tenga conocimiento de la misma. El retraso injustificado en la comunicación podrá generar responsabilidad por los daños agravados en el vehículo. El vendedor no responderá respecto de piezas o elementos manipulados por el comprador sin autorización previa.`,
        },
        {
            titulo: 'OCTAVA — Reparación y piezas de recambio',
            texto: `Una vez comprobada la falta de conformidad, el vendedor determinará el modo de reparación y el taller en que deba ser examinado el vehículo. Cuando sea necesario incorporar piezas de recambio, podrán utilizarse piezas reacondicionadas, reconstruidas o usadas, siempre que sea técnicamente posible, tengan estado conforme al contrato y no se trate de elementos activos ni conjuntos de los sistemas de frenado, suspensión o dirección. El comprador podrá solicitar piezas nuevas, asumiendo el sobreprecio correspondiente.`,
        },
        {
            titulo: 'NOVENA — Exclusiones de garantía',
            texto: `No se considerarán faltas de conformidad: (a) el desgaste normal de piezas, materiales o componentes; (b) averías motivadas por uso inadecuado o falta de las operaciones de mantenimiento recomendadas por el fabricante; (c) daños consecuencia de robo, accidente o factores externos; (d) piezas de mantenimiento y desgaste (correas, filtros, frenos, neumáticos, embrague, etc.).`,
        },
        {
            titulo: 'DÉCIMA — Aceptaciones del comprador y procedimiento de verificación',
            texto: `El comprador reconoce y acepta que: (i) la garantía no cubre desgaste mecánico ordinario ni averías por falta de mantenimiento; (ii) ha sido informado de la conveniencia de cumplir los mantenimientos del fabricante; (iii) verifica y acepta el estado actual del vehículo. Si detecta una posible falta de conformidad, deberá comunicarlo fehacientemente al vendedor antes de intervenir el vehículo en otro taller. El vendedor podrá organizar el traslado cautelar del vehículo para verificación. Si se confirma la garantía, el vendedor asumirá los gastos de transporte y reparación conforme a ley. Si el diagnóstico descarta la garantía, el comprador abonará transporte, mano de obra de diagnosis y demás costes generados.${itvEntregada ? ' El vehículo dispone de ITV conforme a la documentación entregada.' : ''}`,
        },
        {
            titulo: 'UNDÉCIMA — Política de sustitución, devolución y reembolso',
            texto: `Ante un reclamo fundado y amparado por la garantía legal o por este contrato, las partes pactan expresamente lo siguiente: (1) La solución preferente será la reparación conforme a las cláusulas anteriores. (2) Cuando proceda sustitución, esta se efectuará exclusivamente mediante la entrega de otro vehículo de valor equivalente al precio total abonado por el comprador en virtud del presente contrato. (3) Si el comprador optase por un vehículo de mayor precio, abonará previamente la diferencia al vendedor. (4) Solo en el supuesto de que no resulte viable la reparación ni la sustitución por causas no imputables al comprador, el vendedor procederá al reembolso del importe efectivamente abonado en un plazo máximo de treinta (30) días naturales desde la comunicación fehaciente de imposibilidad o desde la resolución conforme a derecho. Quedan excluidas las solicitudes derivadas de desgaste normal, mal uso, falta de mantenimiento o causas de exclusión previstas en este contrato.`,
        },
        {
            titulo: 'DUODÉCIMA — Observaciones sobre sistemas de motorización',
            texto: `El comprador declara haber sido informado, cuando el vehículo lo requiera, de la naturaleza del filtro de partículas (FAP/DPF) como elemento de mantenimiento, de la necesidad de regeneraciones periódicas mediante conducción adecuada, y de las recomendaciones de uso del sistema AdBlue. No se considerará avería garantizada la cristalización de AdBlue por uso indebido o depósito mantenido de forma incorrecta. El comprador manifiesta comprender que el vendedor no asumirá piezas de desgaste ni mantenimientos preventivos no cubiertos por la garantía.`,
        },
    ]

    if (contrato.clausulas_adicionales) {
        clausulas.push({
            titulo: 'CLÁUSULA ADICIONAL — Pactos particulares',
            texto: contrato.clausulas_adicionales,
        })
    }

    clausulas.push({
        titulo: 'CLÁUSULA FINAL — Integración y firma',
        texto: `El presente contrato, junto con su documentación anexa, constituye el acuerdo íntegro entre las partes. Cualquier modificación requerirá acuerdo escrito. En prueba de conformidad, las partes firman el presente documento por duplicado y a un solo efecto, en ${empresa.ciudad || 'el lugar indicado en el encabezamiento'}, en la fecha del encabezamiento.`,
    })

    return clausulas
}

// ╔══════════════════════════════════════════════════════════╗
// ║  COMPONENTE PDF PRINCIPAL                               ║
// ╚══════════════════════════════════════════════════════════╝

export function ContratoPdfDocument({ contrato, empresa, logoUrl, firmaEmpresaUrl }: ContratoPdfDocumentProps) {
    const clausulas = generarClausulas(contrato, empresa)
    const esVenta = contrato.tipo_operacion === 'venta'

    // Determinar qué firma corresponde a la empresa según tipo de operación
    // Venta: empresa = vendedor → firmaEmpresaUrl va en firma_vendedor
    // Compra: empresa = comprador → firmaEmpresaUrl va en firma_comprador
    const firmaVendedor = esVenta
        ? (contrato.firma_vendedor_data || firmaEmpresaUrl)
        : contrato.firma_vendedor_data
    const firmaComprador = esVenta
        ? contrato.firma_comprador_data
        : (contrato.firma_comprador_data || firmaEmpresaUrl)
    const tipoTexto = esVenta
        ? 'CONTRATO DE COMPRAVENTA Y GARANTÍA DE VEHÍCULO DE OCASIÓN (V.O.)'
        : 'CONTRATO DE COMPRAVENTA Y GARANTÍA DE VEHÍCULO DE OCASIÓN (V.O.)'
    const fechaContrato = fmtDateLong(contrato.created_at || new Date().toISOString())

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

    const indiceCorteClausulas = Math.ceil(clausulas.length / 2)
    const totalPages = 3

    return (
        <Document>
            {/* ═══════════════════════════════════════════════════════ */}
            {/* PÁGINA 1: DATOS DE LAS PARTES Y DEL VEHÍCULO          */}
            {/* ═══════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    <View>
                        {logoUrl ? (
                            <Image src={logoUrl} style={s.logo} />
                        ) : (
                            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.dark }}>
                                {empresa.nombre}
                            </Text>
                        )}
                        <Text style={{ fontSize: 7, color: C.light, marginTop: 2 }}>
                            CIF: {empresa.cif}
                        </Text>
                        <Text style={{ fontSize: 6.5, color: C.lighter, marginTop: 1 }}>
                            {empresa.direccion} — {empresa.codigo_postal} {empresa.ciudad}
                        </Text>
                    </View>
                    <View style={s.headerRight}>
                        <Text style={s.headerTitle}>CONTRATO</Text>
                        <Text style={s.headerNum}>{contrato.numero_contrato}</Text>
                        <Text style={s.headerDate}>{fechaContrato}</Text>
                    </View>
                </View>
                <View style={s.brandLine} />

                {/* Tipo de operación */}
                <Text style={s.tipoOperacion}>{tipoTexto}</Text>

                {/* Preámbulo legal */}
                <View style={{ marginBottom: 10 }}>
                    <Text style={s.clausulaText}>
                        En {empresa.ciudad || '[ciudad]'}, a {fechaContrato}, comparecen las siguientes partes, quienes
                        reconocen tener capacidad legal suficiente para contratar y obligarse, y MANIFIESTAN su voluntad de
                        celebrar el presente contrato de compraventa de vehículo, que se regirá por las siguientes cláusulas:
                    </Text>
                </View>

                {/* Vendedor y Comprador */}
                <View style={s.panelsRow}>
                    <View style={esVenta ? s.panelBrand : s.panel}>
                        <Text style={s.panelTitle}>PARTE VENDEDORA</Text>
                        <Text style={s.panelName}>{contrato.vendedor_nombre}</Text>
                        <Text style={s.panelText}>NIF/CIF: {contrato.vendedor_nif}</Text>
                        {contrato.vendedor_direccion && <Text style={s.panelText}>Domicilio: {contrato.vendedor_direccion}</Text>}
                        {(contrato.vendedor_ciudad || contrato.vendedor_codigo_postal) && (
                            <Text style={s.panelText}>{contrato.vendedor_codigo_postal} {contrato.vendedor_ciudad}</Text>
                        )}
                        {contrato.vendedor_telefono && <Text style={s.panelText}>Tel: {contrato.vendedor_telefono}</Text>}
                        {contrato.vendedor_email && <Text style={s.panelText}>Email: {contrato.vendedor_email}</Text>}
                    </View>
                    <View style={!esVenta ? s.panelBrand : s.panel}>
                        <Text style={s.panelTitle}>PARTE COMPRADORA</Text>
                        <Text style={s.panelName}>{contrato.comprador_nombre}</Text>
                        <Text style={s.panelText}>NIF/CIF: {contrato.comprador_nif}</Text>
                        {contrato.comprador_direccion && <Text style={s.panelText}>Domicilio: {contrato.comprador_direccion}</Text>}
                        {(contrato.comprador_ciudad || contrato.comprador_codigo_postal) && (
                            <Text style={s.panelText}>{contrato.comprador_codigo_postal} {contrato.comprador_ciudad}</Text>
                        )}
                        {contrato.comprador_telefono && <Text style={s.panelText}>Tel: {contrato.comprador_telefono}</Text>}
                        {contrato.comprador_email && <Text style={s.panelText}>Email: {contrato.comprador_email}</Text>}
                    </View>
                </View>

                {/* Datos del vehículo */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>DATOS DEL VEHÍCULO OBJETO DEL CONTRATO</Text>
                    <View style={s.vehiculoGrid}>
                        {vehiculoItems.map((item, i) => (
                            <View key={i} style={[s.vehiculoItem, i % 2 === 0 ? s.vehiculoItemAlt : {}]}>
                                <Text style={s.vehiculoLabel}>{item.label}</Text>
                                <Text style={s.vehiculoValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Documentación entregada */}
                {contrato.documentacion_entregada?.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>DOCUMENTACIÓN ENTREGADA</Text>
                        <View style={s.docGrid}>
                            {contrato.documentacion_entregada.map((doc, i) => (
                                <View key={i} style={s.docBadge}>
                                    <Text style={s.docBadgeText}>✓ {doc}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Condiciones económicas */}
                <View style={s.economicoPanel}>
                    <Text style={s.sectionTitle}>CONDICIONES ECONÓMICAS</Text>
                    <View style={s.economicoRow}>
                        <Text style={s.economicoLabel}>Base imponible</Text>
                        <Text style={s.economicoValue}>{fmt(contrato.precio_venta)}</Text>
                    </View>
                    {contrato.iva_porcentaje > 0 && (
                        <View style={s.economicoRow}>
                            <Text style={s.economicoLabel}>IVA ({contrato.iva_porcentaje}%)</Text>
                            <Text style={s.economicoValue}>{fmt(contrato.iva_importe)}</Text>
                        </View>
                    )}
                    {contrato.iva_porcentaje === 0 && (
                        <View style={s.economicoRow}>
                            <Text style={{ ...s.economicoLabel, fontSize: 7, fontStyle: 'italic' }}>
                                Operación no sujeta a IVA — sujeta a ITP
                            </Text>
                            <Text style={s.economicoValue}>0,00 €</Text>
                        </View>
                    )}
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>TOTAL A PAGAR</Text>
                        <Text style={s.totalValue}>{fmt(contrato.total_con_iva || contrato.precio_venta)}</Text>
                    </View>
                    {contrato.precio_letras && (
                        <Text style={s.precioLetras}>
                            En letras: {contrato.precio_letras}
                        </Text>
                    )}
                    <View style={[s.economicoRow, { marginTop: 5, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: C.border }]}>
                        <Text style={s.economicoLabel}>Forma de pago</Text>
                        <Text style={s.economicoValue}>
                            {FORMA_PAGO_LABELS[contrato.forma_pago || 'transferencia'] || 'Transferencia bancaria'}
                        </Text>
                    </View>
                </View>

                {/* Estado declarado */}
                {contrato.vehiculo_estado_declarado && (
                    <View style={s.legalNotice}>
                        <Text style={{ ...s.legalNoticeText, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                            ESTADO DECLARADO DEL VEHÍCULO:
                        </Text>
                        <Text style={s.legalNoticeText}>{contrato.vehiculo_estado_declarado}</Text>
                    </View>
                )}

                {/* Footer Página 1 */}
                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Contrato {contrato.numero_contrato} — {empresa.nombre} (CIF: {empresa.cif})</Text>
                    <Text style={s.footerText}>Página 1/{totalPages}</Text>
                </View>
            </Page>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* PÁGINA 2: CLÁUSULAS LEGALES (primera parte)           */}
            {/* ═══════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={[s.sectionTitle, { marginBottom: 3, marginTop: 0, fontSize: 10 }]}>
                    CLÁUSULAS DEL CONTRATO
                </Text>
                <View style={s.brandLine} />

                {clausulas.slice(0, indiceCorteClausulas).map((cl, i) => (
                    <View key={i}>
                        <Text style={s.clausulaTitle}>{cl.titulo}</Text>
                        <Text style={s.clausulaText}>{cl.texto}</Text>
                        {cl.ref && <Text style={s.clausulaRef}>Ref. legal: {cl.ref}</Text>}
                    </View>
                ))}

                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Contrato {contrato.numero_contrato} — {empresa.nombre} (CIF: {empresa.cif})</Text>
                    <Text style={s.footerText}>Página 2/{totalPages}</Text>
                </View>
            </Page>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* PÁGINA 3: CLÁUSULAS (cont.) + FIRMAS                  */}
            {/* ═══════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={[s.sectionTitle, { marginBottom: 3, marginTop: 0, fontSize: 10 }]}>
                    CLÁUSULAS DEL CONTRATO (continuación)
                </Text>
                <View style={s.brandLine} />

                {clausulas.slice(indiceCorteClausulas).map((cl, i) => (
                    <View key={i}>
                        <Text style={s.clausulaTitle}>{cl.titulo}</Text>
                        <Text style={s.clausulaText}>{cl.texto}</Text>
                        {cl.ref && <Text style={s.clausulaRef}>Ref. legal: {cl.ref}</Text>}
                    </View>
                ))}

                {/* ═══ ZONA DE FIRMAS ═══ */}
                <View style={s.firmasRow} wrap={false}>
                    <View style={s.firmaBox}>
                        <Text style={s.firmaLabel}>LA PARTE VENDEDORA</Text>
                        {firmaVendedor ? (
                            <Image src={firmaVendedor} style={s.firmaImagen} />
                        ) : (
                            <View style={{ width: 150, height: 65 }} />
                        )}
                        <View style={s.firmaLinea} />
                        <Text style={s.firmaNombre}>{contrato.vendedor_nombre}</Text>
                        <Text style={s.firmaNif}>NIF/CIF: {contrato.vendedor_nif}</Text>
                    </View>
                    <View style={s.firmaBox}>
                        <Text style={s.firmaLabel}>LA PARTE COMPRADORA</Text>
                        {firmaComprador ? (
                            <Image src={firmaComprador} style={s.firmaImagen} />
                        ) : (
                            <View style={{ width: 150, height: 65 }} />
                        )}
                        <View style={s.firmaLinea} />
                        <Text style={s.firmaNombre}>{contrato.comprador_nombre}</Text>
                        <Text style={s.firmaNif}>NIF/CIF: {contrato.comprador_nif}</Text>
                    </View>
                </View>

                {/* Badge de firma digital si firmado */}
                {contrato.estado === 'firmado' && contrato.firmado_en && (
                    <View style={s.firmaBadge}>
                        <Text style={s.firmaBadgeText}>
                            ✓ DOCUMENTO FIRMADO ELECTRÓNICAMENTE
                        </Text>
                        <Text style={s.firmaBadgeDetail}>
                            Fecha y hora: {fmtDateTime(contrato.firmado_en)}
                        </Text>
                        <Text style={s.firmaBadgeDetail}>
                            Tipo: Firma Electrónica Simple (SES) — Válida conforme al Reglamento (UE) 910/2014 (eIDAS), Art. 25.1
                        </Text>
                        {contrato.firma_ip && (
                            <Text style={s.firmaBadgeDetail}>
                                IP del firmante: {contrato.firma_ip}
                            </Text>
                        )}
                        {contrato.firma_user_agent && (
                            <Text style={s.firmaBadgeDetail}>
                                Agente: {contrato.firma_user_agent.substring(0, 80)}
                            </Text>
                        )}
                    </View>
                )}

                {/* Lugar y fecha */}
                <View style={{ marginTop: 14, textAlign: 'center' }}>
                    <Text style={{ fontSize: 8, color: C.slate }}>
                        En {empresa.ciudad || '[ciudad]'}, a {fechaContrato}
                    </Text>
                </View>

                {/* Aviso legal final */}
                <View style={[s.legalNotice, { marginTop: 10 }]}>
                    <Text style={s.legalNoticeText}>
                        AVISO LEGAL: Este contrato ha sido generado y gestionado a través de la plataforma digital de {empresa.nombre}.
                        En cumplimiento de la LSSI-CE (Ley 34/2002), se informa al usuario de que los datos de la empresa responsable son:
                        {' '}{empresa.nombre} — CIF: {empresa.cif} — {empresa.direccion}, {empresa.codigo_postal} {empresa.ciudad}
                        {empresa.telefono ? ` — Tel: ${empresa.telefono}` : ''}
                        {empresa.email ? ` — Email: ${empresa.email}` : ''}.
                    </Text>
                </View>

                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Contrato {contrato.numero_contrato} — {empresa.nombre} (CIF: {empresa.cif})</Text>
                    <Text style={s.footerText}>Página 3/{totalPages}</Text>
                </View>
            </Page>
        </Document>
    )
}
