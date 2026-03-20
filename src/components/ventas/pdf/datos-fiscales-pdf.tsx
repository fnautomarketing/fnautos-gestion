/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type { Empresa } from '@/types/empresa'
import { clientConfig } from '@/config/clients'

export interface DatosFiscalesPdfProps {
    empresa: Empresa
    logoUrl?: string // base64 data URI o URL pública
}

const C = {
    red:     clientConfig.colors.brandGold || '#E60007', // rojo corporativo
    dark:    clientConfig.colors.brandDark || '#0A0A0A',
    slate:   '#334155',
    light:   '#64748b',
    border:  '#e2e8f0',
    bg:      '#f8fafc',
    redBg:   '#fff5f5',   // fondo rojo muy suave (uniforme para paneles)
    redBdr:  '#fecaca',   // borde suave rojo
    white:   '#ffffff',
}

const TIPO_EMPRESA_LABELS: Record<string, string> = {
    autonomo: 'Autónomo',
    sl: 'Sociedad Limitada (S.L.)',
    sa: 'Sociedad Anónima (S.A.)',
    cooperativa: 'Cooperativa',
    asociacion: 'Asociación',
    fundacion: 'Fundación',
    comunidad_bienes: 'Comunidad de Bienes',
    otro: 'Otro',
}

const REGIMEN_IVA_LABELS: Record<string, string> = {
    general: 'Régimen General',
    simplificado: 'Régimen Simplificado',
    recargo_equivalencia: 'Recargo de Equivalencia',
    exento: 'Exento de IVA',
}

function formatIBAN(iban: string) {
    return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
}

interface RowProps {
    label: string
    value: string
}

function InfoRow({ label, value }: RowProps) {
    return (
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Text style={{ fontSize: 9, color: C.light, width: 130, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 10, color: C.dark, flex: 1, fontWeight: 'bold' }}>
                {value}
            </Text>
        </View>
    )
}

