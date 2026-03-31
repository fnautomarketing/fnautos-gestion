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
// ║  CLÁUSULAS LEGALES COMPLETAS                            ║
// ║  Adaptadas a legislación española vigente               ║
// ╚══════════════════════════════════════════════════════════╝

function generarClausulas(contrato: Contrato, empresa: ContratoEmpresaPdf): Array<{ titulo: string; texto: string; ref?: string }> {
    const esVenta = contrato.tipo_operacion === 'venta'
    const ivaPorcentaje = contrato.iva_porcentaje || 0
    const totalFinal = contrato.total_con_iva || contrato.precio_venta
    const formaPagoLabel = FORMA_PAGO_LABELS[contrato.forma_pago || 'transferencia'] || 'transferencia bancaria'

    const clausulas: Array<{ titulo: string; texto: string; ref?: string }> = [
        {
            titulo: 'PRIMERA — Objeto del contrato',
            texto: `Por medio del presente contrato, la parte vendedora transmite a la parte compradora la plena propiedad y posesión del vehículo descrito en el apartado "Datos del Vehículo" de este documento, con todos los derechos y obligaciones inherentes al mismo, libre de cargas y gravámenes${contrato.vehiculo_libre_cargas ? '' : ', salvo las expresamente declaradas'}, obligándose la parte compradora a su aceptación conforme a las condiciones aquí pactadas.`,
            ref: 'Art. 1445 Código Civil — Concepto de compraventa',
        },
        {
            titulo: 'SEGUNDA — Precio y forma de pago',
            texto: `El precio total de la compraventa asciende a la cantidad de ${fmt(totalFinal)}${contrato.precio_letras ? ` (${contrato.precio_letras})` : ''}.${ivaPorcentaje > 0 ? ` Dicha cantidad incluye un IVA del ${ivaPorcentaje}% que asciende a ${fmt(contrato.iva_importe)}, siendo la base imponible de ${fmt(contrato.precio_venta)}.` : ' Esta operación no está sujeta a IVA al tratarse de una transmisión entre particulares, quedando sujeta al Impuesto de Transmisiones Patrimoniales (ITP).'} El pago se realizará mediante ${formaPagoLabel}.${contrato.forma_pago === 'efectivo' ? ' En cumplimiento de la Ley 7/2012, de 29 de octubre, los pagos en efectivo no podrán superar los 1.000€ cuando alguna de las partes actúe como empresario o profesional.' : ''}`,
            ref: 'Arts. 1445, 1500 C.C. — Precio cierto; Ley 7/2012 (limitación pagos efectivo)',
        },
        {
            titulo: 'TERCERA — Entrega del vehículo y transmisión de riesgos',
            texto: `La entrega material del vehículo se efectuará en el momento de la firma del presente contrato, o en la fecha que las partes acuerden expresamente. Desde el momento de la entrega, la posesión, los riesgos y la responsabilidad civil derivada de la circulación del vehículo se transmiten íntegramente a la parte compradora. La parte vendedora queda exonerada de toda responsabilidad por infracciones de tráfico, accidentes o cualquier reclamación derivada del uso del vehículo posteriores a la fecha de entrega.`,
            ref: 'Arts. 1462-1466 C.C. — Entrega de la cosa vendida; Art. 1452 C.C. — Riesgo de la cosa',
        },
        {
            titulo: 'CUARTA — Estado del vehículo y conformidad',
            texto: `La parte compradora declara haber examinado previamente el vehículo objeto de esta compraventa y lo acepta en su estado actual de conservación y funcionamiento.${contrato.vehiculo_estado_declarado ? ` Estado declarado por el vendedor: "${contrato.vehiculo_estado_declarado}".` : ' El vendedor declara que el vehículo se encuentra en correcto estado de funcionamiento a la fecha de la firma.'} La parte compradora reconoce que el vehículo es de segunda mano y que, como tal, puede presentar el desgaste propio de su antigüedad y kilometraje${contrato.vehiculo_kilometraje ? ` (${contrato.vehiculo_kilometraje.toLocaleString('es-ES')} km)` : ''}.`,
            ref: 'Arts. 1484-1490 C.C. — Saneamiento por vicios ocultos',
        },
        {
            titulo: 'QUINTA — Cargas, gravámenes y situación administrativa',
            texto: contrato.vehiculo_libre_cargas
                ? `La parte vendedora declara expresamente y garantiza que el vehículo objeto de este contrato se halla libre de toda carga, gravamen, embargo, anotación en el Registro de Bienes Muebles, multas pendientes de pago, reserva de dominio, financiación vigente o cualquier otra limitación de dominio. Igualmente declara estar al corriente en el pago del Impuesto sobre Vehículos de Tracción Mecánica (IVTM) y que el vehículo no ha sido declarado siniestro total por ninguna compañía aseguradora.`
                : `La parte vendedora declara la existencia de cargas, gravámenes u otras afectaciones sobre el vehículo, cuyo detalle se refleja en las cláusulas adicionales de este contrato. La parte compradora acepta expresamente la adquisición del vehículo en dichas condiciones.`,
            ref: 'Art. 1474 C.C. — Saneamiento por evicción; RD 1828/1999 — Registro de Bienes Muebles',
        },
        {
            titulo: 'SEXTA — Documentación entregada',
            texto: `La parte vendedora entrega a la parte compradora toda la documentación necesaria para realizar la transferencia de titularidad del vehículo ante la Jefatura Provincial de Tráfico (DGT), conforme al artículo 32 del Real Decreto 2822/1998, del Reglamento General de Vehículos.${contrato.documentacion_entregada?.length ? ` Documentación entregada: ${contrato.documentacion_entregada.join(', ')}.` : ''} La parte vendedora se compromete a firmar cuantos documentos sean necesarios para perfeccionar la transmisión ante la DGT.`,
            ref: 'Art. 32 RD 2822/1998 — Cambio de titularidad; Art. 1258 C.C.',
        },
        {
            titulo: 'SÉPTIMA — Obligaciones fiscales',
            texto: ivaPorcentaje > 0
                ? `Al ser una de las partes empresario o profesional, la operación está sujeta al Impuesto sobre el Valor Añadido (IVA) al tipo del ${ivaPorcentaje}%, cuyo importe de ${fmt(contrato.iva_importe)} queda incluido en el precio total. La parte vendedora emitirá la correspondiente factura y procederá a la liquidación del IVA repercutido en su declaración periódica.`
                : `Al tratarse de una transmisión entre particulares, esta operación no está sujeta a IVA sino al Impuesto de Transmisiones Patrimoniales (ITP), cuyo pago corresponde a la parte compradora. Dicho impuesto deberá liquidarse ante la Agencia Tributaria de la Comunidad Autónoma correspondiente al domicilio fiscal del adquirente, en el plazo de 30 días hábiles desde la firma del presente contrato, conforme al artículo 102 del Real Decreto Legislativo 1/1993.`,
            ref: 'RDL 1/1993 — ITP; Ley 37/1992 — IVA; Art. 102 RDL 1/1993',
        },
        {
            titulo: 'OCTAVA — Transferencia ante la DGT',
            texto: `La parte compradora se obliga a realizar el cambio de titularidad del vehículo ante la Dirección General de Tráfico (DGT) en el plazo máximo de 30 días desde la fecha de firma del presente contrato, conforme establece el Real Decreto 2822/1998. Los gastos derivados de la transferencia (tasas de tráfico, gestoría, en su caso) serán por cuenta de la parte compradora, salvo pacto expreso en contrario. La parte vendedora realizará la notificación de venta a la DGT para quedar exenta de responsabilidad por infracciones posteriores a la transmisión.`,
            ref: 'Arts. 32-34 RD 2822/1998 — Reglamento General de Vehículos',
        },
        {
            titulo: 'NOVENA — Vicios ocultos y garantía legal',
            texto: esVenta
                ? `De conformidad con los artículos 1484 a 1490 del Código Civil, la parte vendedora responderá de los vicios o defectos ocultos que tuviera el vehículo si los conociera y no los hubiese manifestado al comprador. Al actuar la empresa vendedora como profesional del sector, será de aplicación la garantía legal de conformidad prevista en el Real Decreto Legislativo 1/2007, por el que se aprueba el Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios (TRLGDCU). Para vehículos de segunda mano vendidos por un profesional, el plazo de garantía legal es de un (1) año desde la entrega, conforme al artículo 120 TRLGDCU, pudiendo las partes pactar por escrito su reducción a un año. Durante dicho plazo, si el vehículo presenta falta de conformidad, el comprador podrá exigir la reparación, sustitución, reducción del precio o resolución del contrato.`
                : `De conformidad con los artículos 1484 a 1490 del Código Civil, la parte vendedora responderá de los vicios o defectos ocultos que tuviera el vehículo si los conociera y no los hubiese manifestado al comprador. Al tratarse de una compraventa entre particulares, el plazo para ejercitar la acción de saneamiento por vicios ocultos es de seis (6) meses desde la entrega del vehículo, conforme al artículo 1490 del Código Civil.`,
            ref: esVenta
                ? 'Arts. 1484-1490 C.C.; Arts. 114-127 TRLGDCU (RDL 1/2007) — Garantía legal'
                : 'Arts. 1484-1490 C.C. — Saneamiento por vicios ocultos',
        },
        {
            titulo: 'DÉCIMA — Seguro obligatorio',
            texto: `La parte compradora se obliga a suscribir un seguro obligatorio de responsabilidad civil de automóviles antes de la puesta en circulación del vehículo, conforme a lo dispuesto en el Real Decreto Legislativo 8/2004, de 29 de octubre, por el que se aprueba el Texto Refundido de la Ley sobre Responsabilidad Civil y Seguro en la Circulación de Vehículos a Motor. La parte vendedora mantendrá vigente su póliza de seguro hasta la efectiva transferencia de titularidad ante la DGT.`,
            ref: 'RDL 8/2004 — Responsabilidad Civil y Seguro de Vehículos a Motor',
        },
        {
            titulo: 'UNDÉCIMA — Inspección Técnica de Vehículos (ITV)',
            texto: `La parte vendedora declara que el vehículo${contrato.documentacion_entregada?.includes('Informe ITV vigente') ? ' dispone de la Inspección Técnica de Vehículos (ITV) vigente a la fecha de la firma' : ' cuyo estado de la ITV consta según la documentación facilitada'}. En cualquier caso, la parte compradora será responsable de las futuras inspecciones técnicas del vehículo conforme a lo establecido en el Real Decreto 920/2017, de 23 de octubre, por el que se regula la inspección técnica de vehículos.`,
            ref: 'RD 920/2017 — Inspección Técnica de Vehículos',
        },
        {
            titulo: 'DUODÉCIMA — Protección de datos personales',
            texto: `De conformidad con el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (Reglamento General de Protección de Datos, RGPD) y la Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), las partes quedan informadas y consienten expresamente que los datos personales recogidos en este contrato (nombre, NIF/CIF, domicilio, teléfono, correo electrónico, dirección IP, firma electrónica) serán tratados con la única finalidad de gestionar la relación contractual derivada de la compraventa del vehículo y el cumplimiento de obligaciones legales y fiscales. Los datos se conservarán durante el plazo legalmente exigible. Ambas partes podrán ejercitar sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición (derechos ARCO-POL) dirigiéndose por escrito a ${empresa.nombre}, ${empresa.direccion}, ${empresa.codigo_postal} ${empresa.ciudad}${empresa.email ? `, o por correo electrónico a ${empresa.email}` : ''}.`,
            ref: 'RGPD (UE) 2016/679; LO 3/2018 (LOPDGDD)',
        },
        {
            titulo: 'DECIMOTERCERA — Firma electrónica',
            texto: `Las partes reconocen y aceptan que la firma electrónica realizada a través de la plataforma digital de ${empresa.nombre} tiene plena validez jurídica y eficacia probatoria, de conformidad con lo dispuesto en el Reglamento (UE) nº 910/2014 del Parlamento Europeo y del Consejo (Reglamento eIDAS), especialmente su artículo 25.1, que establece que no se denegarán efectos jurídicos ni admisibilidad como prueba en procedimientos judiciales a una firma electrónica por el mero hecho de ser una firma electrónica simple. Se registran como evidencia electrónica la dirección IP del firmante, la fecha y hora exacta de la firma, el agente de usuario (navegador) y la imagen de la firma manuscrita digitalizada.`,
            ref: 'Reglamento eIDAS (UE) 910/2014, Art. 25; Ley 6/2020 de servicios electrónicos de confianza',
        },
        {
            titulo: 'DECIMOCUARTA — Resolución de controversias',
            texto: `Para la resolución de cualesquiera controversias que pudieran derivarse de la interpretación, cumplimiento o ejecución del presente contrato, las partes se someten expresamente a los Juzgados y Tribunales de ${empresa.ciudad || 'la localidad del vendedor'}, con renuncia a cualquier otro fuero que pudiera corresponderles. No obstante, si la parte compradora tiene la condición de consumidor conforme al TRLGDCU, serán competentes los Juzgados de su domicilio. Previamente, las partes podrán acudir al Sistema Arbitral de Consumo si ambas lo aceptan voluntariamente.`,
            ref: 'Art. 1809 C.C.; Art. 90 TRLGDCU (RDL 1/2007); Ley 60/2003 de Arbitraje',
        },
        {
            titulo: 'DECIMOQUINTA — Legislación aplicable',
            texto: `El presente contrato se rige por la legislación española, en particular por los artículos 1445 a 1537 del Código Civil relativos al contrato de compraventa, así como por el Real Decreto 2822/1998 (Reglamento General de Vehículos), el Real Decreto Legislativo 6/2015 (Ley sobre Tráfico), y cualesquiera otras disposiciones que resulten de aplicación. En lo no previsto expresamente en este contrato, serán de aplicación las normas generales del Código Civil y las normas de protección del consumidor si alguna de las partes tiene esa condición.`,
            ref: 'Arts. 1445-1537 C.C.; RD 2822/1998; RDL 6/2015 — Ley sobre Tráfico',
        },
    ]

    // Cláusula adicional personalizada si existe
    if (contrato.clausulas_adicionales) {
        clausulas.push({
            titulo: 'CLÁUSULA ADICIONAL — Pactos particulares',
            texto: contrato.clausulas_adicionales,
            ref: 'Art. 1255 C.C. — Autonomía de la voluntad de las partes',
        })
    }

    // Cláusula final de cierre
    clausulas.push({
        titulo: 'CLÁUSULA FINAL — Unidad del contrato e integración',
        texto: `El presente contrato constituye la totalidad del acuerdo entre las partes en relación con su objeto, dejando sin efecto cualquier acuerdo, pacto o negociación previa, verbal o escrita, que hubiera existido entre las partes con anterioridad. Cualquier modificación del presente contrato deberá realizarse por escrito y ser firmada por ambas partes. Y en prueba de conformidad con lo expuesto, las partes firman el presente contrato, que se extiende por duplicado y a un solo efecto, en la fecha y lugar arriba indicados.`,
        ref: 'Arts. 1254, 1258 C.C. — Perfección y cumplimiento de contratos',
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
        ? 'CONTRATO DE COMPRAVENTA DE VEHÍCULO'
        : 'CONTRATO DE COMPRA DE VEHÍCULO'
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

    // Calcular número total de páginas (1 datos + N cláusulas)
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

                {clausulas.slice(0, 9).map((cl, i) => (
                    <View key={i} wrap={false}>
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

                {clausulas.slice(9).map((cl, i) => (
                    <View key={i} wrap={false}>
                        <Text style={s.clausulaTitle}>{cl.titulo}</Text>
                        <Text style={s.clausulaText}>{cl.texto}</Text>
                        {cl.ref && <Text style={s.clausulaRef}>Ref. legal: {cl.ref}</Text>}
                    </View>
                ))}

                {/* ═══ ZONA DE FIRMAS ═══ */}
                <View style={s.firmasRow}>
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
