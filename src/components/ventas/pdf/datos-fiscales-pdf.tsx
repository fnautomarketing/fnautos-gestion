/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type { Empresa } from '@/types/empresa'

export interface DatosFiscalesPdfProps {
    empresa: Empresa
    logoUrl?: string // base64 data URI o URL pública
}

const BRAND_GOLD = '#E0A904'
const BRAND_DARK = '#1F2937'
const SLATE_600 = '#475569'
const SLATE_400 = '#94a3b8'
const SLATE_100 = '#f1f5f9'
const WHITE = '#ffffff'

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
            <Text style={{ fontSize: 9, color: SLATE_400, width: 130, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 10, color: BRAND_DARK, flex: 1, fontWeight: 'bold' }}>
                {value}
            </Text>
        </View>
    )
}

export function DatosFiscalesPdfDocument({ empresa, logoUrl }: DatosFiscalesPdfProps) {
    const hasLogo = !!logoUrl

    const colorAccent = BRAND_GOLD

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
                    paddingBottom: 50,
                    paddingHorizontal: 0,
                    fontSize: 10,
                    fontFamily: 'Helvetica',
                    color: BRAND_DARK,
                    backgroundColor: WHITE,
                }}
            >
                {/* CABECERA con banda de color */}
                <View
                    style={{
                        backgroundColor: BRAND_DARK,
                        paddingHorizontal: 44,
                        paddingTop: 36,
                        paddingBottom: 32,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                    }}
                >
                    {/* Nombre e identificación */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 7, color: colorAccent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                            Datos Fiscales
                        </Text>
                        <Text style={{ fontSize: 22, color: WHITE, fontWeight: 'bold', marginBottom: 4 }}>
                            {empresa.razon_social}
                        </Text>
                        {empresa.nombre_comercial && empresa.nombre_comercial !== empresa.razon_social && (
                            <Text style={{ fontSize: 11, color: SLATE_400, marginBottom: 4 }}>
                                {empresa.nombre_comercial}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <View style={{ backgroundColor: colorAccent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 }}>
                                <Text style={{ fontSize: 9, color: BRAND_DARK, fontWeight: 'bold', letterSpacing: 0.5 }}>
                                    {empresa.cif}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 9, color: SLATE_400, marginLeft: 10 }}>
                                {tipoEmpresaLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Logo */}
                    {hasLogo && (
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                backgroundColor: WHITE,
                                borderRadius: 8,
                                padding: 6,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 20,
                            }}
                        >
                            <Image
                                src={logoUrl}
                                style={{ width: 68, height: 68, objectFit: 'contain' }}
                            />
                        </View>
                    )}
                </View>

                {/* Línea de acento */}
                <View style={{ height: 4, backgroundColor: colorAccent }} />

                {/* CUERPO */}
                <View style={{ paddingHorizontal: 44, paddingTop: 32 }}>

                    {/* SECCIÓN: Identificación fiscal */}
                    <View style={{ marginBottom: 24 }}>
                        <View style={{
                            borderBottomWidth: 1,
                            borderBottomColor: colorAccent,
                            marginBottom: 14,
                            paddingBottom: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <View style={{ width: 4, height: 12, backgroundColor: colorAccent, marginRight: 8, borderRadius: 2 }} />
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: BRAND_DARK, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                        <View style={{ marginBottom: 24 }}>
                            <View style={{
                                borderBottomWidth: 1,
                                borderBottomColor: colorAccent,
                                marginBottom: 14,
                                paddingBottom: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <View style={{ width: 4, height: 12, backgroundColor: colorAccent, marginRight: 8, borderRadius: 2 }} />
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: BRAND_DARK, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                        <View style={{ marginBottom: 24 }}>
                            <View style={{
                                borderBottomWidth: 1,
                                borderBottomColor: colorAccent,
                                marginBottom: 14,
                                paddingBottom: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <View style={{ width: 4, height: 12, backgroundColor: colorAccent, marginRight: 8, borderRadius: 2 }} />
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: BRAND_DARK, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                        <View style={{ marginBottom: 24 }}>
                            <View style={{
                                borderBottomWidth: 1,
                                borderBottomColor: colorAccent,
                                marginBottom: 14,
                                paddingBottom: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <View style={{ width: 4, height: 12, backgroundColor: colorAccent, marginRight: 8, borderRadius: 2 }} />
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: BRAND_DARK, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                        style={{
                            marginTop: 8,
                            padding: 14,
                            backgroundColor: SLATE_100,
                            borderRadius: 4,
                            borderLeftWidth: 3,
                            borderLeftColor: colorAccent,
                        }}
                    >
                        <Text style={{ fontSize: 8, color: SLATE_600, lineHeight: 1.5 }}>
                            Este documento contiene los datos fiscales y bancarios de{' '}{empresa.razon_social} a efectos de facturación y pagos.
                            Válido para darse de alta como proveedor o cliente. Cualquier modificación de estos datos será comunicada oportunamente.
                        </Text>
                    </View>
                </View>

                {/* PIE DE PÁGINA */}
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 40,
                        backgroundColor: BRAND_DARK,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 44,
                        justifyContent: 'space-between',
                    }}
                >
                    <Text style={{ fontSize: 8, color: SLATE_400 }}>
                        {empresa.razon_social} · {empresa.cif}
                    </Text>
                    <Text style={{ fontSize: 8, color: SLATE_400 }}>
                        Datos Fiscales
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
