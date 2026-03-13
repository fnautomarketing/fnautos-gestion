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
}

export interface PdfOptions {
    plantilla: 'estandar' | 'premium'
    idioma: 'es' | 'en' | 'fr'
    incluirLogo: boolean
    incluirDatosBancarios: boolean
    notasPie: string
    colorAcento?: string
}

export interface FacturaPdfDocumentProps {
    factura: FacturaWithRelations
    empresa: Empresa
    // We merge plantilla and options for simplicity in this component
    options: PdfOptions
    logoUrl?: string // Passed explicitly to handle server/client path differences
}

// Helper for currency
const formatCurrency = (amount: number, divisa: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: divisa, minimumFractionDigits: 2 }).format(amount)
}

// Helper for dates (formato España: dd/MM/yyyy)
const formatDate = (date: string, lang: string = 'es') => {
    if (lang === 'en') return format(new Date(date), 'MMM dd, yyyy', { locale: enUS })
    if (lang === 'fr') return format(new Date(date), 'dd MMM yyyy', { locale: fr })
    return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

// Translations
const i18n = {
    es: {
        factura: 'FACTURA',
        facturaRectificativa: 'FACTURA RECTIFICATIVA',
        rectifica: 'Rectifica a factura',
        emisor: 'EMISOR',
        destinatario: 'DESTINATARIO / CLIENTE',
        facturarA: 'Facturar A',
        detalles: 'Detalles',
        fechaEmision: 'Fecha de Emisión',
        fechaVencimiento: 'Fecha de Vencimiento',
        concepto: 'Concepto',
        cant: 'Cant.',
        precio: 'Precio unitario',
        iva: 'IVA',
        total: 'Total',
        subtotal: 'Subtotal',
        descuento: 'Descuento',
        baseImponible: 'Base Imponible',
        cuotaIva: 'Cuota IVA',
        recargoEq: 'Recargo Eq.',
        retencion: 'Retención IRPF',
        datosBancarios: 'Datos Bancarios',
        notas: 'Notas',
        nif: 'NIF/CIF'
    },
    en: {
        factura: 'INVOICE',
        facturaRectificativa: 'CREDIT NOTE',
        rectifica: 'Rectifies invoice',
        emisor: 'ISSUER',
        destinatario: 'BILL TO / CLIENT',
        facturarA: 'Bill To',
        detalles: 'Details',
        fechaEmision: 'Issue Date',
        fechaVencimiento: 'Due Date',
        concepto: 'Description',
        cant: 'Qty',
        precio: 'Unit Price',
        iva: 'VAT',
        total: 'Total',
        subtotal: 'Subtotal',
        descuento: 'Discount',
        baseImponible: 'Tax Base',
        cuotaIva: 'VAT Amount',
        recargoEq: 'Eq. Surcharge',
        retencion: 'Withholding Tax',
        datosBancarios: 'Bank Details',
        notas: 'Notes',
        nif: 'Tax ID'
    },
    fr: {
        factura: 'FACTURE',
        facturaRectificativa: 'AVOIR',
        rectifica: 'Rectifie la facture',
        emisor: 'ÉMETTEUR',
        destinatario: 'DESTINATAIRE / CLIENT',
        facturarA: 'Facturer à',
        detalles: 'Détails',
        fechaEmision: 'Date d\'émission',
        fechaVencimiento: 'Date d\'échéance',
        concepto: 'Description',
        cant: 'Qté',
        precio: 'Prix unitaire',
        iva: 'TVA',
        total: 'Total',
        subtotal: 'Sous-total',
        descuento: 'Remise',
        baseImponible: 'Base Imposable',
        cuotaIva: 'Montant TVA',
        recargoEq: 'Surcharge Eq.',
        retencion: 'Retenue à la source',
        datosBancarios: 'Coordonnées Bancaires',
        notas: 'Notes',
        nif: 'N° TVA'
    }
}

// Base styles common to all variants - defined outside to be static
const baseStyles = {
    page: {
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#334155',
        backgroundColor: '#ffffff'
    },
    infoRow: {
        flexDirection: 'row' as const,
        marginTop: 20,
        justifyContent: 'space-between' as const
    },
    infoCol: { width: '45%' },
    text: { fontSize: 10, marginBottom: 2, color: '#475569' },
    textLg: { fontSize: 11, fontWeight: 'bold' as const, color: '#1e293b' },
    // Columns
    colConcepto: { width: '45%' },
    colCant: { width: '10%', textAlign: 'center' as const },
    colPrecio: { width: '15%', textAlign: 'right' as const },
    colIva: { width: '10%', textAlign: 'center' as const },
    colTotal: { width: '20%', textAlign: 'right' as const },
    td: { fontSize: 10, color: '#334155' },
    totalsSection: { marginTop: 20, alignItems: 'flex-end' as const },
    totalRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        width: 220,
        marginBottom: 5,
        paddingVertical: 2
    },
    totalLabel: { fontSize: 10, color: '#64748b' },
    // Logo
    logo: { width: 60, height: 60, objectFit: 'contain' as const, marginBottom: 10 },
    subtitle: { fontSize: 10, color: '#64748b', marginTop: 4 },
    footer: {
        position: 'absolute' as const,
        bottom: 40,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 20,
    },
}