export function DatosFiscalesPdfDocument({ empresa, logoUrl }: DatosFiscalesPdfProps) {
    const direccionCompleta = [empresa.direccion, empresa.codigo_postal, empresa.ciudad, empresa.provincia, empresa.pais]
        .filter(Boolean)
        .join(', ')

    const tipoEmpresaLabel = empresa.tipo_empresa ? (TIPO_EMPRESA_LABELS[empresa.tipo_empresa] || empresa.tipo_empresa) : '-'
    const regimenIvaLabel = empresa.regimen_iva ? (REGIMEN_IVA_LABELS[empresa.regimen_iva] || empresa.regimen_iva) : '-'

    const hasContacto = empresa.telefono || empresa.email || empresa.web
    const hasBancarios = empresa.iban || empresa.banco

    return (
        <Document title={`Datos fiscales - ${empresa.razon_social}`} author={empresa.razon_social}>
            <Page
                size="A4"
                style={{
                    paddingTop: 0,
                    paddingBottom: 40, 
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
                    paddingHorizontal: 44,
                    paddingTop: 36, 
                    paddingBottom: 20,
                    backgroundColor: C.white,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 20 }}>
                        {logoUrl && (
                            <Image src={logoUrl} style={{ width: 65, height: 65, objectFit: 'contain', marginRight: 16 }} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: C.dark, letterSpacing: 0.3 }}>
                                {empresa.razon_social}
                            </Text>
                            <Text style={{ fontSize: 8, color: C.light, marginTop: 3 }}>
                                NIF/CIF: {empresa.cif}
                            </Text>
                            <Text style={{ fontSize: 8, color: C.light, marginTop: 1 }}>
                                {[empresa.direccion, empresa.ciudad, empresa.codigo_postal].filter(Boolean).join('  ·  ')}
                            </Text>
                        </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', minWidth: 120 }}>
                        <Text style={{ fontSize: 8, color: C.light, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            Datos Fiscales
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: C.dark, marginTop: 3, letterSpacing: 0.5 }}>
                            IDENTIDAD
                        </Text>
                    </View>
                </View>

                {/* LÍNEA ROJA SEPARADORA */}
                <View style={{ height: 3, backgroundColor: C.red }} />

                {/* CUERPO */}
                <View style={{ paddingHorizontal: 44, paddingTop: 30 }}>

                    {/* SECCIÓN: Identificación fiscal */}
                    <View wrap={false} style={{ marginBottom: 20, backgroundColor: C.redBg, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: C.redBdr, borderTopWidth: 3, borderTopColor: C.red }}>
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.red, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Identificación Fiscal
                            </Text>
                        </View>

                        <InfoRow label="Razón Social" value={empresa.razon_social} />
                        {empresa.nombre_comercial && empresa.nombre_comercial !== empresa.razon_social && (
                            <InfoRow label="Nombre Comercial" value={empresa.nombre_comercial} />
                        )}
                        <InfoRow label="CIF / NIF" value={empresa.cif} />
                        <InfoRow label="Tipo de empresa" value={tipoEmpresaLabel} />
                        <InfoRow label="Régimen IVA" value={regimenIvaLabel} />
                        {empresa.lugar_expedicion && (
                            <InfoRow label="Lugar de Expedición" value={empresa.lugar_expedicion} />
                        )}
                    </View>

                    {/* SECCIÓN: Domicilio fiscal */}
                    {direccionCompleta && (
                        <View wrap={false} style={{ marginBottom: 20, backgroundColor: C.white, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: C.redBdr }}>
                            <View style={{ borderBottomWidth: 1, borderBottomColor: C.redBdr, marginBottom: 12, paddingBottom: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.red, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Domicilio Fiscal
                                </Text>
                            </View>

                            {empresa.direccion && <InfoRow label="Dirección" value={empresa.direccion} />}
                            {empresa.codigo_postal && <InfoRow label="Código Postal" value={empresa.codigo_postal} />}
                            {empresa.ciudad && <InfoRow label="Ciudad" value={empresa.ciudad} />}
                            {empresa.provincia && <InfoRow label="Provincia" value={empresa.provincia} />}
                            {empresa.pais && <InfoRow label="País" value={empresa.pais} />}
                        </View>
                    )}

                    {/* SECCIÓN: Contacto */}
                    {hasContacto && (
                        <View wrap={false} style={{ marginBottom: 20, backgroundColor: C.white, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: C.redBdr }}>
                            <View style={{ borderBottomWidth: 1, borderBottomColor: C.redBdr, marginBottom: 12, paddingBottom: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.red, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Datos de Contacto
                                </Text>
                            </View>

                            {empresa.telefono && <InfoRow label="Teléfono" value={empresa.telefono} />}
                            {empresa.email && <InfoRow label="Correo electrónico" value={empresa.email} />}
                            {empresa.web && <InfoRow label="Sitio web" value={empresa.web} />}
                        </View>
                    )}

                    {/* SECCIÓN: Datos bancarios */}
                    {hasBancarios && (
                        <View wrap={false} style={{ marginBottom: 20, backgroundColor: C.white, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: C.redBdr }}>
                            <View style={{ borderBottomWidth: 1, borderBottomColor: C.redBdr, marginBottom: 12, paddingBottom: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.red, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Datos Bancarios
                                </Text>
                            </View>

                            {empresa.titular_cuenta && <InfoRow label="Titular" value={empresa.titular_cuenta} />}
                            {empresa.banco && <InfoRow label="Banco" value={empresa.banco} />}
                            {empresa.iban && <InfoRow label="IBAN" value={formatIBAN(empresa.iban)} />}
                            {empresa.swift && <InfoRow label="BIC / SWIFT" value={empresa.swift} />}
                        </View>
                    )}

                    {/* Nota legal */}
                    <View
                        wrap={false}
                        style={{
                            marginTop: 10,
                            padding: 12,
                            backgroundColor: C.redBg,
                            borderRadius: 4,
                            borderLeftWidth: 3,
                            borderLeftColor: C.red,
                        }}
                    >
                        <Text style={{ fontSize: 8, color: C.slate, lineHeight: 1.5 }}>
                            Este documento contiene los datos fiscales y bancarios de{' '}{empresa.razon_social} a efectos de facturación y pagos.
                            Válido para darse de alta como proveedor o cliente. Cualquier modificación de estos datos será comunicada oportunamente.
                        </Text>
                    </View>
                </View>

                {/* PIE DE PÁGINA */}
                <View
                    fixed
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderTopWidth: 1,
                        borderTopColor: C.red,
                        paddingTop: 10,
                        paddingBottom: 15,
                        paddingHorizontal: 40,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 7, color: C.light }}>
                        {empresa.razon_social} · CIF: {empresa.cif} · {[empresa.ciudad, empresa.codigo_postal].filter(Boolean).join(' ')}
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
