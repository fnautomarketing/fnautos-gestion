/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { clientConfig } from '@/config/clients'
import { format } from 'date-fns'
import { es, enUS, fr } from 'date-fns/locale'
import type { Factura, Cliente, LineaFactura } from '@/types/ventas'

export interface FacturaWithRelations extends Factura {
    cliente: Cliente
    lineas: LineaFactura[]
    es_rectificativa: boolean | null
    factura_rectificada_id: string | null
    motivo_rectificacion: string | null
}

export interface Empresa {
    nombre_fiscal: string
    direccion: string
    ciudad: string
    codigo_postal: string
    cif: string
    email?: string
    iban?: string
    banco?: string
    pie_factura?: string
    logo_url?: string
}

export interface PdfOptions {
    plantilla: 'premium'
    idioma: 'es' | 'en' | 'fr'
    incluirLogo: boolean
    incluirDatosBancarios: boolean
    notasPie: string
    colorAcento?: string
}

export interface FacturaPdfDocumentProps {
    factura: FacturaWithRelations
    empresa: Empresa
    options: PdfOptions
    logoUrl?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, div = 'EUR') =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: div, minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string, lang = 'es') => {
    if (lang === 'en') return format(new Date(d), 'MMM dd, yyyy', { locale: enUS })
    if (lang === 'fr') return format(new Date(d), 'dd MMM yyyy', { locale: fr })
    return format(new Date(d), 'dd/MM/yyyy', { locale: es })
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

const i18n = {
    es: {
        factura: 'FACTURA', facturaRect: 'FACTURA RECTIFICATIVA',
        emisor: 'EMISOR', cliente: 'DATOS DEL CLIENTE', detalles: 'DETALLES',
        fechaEmision: 'Fecha Emisión', fechaVto: 'Fecha Vencimiento',
        numFactura: 'Nº Factura',
        concepto: 'CONCEPTO', cant: 'CANT.', precio: 'P. UNIT.',
        pctIva: 'IVA %', impIva: 'IVA', total: 'TOTAL',
        subtotal: 'Subtotal', descuento: 'Descuento', base: 'Base Imponible',
        cuotaIva: 'Cuota IVA', retencion: 'Retención IRPF',
        totalFact: 'TOTAL FACTURA', bancarios: 'DATOS BANCARIOS',
        notas: 'NOTAS', nif: 'NIF/CIF',
    },
    en: {
        factura: 'INVOICE', facturaRect: 'CREDIT NOTE',
        emisor: 'ISSUER', cliente: 'BILL TO', detalles: 'DETAILS',
        fechaEmision: 'Issue Date', fechaVto: 'Due Date',
        numFactura: 'Invoice No.',
        concepto: 'DESCRIPTION', cant: 'QTY', precio: 'UNIT PRICE',
        pctIva: 'VAT %', impIva: 'VAT', total: 'TOTAL',
        subtotal: 'Subtotal', descuento: 'Discount', base: 'Tax Base',
        cuotaIva: 'VAT Amount', retencion: 'Withholding',
        totalFact: 'TOTAL INVOICE', bancarios: 'BANK DETAILS',
        notas: 'NOTES', nif: 'Tax ID',
    },
    fr: {
        factura: 'FACTURE', facturaRect: 'AVOIR',
        emisor: 'ÉMETTEUR', cliente: 'DESTINATAIRE', detalles: 'DÉTAILS',
        fechaEmision: "Date d'émission", fechaVto: "Date d'échéance",
        numFactura: 'N° Facture',
        concepto: 'DESCRIPTION', cant: 'QTÉ', precio: 'PRIX UNIT.',
        pctIva: 'TVA %', impIva: 'TVA', total: 'TOTAL',
        subtotal: 'Sous-total', descuento: 'Remise', base: 'Base Imposable',
        cuotaIva: 'Montant TVA', retencion: 'Retenue',
        totalFact: 'TOTAL FACTURE', bancarios: 'COORDONNÉES BANCAIRES',
        notas: 'NOTES', nif: 'N° TVA',
    },
}

// ─── Paleta de colores ────────────────────────────────────────────────────────

const C = {
    red:     clientConfig.colors.brandGold,      // rojo corporativo #E60007
    dark:    clientConfig.colors.brandDark,       // #0A0A0A
    slate:   '#334155',
    light:   '#64748b',
    border:  '#e2e8f0',
    bg:      '#f8fafc',
    redBg:   '#fff5f5',   // fondo rojo muy suave (uniforme para paneles)
    redBdr:  '#fecaca',   // borde suave rojo
    white:   '#ffffff',
}

// ─── Widths de columnas (deben sumar exactamente 100%) ───────────────────────
const W = { concepto: '35%', cant: '7%', precio: '14%', pctIva: '9%', impIva: '16%', total: '19%' }

// ─── Estilo compartido para paneles de info (cliente y detalles) ─────────────
const panelStyle = {
    padding: 14,
    backgroundColor: C.redBg,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.redBdr,
    borderTopWidth: 3,
    borderTopColor: C.red,
} as const

const labelStyle  = { fontSize: 7, color: C.light, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 2 }
const valueStyle  = { fontSize: 10, fontWeight: 'bold' as const, color: C.dark, marginBottom: 8 }
const valueSmall  = { fontSize: 8.5, color: C.slate, marginBottom: 2 }

// ─── Componente Principal ─────────────────────────────────────────────────────

export function FacturaPdfDocument({ factura, empresa, options, logoUrl }: FacturaPdfDocumentProps) {
    const t   = i18n[options.idioma || 'es']
    const div = factura.divisa || 'EUR'
    const cli = factura.cliente

    // Cálculos fiscales
    const sub          = factura.subtotal || 0
    const base         = factura.base_imponible || sub
    const descTotal    = factura.importe_descuento || factura.descuento || 0
    const ivaTot       = factura.iva || 0
    const ivaPct       = base > 0 && ivaTot ? Math.round((ivaTot / base) * 100) : (factura.lineas?.[0]?.iva_porcentaje ?? 21)
    const retPct       = factura.retencion_porcentaje ?? 0
    const retImporte   = (factura.importe_retencion != null && factura.importe_retencion > 0)
        ? factura.importe_retencion
        : (retPct !== 0 && base > 0 ? base * Math.abs(retPct) / 100 : 0)
    const descTipo     = factura.descuento_tipo
    const descValor    = factura.descuento_valor ?? 0

    // Datos cliente con fallbacks
    const cliNombre = cli.nombre_fiscal || '-'
    const cliCif    = cli.cif || '-'
    const cliDir    = cli.direccion || '-'
    const cliUbi    = [cli.ciudad, cli.codigo_postal].filter(Boolean).join(', ') || '-'
    const cliEmail  = cli.email_principal || cli.email_secundario || ''

    return (
        <Document>
            <Page
                size="A4"
                style={{
                    paddingTop: 0,
                    paddingBottom: 60,
                    paddingHorizontal: 0,
                    fontSize: 10,
                    fontFamily: 'Helvetica',
                    color: C.slate,
                    backgroundColor: C.white,
                }}
            >
                {/* ══════════════════════════════════════════════
                    CABECERA — fondo blanco, texto oscuro
                ══════════════════════════════════════════════*/}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 36,
                    paddingTop: 28,
                    paddingBottom: 18,
                    backgroundColor: C.white,
                }}>
                    {/* Logo (sin contenedor, sin fondo) + datos emisor */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 20 }}>
                        {logoUrl && (
                            <Image src={logoUrl} style={{ width: 70, height: 70, objectFit: 'contain', marginRight: 16 }} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: C.dark, letterSpacing: 0.3 }}>
                                {empresa.nombre_fiscal}
                            </Text>
                            <Text style={{ fontSize: 8, color: C.light, marginTop: 3 }}>
                                {t.nif}: {empresa.cif}
                            </Text>
                            <Text style={{ fontSize: 8, color: C.light, marginTop: 1 }}>
                                {[empresa.direccion, empresa.ciudad, empresa.codigo_postal].filter(Boolean).join('  ·  ')}
                            </Text>
                            {empresa.email
                                ? <Text style={{ fontSize: 8, color: C.light, marginTop: 1 }}>{empresa.email}</Text>
                                : null}
                        </View>
                    </View>

                    {/* Tipo + Número de factura */}
                    <View style={{ alignItems: 'flex-end', minWidth: 150 }}>
                        <Text style={{ fontSize: 8, color: C.light, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            {factura.es_rectificativa ? t.facturaRect : t.factura}
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: C.dark, marginTop: 3, letterSpacing: 0.5 }}>
                            {factura.serie}-{factura.numero}
                        </Text>
                    </View>
                </View>

                {/* LÍNEA ROJA SEPARADORA */}
                <View style={{ height: 3, backgroundColor: C.red }} />

                {/* ══════════════════════════════════════════════
                    BLOQUE INFO: CLIENTE (izq) + DETALLES (der)
                ══════════════════════════════════════════════*/}
                <View style={{ flexDirection: 'row', marginHorizontal: 36, marginTop: 18, marginBottom: 20 }}>

                    {/* Panel CLIENTE */}
                    <View style={{ flex: 2, marginRight: 14, ...panelStyle }}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', color: C.red, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                            {t.cliente}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 5 }}>{cliNombre}</Text>
                        <Text style={valueSmall}>{t.nif}: {cliCif}</Text>
                        <Text style={valueSmall}>{cliDir}</Text>
                        <Text style={valueSmall}>{cliUbi}</Text>
                        {cliEmail ? <Text style={{ ...valueSmall, color: C.light }}>{cliEmail}</Text> : null}
                    </View>

                    {/* Panel DETALLES — mismo estilo que CLIENTE */}
                    <View style={{ flex: 1, ...panelStyle }}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', color: C.red, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                            {t.detalles}
                        </Text>

                        <Text style={labelStyle}>{t.numFactura}</Text>
                        <Text style={valueStyle}>{factura.serie}-{factura.numero}</Text>

                        <Text style={labelStyle}>{t.fechaEmision}</Text>
                        <Text style={valueStyle}>{fmtDate(factura.fecha_emision, options.idioma)}</Text>

                        {/* Fecha vencimiento: solo si existe */}
                        {factura.fecha_vencimiento ? (
                            <>
                                <Text style={labelStyle}>{t.fechaVto}</Text>
                                <Text style={{ ...valueStyle, color: C.red, marginBottom: 0 }}>
                                    {fmtDate(factura.fecha_vencimiento, options.idioma)}
                                </Text>
                            </>
                        ) : null}
                    </View>
                </View>

                {/* ══════════════════════════════════════════════
                    TABLA DE LÍNEAS
                ══════════════════════════════════════════════*/}
                <View style={{ marginHorizontal: 36 }}>

                    {/* Cabecera tabla — fondo rojo suave con bordes rojos */}
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: C.redBg,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderTopWidth: 2,
                        borderBottomWidth: 2,
                        borderTopColor: C.red,
                        borderBottomColor: C.red,
                        marginBottom: 0,
                    }}>
                        <Text style={{ width: W.concepto, fontSize: 8, fontWeight: 'bold', color: C.dark }}>{t.concepto}</Text>
                        <Text style={{ width: W.cant,    fontSize: 8, fontWeight: 'bold', color: C.dark, textAlign: 'center' }}>{t.cant}</Text>
                        <Text style={{ width: W.precio,  fontSize: 8, fontWeight: 'bold', color: C.dark, textAlign: 'right'  }}>{t.precio}</Text>
                        <Text style={{ width: W.pctIva,  fontSize: 8, fontWeight: 'bold', color: C.dark, textAlign: 'center' }}>{t.pctIva}</Text>
                        <Text style={{ width: W.impIva,  fontSize: 8, fontWeight: 'bold', color: C.dark, textAlign: 'right'  }}>{t.impIva}</Text>
                        <Text style={{ width: W.total,   fontSize: 8, fontWeight: 'bold', color: C.dark, textAlign: 'right'  }}>{t.total}</Text>
                    </View>

                    {/* Filas de líneas */}
                    {(factura.lineas || []).map((linea, i) => {
                        const esUltima  = i === (factura.lineas?.length || 1) - 1
                        const baseLin   = linea.subtotal ?? (linea.cantidad * linea.precio_unitario * (1 - (linea.descuento_porcentaje || 0) / 100))
                        const ivaLin    = baseLin * ((linea.iva_porcentaje || 21) / 100)
                        const totalLin  = baseLin + ivaLin
                        return (
                            <View
                                key={i}
                                style={{
                                    flexDirection: 'row',
                                    paddingVertical: 9,
                                    paddingHorizontal: 10,
                                    backgroundColor: i % 2 === 0 ? C.white : C.bg,
                                    borderBottomWidth: esUltima ? 0 : 1,
                                    borderBottomColor: C.border,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <View style={{ width: W.concepto }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.dark }}>{linea.concepto}</Text>
                                    {linea.descripcion
                                        ? <Text style={{ fontSize: 8, color: C.light, marginTop: 2 }}>{linea.descripcion}</Text>
                                        : null}
                                </View>
                                <Text style={{ width: W.cant,   fontSize: 9, color: C.slate, textAlign: 'center' }}>{linea.cantidad}</Text>
                                <Text style={{ width: W.precio, fontSize: 9, color: C.slate, textAlign: 'right'  }}>{fmt(linea.precio_unitario, div)}</Text>
                                <Text style={{ width: W.pctIva, fontSize: 9, color: C.slate, textAlign: 'center' }}>{linea.iva_porcentaje}%</Text>
                                <Text style={{ width: W.impIva, fontSize: 9, color: C.slate, textAlign: 'right'  }}>{fmt(ivaLin, div)}</Text>
                                <Text style={{ width: W.total,  fontSize: 9, color: C.dark,  textAlign: 'right', fontWeight: 'bold' }}>{fmt(totalLin, div)}</Text>
                            </View>
                        )
                    })}

                    {/* Cierre tabla */}
                    <View style={{ height: 1, backgroundColor: C.border, marginTop: 0 }} />
                </View>

                {/* ══════════════════════════════════════════════
                    BLOQUE TOTALES — fondo blanco, borde rojo
                ══════════════════════════════════════════════*/}
                <View style={{ marginHorizontal: 36, marginTop: 16, alignItems: 'flex-end' }}>
                    <View style={{
                        width: 255,
                        borderWidth: 1,
                        borderColor: C.redBdr,
                        borderTopWidth: 3,
                        borderTopColor: C.red,
                        borderRadius: 5,
                        overflow: 'hidden',
                        backgroundColor: C.white,
                    }}>
                        {/* Subtotal */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                            <Text style={{ fontSize: 9, color: C.light }}>{t.subtotal}</Text>
                            <Text style={{ fontSize: 9, color: C.dark, fontWeight: 'bold' }}>{fmt(sub, div)}</Text>
                        </View>

                        {/* Descuento — solo si aplica */}
                        {descTotal > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                                <Text style={{ fontSize: 9, color: '#16a34a' }}>
                                    {t.descuento}{descTipo === 'porcentaje' && descValor > 0 ? ` (${descValor}%)` : ''}
                                </Text>
                                <Text style={{ fontSize: 9, color: '#16a34a', fontWeight: 'bold' }}>-{fmt(descTotal, div)}</Text>
                            </View>
                        )}

                        {/* Base Imponible */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                            <Text style={{ fontSize: 9, color: C.light }}>{t.base}</Text>
                            <Text style={{ fontSize: 9, color: C.dark, fontWeight: 'bold' }}>{fmt(base, div)}</Text>
                        </View>

                        {/* Cuota IVA — texto oscuro uniforme */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                            <Text style={{ fontSize: 9, color: C.light }}>
                                {t.cuotaIva}{ivaPct > 0 ? ` (${ivaPct}%)` : ''}
                            </Text>
                            <Text style={{ fontSize: 9, color: C.dark, fontWeight: 'bold' }}>{fmt(ivaTot, div)}</Text>
                        </View>

                        {/* Retención — solo si aplica */}
                        {retImporte > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                                <Text style={{ fontSize: 9, color: C.light }}>
                                    {t.retencion}{retPct !== 0 ? ` (${retPct}%)` : ''}
                                </Text>
                                <Text style={{ fontSize: 9, color: '#16a34a', fontWeight: 'bold' }}>-{fmt(retImporte, div)}</Text>
                            </View>
                        )}

                        {/* TOTAL FACTURA — fondo blanco, texto rojo, borde rojo */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            backgroundColor: C.white,
                        }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.red, letterSpacing: 0.5 }}>
                                {t.totalFact}
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: C.red }}>
                                {fmt(factura.total || 0, div)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ══════════════════════════════════════════════
                    PIE DE PÁGINA
                ══════════════════════════════════════════════*/}
                <View style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 36,
                    right: 36,
                    borderTopWidth: 2,
                    borderTopColor: C.red,
                    paddingTop: 10,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {options.incluirDatosBancarios && (empresa.iban || empresa.banco) && (
                            <View style={{ flex: 1, marginRight: 20 }}>
                                <Text style={{ fontSize: 7, fontWeight: 'bold', color: C.dark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                    {t.bancarios}
                                </Text>
                                {empresa.iban  ? <Text style={{ fontSize: 8, color: C.slate }}>IBAN: {empresa.iban}</Text> : null}
                                {empresa.banco ? <Text style={{ fontSize: 8, color: C.slate }}>Entidad: {empresa.banco}</Text> : null}
                            </View>
                        )}
                        {(options.notasPie || empresa.pie_factura) && (
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 7, fontWeight: 'bold', color: C.dark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                    {t.notas}
                                </Text>
                                <Text style={{ fontSize: 8, color: C.light, fontStyle: 'italic' }}>
                                    {options.notasPie || empresa.pie_factura || ''}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.border }}>
                        <Text style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
                            {empresa.nombre_fiscal}  ·  {t.nif}: {empresa.cif}  ·  {[empresa.ciudad, empresa.codigo_postal].filter(Boolean).join(' ')}{empresa.email ? `  ·  ${empresa.email}` : ''}
                        </Text>
                    </View>
                </View>

            </Page>
        </Document>
    )
}