export function FacturaPdfDocument({ factura, empresa, options, logoUrl }: FacturaPdfDocumentProps) {
    const t = i18n[options.idioma || 'es']
    // Ensure validated variant
    const variant = options.plantilla || 'estandar'

    // Brand Colors dinámicos desde la configuración del cliente
    const BRAND_PRIMARY = clientConfig.colors.brandGold
    const BRAND_PRIMARY_LIGHT = clientConfig.colors.brandGoldLight
    const BRAND_DARK = clientConfig.colors.brandDark

    const colorPrimary = options.colorAcento || (variant === 'premium' ? BRAND_PRIMARY : BRAND_DARK)
    const isPremium = variant === 'premium'
    const isEstandar = variant === 'estandar'

    const safeBorder = (v: number | undefined) => (v === undefined ? 0 : v)
    const safeRadius = (v: number | undefined) => (v === undefined ? 0 : v)
    const styles = {
        ...baseStyles,
        header: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
            marginBottom: 30,
            borderBottomWidth: safeBorder(isPremium ? 3 : 2),
            borderBottomColor: colorPrimary,
            paddingBottom: 20
        },
        titleContainer: {
            alignItems: 'flex-start' as const,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold' as const,
            color: colorPrimary,
            textTransform: 'uppercase' as const,
            letterSpacing: isPremium ? 1.5 : 0
        },
        sectionTitle: {
            fontSize: 9,
            fontWeight: 'black' as const,
            color: isPremium ? BRAND_DARK : '#64748b',
            textTransform: 'uppercase' as const,
            marginBottom: 8,
            borderBottomWidth: safeBorder(1),
            borderBottomColor: isPremium ? BRAND_PRIMARY_LIGHT : '#e5e7eb',
            paddingBottom: 4
        },
        table: {
            marginTop: isPremium ? 0 : 40,
            borderWidth: safeBorder(isPremium ? 2 : 1),
            borderColor: isPremium ? BRAND_PRIMARY : BRAND_PRIMARY_LIGHT,
            borderRadius: safeRadius(6),
        },
        tableHeader: {
            flexDirection: 'row' as const,
            backgroundColor: isPremium ? '#ffffff' : clientConfig.colors.accent,
            borderBottomWidth: isPremium ? 2 : 1,
            borderBottomColor: BRAND_PRIMARY,
            padding: 10,
        },
        th: {
            fontSize: 9,
            fontWeight: 'bold' as const,
            color: isPremium ? BRAND_DARK : '#475569',
            textTransform: 'uppercase' as const,
        },
        tableRow: {
            flexDirection: 'row' as const,
            borderBottomWidth: 1,
            borderBottomColor: isPremium ? BRAND_PRIMARY_LIGHT : '#f1f5f9',
            padding: 8,
            paddingVertical: 10,
        },
        totalValue: { fontSize: 10, fontWeight: 'bold' as const, color: '#1e293b', textAlign: 'right' as const },
        grandTotal: {
            borderTopWidth: 2,
            borderTopColor: colorPrimary,
            marginTop: 5,
            paddingTop: 8,
        },
        grandTotalValue: { fontSize: 16, color: colorPrimary, fontWeight: 'bold' as const },
        notesBox: {
            marginTop: 28,
            padding: 15,
            backgroundColor: isPremium ? '#ffffff' : '#f8fafc',
            borderWidth: safeBorder(isPremium ? 2 : 1),
            borderColor: isPremium ? BRAND_PRIMARY : '#e2e8f0',
            borderRadius: safeRadius(4)
        },
        footer: {
            ...baseStyles.footer,
            borderTopWidth: safeBorder(isPremium ? 2 : 1),
            borderTopColor: isPremium ? BRAND_PRIMARY : '#f1f5f9',
        }
    }

    const descuentoTotal = factura.importe_descuento || factura.descuento || 0
    const divisa = factura.divisa || 'EUR'
    const cliente = factura.cliente

    // Porcentajes para el resumen
    const baseImponible = factura.base_imponible || factura.subtotal || 0
    const ivaPct = baseImponible > 0 && factura.iva
        ? Math.round((Number(factura.iva) / baseImponible) * 100)
        : (factura.lineas?.[0])?.iva_porcentaje ?? 0
    const retencionPct = factura.retencion_porcentaje ?? 0
    const importeRetencion = (factura.importe_retencion != null && factura.importe_retencion > 0)
        ? factura.importe_retencion
        : (retencionPct !== 0 && baseImponible > 0 ? (baseImponible * Math.abs(retencionPct)) / 100 : 0)
    const descuentoTipo = factura.descuento_tipo
    const descuentoValor = factura.descuento_valor ?? 0

    // Datos cliente con fallbacks para nulls (requisitos legales España)
    const clienteDireccion = cliente.direccion || '-'
    const clienteCiudad = cliente.ciudad || ''
    const clienteCp = cliente.codigo_postal || ''
    const clienteUbicacion = [clienteCiudad, clienteCp].filter(Boolean).join(', ') || '-'
    const clienteEmail = cliente.email_principal || cliente.email_secundario || ''

    const showLogo = isPremium || (isEstandar && options.incluirLogo)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* PREMIUM: Encabezado blanco con línea dorada inferior */}
                {isPremium && (
                    <View style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: safeBorder(2), borderBottomColor: BRAND_PRIMARY }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {logoUrl && (
                                    <View style={{ backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 14, borderRadius: safeRadius(8), marginRight: 18 }}>
                                        <Image src={logoUrl} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                    </View>
                                )}
                                <View>
                                    <Text style={{ fontSize: 26, fontWeight: 'bold', color: BRAND_DARK, textTransform: 'uppercase', letterSpacing: 2 }}>
                                        {factura.es_rectificativa ? t.facturaRectificativa : t.factura}
                                    </Text>
                                    <Text style={{ fontSize: 16, color: BRAND_PRIMARY, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 }}>{factura.serie}-{factura.numero}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.fechaEmision}</Text>
                                <Text style={{ fontSize: 11, color: BRAND_DARK, fontWeight: 'bold' }}>{formatDate(factura.fecha_emision, options.idioma)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ESTÁNDAR: Header clásico */}
                {!isPremium && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: colorPrimary || BRAND_DARK }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {showLogo && logoUrl && (
                                <View style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: safeRadius(8), marginRight: 14 }}>
                                    <Image src={logoUrl} style={{ width: 72, height: 72, objectFit: 'contain' }} />
                                </View>
                            )}
                            <View>
                                <Text style={{ ...styles.title, fontSize: 22 }}>{factura.es_rectificativa ? t.facturaRectificativa : t.factura}</Text>
                                <Text style={{ fontSize: 14, color: colorPrimary, fontWeight: 'bold', marginTop: 2 }}>{factura.serie}-{factura.numero}</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.text, { fontWeight: 'bold' }]}>{t.fechaEmision}: {formatDate(factura.fecha_emision, options.idioma)}</Text>
                        </View>
                    </View>
                )}

                {/* EMISOR y DESTINATARIO - Requisitos legales España */}
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    {/* EMISOR (Empresa) */}
                    <View style={{ flex: 1, marginRight: 24, padding: 16, backgroundColor: isPremium ? '#ffffff' : '#f8fafc', borderRadius: safeRadius(6), borderWidth: safeBorder(1), borderColor: isPremium ? BRAND_PRIMARY_LIGHT : '#e2e8f0', borderLeftWidth: safeBorder(4), borderLeftColor: isPremium ? BRAND_PRIMARY : (colorPrimary || BRAND_DARK) }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: BRAND_PRIMARY, marginBottom: 8, letterSpacing: 0.5 }}>{t.emisor}</Text>
                        <Text style={{ ...styles.textLg, fontSize: 12, marginBottom: 4, color: BRAND_DARK }}>{empresa.nombre_fiscal}</Text>
                        <Text style={styles.text}>{t.nif}: {empresa.cif}</Text>
                        {empresa.direccion ? <Text style={styles.text}>{empresa.direccion}</Text> : null}
                        <Text style={styles.text}>{[empresa.ciudad, empresa.codigo_postal].filter(Boolean).join(' ') || '-'}</Text>
                        {empresa.email ? <Text style={styles.text}>{empresa.email}</Text> : null}
                    </View>

                    {/* DESTINATARIO (Cliente) */}
                    <View style={{ flex: 1, padding: 16, backgroundColor: isPremium ? '#ffffff' : '#f8fafc', borderRadius: safeRadius(6), borderWidth: safeBorder(1), borderColor: isPremium ? BRAND_PRIMARY_LIGHT : '#e2e8f0', borderLeftWidth: safeBorder(4), borderLeftColor: isPremium ? BRAND_PRIMARY : '#94a3b8' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: BRAND_DARK, marginBottom: 8, letterSpacing: 0.5 }}>{t.destinatario}</Text>
                        <Text style={{ ...styles.textLg, fontSize: 12, marginBottom: 4, color: BRAND_DARK }}>{cliente.nombre_fiscal || '-'}</Text>
                        <Text style={styles.text}>{t.nif}: {cliente.cif || '-'}</Text>
                        <Text style={styles.text}>{clienteDireccion}</Text>
                        <Text style={styles.text}>{clienteUbicacion}</Text>
                        {clienteEmail ? <Text style={styles.text}>{clienteEmail}</Text> : null}
                    </View>
                </View>

                {/* Línea dorada decorativa antes de la tabla (Premium) */}
                {isPremium && (
                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                        <View style={{ width: 80, height: 2, backgroundColor: BRAND_PRIMARY }} />
                        <View style={{ flex: 1, height: 1, backgroundColor: BRAND_PRIMARY_LIGHT, alignSelf: 'center', marginLeft: 8 }} />
                    </View>
                )}

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colConcepto]}>{t.concepto}</Text>
                        <Text style={[styles.th, styles.colCant]}>{t.cant}</Text>
                        <Text style={[styles.th, styles.colPrecio]}>{t.precio}</Text>
                        <Text style={[styles.th, styles.colIva]}>{t.iva}</Text>
                        <Text style={[styles.th, styles.colTotal]}>{t.total}</Text>
                    </View>
                    {(factura.lineas || []).map((linea, i: number) => (
                        <View key={i} style={[styles.tableRow, i === (factura.lineas?.length || 1) - 1 ? { borderBottomWidth: 0 } : {}]}>
                            <View style={styles.colConcepto}>
                                <Text style={[styles.td, { fontWeight: 'bold' }]}>{linea.concepto}</Text>
                                {linea.descripcion ? <Text style={{ fontSize: 9, color: '#64748b' }}>{linea.descripcion}</Text> : null}
                            </View>
                            <Text style={[styles.td, styles.colCant]}>{linea.cantidad}</Text>
                            <Text style={[styles.td, styles.colPrecio]}>{formatCurrency(linea.precio_unitario, divisa)}</Text>
                            <Text style={[styles.td, styles.colIva]}>{linea.iva_porcentaje}%</Text>
                            <Text style={[styles.td, styles.colTotal]}>{formatCurrency((() => { const base = linea.subtotal ?? (linea.cantidad * linea.precio_unitario * (1 - (linea.descuento_porcentaje || 0) / 100)); return base * (1 + (linea.iva_porcentaje || 21) / 100); })(), divisa)}</Text>
                        </View>
                    ))}
                </View>

                {/* TOTALS - Requisitos legales: base imponible, cuota IVA */}
                <View style={[styles.totalsSection, { marginTop: 18 }]}>
                    <View style={{ width: 260, padding: 16, backgroundColor: isPremium ? '#ffffff' : '#f8fafc', borderRadius: safeRadius(6), borderWidth: safeBorder(isPremium ? 2 : 1), borderColor: isPremium ? BRAND_PRIMARY : '#e2e8f0', ...(isPremium && { borderLeftWidth: 4, borderLeftColor: BRAND_PRIMARY }) }}>
                         <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t.subtotal}</Text>
                            <Text style={styles.totalValue}>{formatCurrency(factura.subtotal || 0, divisa)}</Text>
                        </View>
                        {descuentoTotal > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>
                                    {t.descuento}{descuentoTipo === 'porcentaje' && descuentoValor > 0 ? ` (${descuentoValor}%)` : ''}
                                </Text>
                                <Text style={[styles.totalValue, { color: '#16a34a' }]}>-{formatCurrency(descuentoTotal, divisa)}</Text>
                            </View>
                        )}
                        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: BRAND_PRIMARY_LIGHT, marginTop: 4, paddingTop: 6 }]}>
                            <Text style={styles.totalLabel}>{t.baseImponible}</Text>
                            <Text style={styles.totalValue}>{formatCurrency(baseImponible, divisa)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>
                                {t.cuotaIva || t.iva}{ivaPct > 0 ? ` (${ivaPct}%)` : ''}
                            </Text>
                            <Text style={styles.totalValue}>{formatCurrency(factura.iva || 0, divisa)}</Text>
                        </View>
                        {importeRetencion > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>
                                    {t.retencion}{retencionPct !== 0 ? ` (${retencionPct}%)` : ''}
                                </Text>
                                <Text style={styles.totalValue}>-{formatCurrency(importeRetencion, divisa)}</Text>
                            </View>
                        )}
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={[styles.totalLabel, { fontSize: 12, fontWeight: 'bold', color: colorPrimary }]}>{t.total}</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(factura.total || 0, divisa)}</Text>
                        </View>
                    </View>
                </View>

                {/* FOOTER / DATOS BANCARIOS / NOTAS */}
                <View style={styles.footer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {(options.incluirDatosBancarios && (empresa.iban || empresa.banco)) && (
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>{t.datosBancarios}</Text>
                                {empresa.iban && <Text style={styles.text}>IBAN: {empresa.iban}</Text>}
                                {empresa.banco && <Text style={styles.text}>Entidad: {empresa.banco}</Text>}
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            {(options.notasPie || empresa.pie_factura) && (
                                <View>
                                    <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>{t.notas}</Text>
                                    <Text style={[styles.text, { fontStyle: 'italic' }]}>{options.notasPie || empresa.pie_factura || ''}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={{ marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>
                            {empresa.nombre_fiscal} · CIF: {empresa.cif} · {[empresa.ciudad, empresa.codigo_postal].filter(Boolean).join(' ')}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
