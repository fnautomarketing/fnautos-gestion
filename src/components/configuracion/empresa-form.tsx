'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { clientConfig } from '@/config/clients'
import { validarCIF } from '@/lib/utils/cif-validator'
import {
    Building2, MapPin, Phone, CreditCard, FileText, Upload, X, CheckCircle2, AlertCircle, Euro
} from 'lucide-react'
import { actualizarEmpresaAction, subirLogoEmpresaAction, eliminarLogoEmpresaAction } from '@/app/actions/empresa'
import type { Empresa } from '@/types/empresa'

const TIPOS_EMPRESA = [
    { value: 'autonomo', label: 'Autónomo' },
    { value: 'sl', label: 'Sociedad Limitada (S.L.)' },
    { value: 'sa', label: 'Sociedad Anónima (S.A.)' },
    { value: 'cooperativa', label: 'Cooperativa' },
    { value: 'asociacion', label: 'Asociación' },
    { value: 'fundacion', label: 'Fundación' },
    { value: 'comunidad_bienes', label: 'Comunidad de Bienes' },
    { value: 'otro', label: 'Otro' },
]

const REGIMENES_IVA = [
    { value: 'general', label: 'Régimen General' },
    { value: 'simplificado', label: 'Régimen Simplificado' },
    { value: 'recargo_equivalencia', label: 'Recargo de Equivalencia' },
    { value: 'exento', label: 'Exento de IVA' },
]

const PROVINCIAS_ESPANA = [
    'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
    'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares',
    'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lérida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia',
    'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
    'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
]

interface Props {
    empresa: Empresa
    series: Array<{ id: string; codigo: string; nombre: string; prefijo: string }>
    plantillas: Array<{ id: string; nombre: string }>
}

const NONE_VALUE = '__none__' // Valor reservado para "Ninguna" (Radix Select no permite value="")

export function ConfiguracionEmpresaForm({ empresa: empresaInicial, series, plantillas }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [empresa, setEmpresa] = useState(empresaInicial)
    // Inicializar con NONE_VALUE para evitar hydration mismatch (server/client pueden tener datos distintos)
    const [seriePredeterminadaId, setSeriePredeterminadaId] = useState(empresaInicial.serie_predeterminada_id || NONE_VALUE)
    const [plantillaPredeterminadaId, setPlantillaPredeterminadaId] = useState(empresaInicial.plantilla_pdf_predeterminada_id || NONE_VALUE)
    const [cifValido, setCifValido] = useState<boolean | null>(empresaInicial.cif ? validarCIF(empresaInicial.cif) : null)

    const [ibanValido, setIbanValido] = useState<boolean | null>(() => {
        if (!empresaInicial.iban) return null
        const normalized = empresaInicial.iban.replace(/[^A-Z0-9]/gi, '').toUpperCase()
        const regexES = /^ES[0-9]{22}$/
        const regexGral = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/
        return regexES.test(normalized) || regexGral.test(normalized)
    })
    const [subiendoLogo, setSubiendoLogo] = useState(false)

    // Validar CIF/NIF/NIE en tiempo real
    function validarDocumentoFiscal(cif: string) {
        setCifValido(validarCIF(cif))
    }

    // Validar IBAN en tiempo real (formato básico)
    function validarIBAN(iban: string) {
        if (!iban) {
            setIbanValido(null)
            return
        }
        // Normalización para validación (quitar símbolos y espacios, a mayúsculas)
        const normalized = iban.replace(/[^A-Z0-9]/gi, '').toUpperCase()
        // Permitir formato español (ES + 22 dígitos) o internacionales (15-34 caracteres)
        const regexES = /^ES[0-9]{22}$/
        const regexGral = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/

        const esValido = regexES.test(normalized) || regexGral.test(normalized)
        setIbanValido(esValido)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (cifValido === false) {
            toast.error('El CIF no es válido')
            return
        }

        if (empresa.iban && ibanValido === false) {
            toast.error('El IBAN no es válido')
            return
        }

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await actualizarEmpresaAction(formData)

            if (result.success) {
                toast.success('Configuración actualizada correctamente')
                router.refresh()
            } else {
                toast.error(result.error || 'Error al actualizar')
            }
        })
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setSubiendoLogo(true)

        const formData = new FormData()
        formData.append('logo', file)

        const result = await subirLogoEmpresaAction(formData)

        setSubiendoLogo(false)

        if (result.success && result.data) {
            toast.success('Logo actualizado')
            setEmpresa({ ...empresa, logo_url: result.data.url })
            router.refresh()
        } else {
            toast.error(result.error || 'Error al subir logo')
        }
    }

    const handleLogoDelete = async () => {
        const result = await eliminarLogoEmpresaAction()

        if (result.success) {
            toast.success('Logo eliminado')
            setEmpresa({ ...empresa, logo_url: undefined })
            router.refresh()
        } else {
            toast.error(result.error || 'Error al eliminar logo')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo oculto con el ID real de la empresa activa */}
            <input type="hidden" name="empresa_id" value={empresa.id} />
            <div className="flex justify-end gap-2 text-right mb-4 sticky top-4 z-10">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* DATOS FISCALES */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Building2 className="h-5 w-5" />
                            Datos Fiscales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Logo */}
                        <div>
                            <Label>Logotipo de la empresa</Label>
                            <p className="text-sm text-slate-500 mb-2">
                                Este logo aparecerá en todas las facturas, albaranes y documentos generados por el sistema.
                                Se recomienda formato PNG con fondo transparente.
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 w-48 h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
                                    {empresa.logo_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={empresa.logo_url}
                                                alt="Logo"
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleLogoDelete}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-500">Subir Logo</p>
                                            <p className="text-xs text-slate-400">PNG, JPG o WEBP (máx. 5MB)</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={subiendoLogo}
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {subiendoLogo ? 'Subiendo...' : 'Cambiar Logo'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Razón Social */}
                        <div>
                            <Label htmlFor="razon_social">Razón Social *</Label>
                            <Input
                                id="razon_social"
                                name="razon_social"
                                defaultValue={empresa.razon_social}
                                required
                                placeholder={`Ej. ${clientConfig.nombre}`}
                                onChange={(e) => setEmpresa({ ...empresa, razon_social: e.target.value })}
                            />
                        </div>

                        {/* Nombre Comercial */}
                        <div>
                            <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
                            <Input
                                id="nombre_comercial"
                                name="nombre_comercial"
                                defaultValue={empresa.nombre_comercial || ''}
                                placeholder={`Ej. ${clientConfig.nombreCorto}`}
                            />
                        </div>

                        {/* CIF/NIF */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cif">CIF/NIF *</Label>
                                <div className="relative">
                                    <Input
                                        id="cif"
                                        name="cif"
                                        defaultValue={empresa.cif}
                                        required
                                        placeholder="B12345678"
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            validarDocumentoFiscal(val);
                                            setEmpresa({ ...empresa, cif: val });
                                        }}
                                        className={
                                            cifValido === null ? '' :
                                                cifValido ? 'border-green-500' : 'border-red-500'
                                        }
                                    />
                                    {cifValido !== null && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            {cifValido ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="tipo_empresa">Tipo de empresa</Label>
                                <Select name="tipo_empresa" defaultValue={empresa.tipo_empresa}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIPOS_EMPRESA.map((tipo) => (
                                            <SelectItem key={tipo.value} value={tipo.value}>
                                                {tipo.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DIRECCIÓN */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <MapPin className="h-5 w-5" />
                            Dirección
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Dirección completa */}
                        <div>
                            <Label htmlFor="direccion">Dirección completa</Label>
                            <Input
                                id="direccion"
                                name="direccion"
                                defaultValue={empresa.direccion || ''}
                                placeholder="C/ Ejemplo, 123, Polígono Industrial"
                            />
                        </div>

                        {/* CP y Ciudad */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="codigo_postal">Código Postal</Label>
                                <Input
                                    id="codigo_postal"
                                    name="codigo_postal"
                                    defaultValue={empresa.codigo_postal || ''}
                                    placeholder="28001"
                                    maxLength={5}
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="ciudad">Ciudad</Label>
                                <Input
                                    id="ciudad"
                                    name="ciudad"
                                    defaultValue={empresa.ciudad || ''}
                                    placeholder="Madrid"
                                />
                            </div>
                        </div>

                        {/* Provincia y País */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="provincia">Provincia</Label>
                                <Select name="provincia" defaultValue={empresa.provincia || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROVINCIAS_ESPANA.map((prov) => (
                                            <SelectItem key={prov} value={prov}>
                                                {prov}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="pais">País</Label>
                                <Select name="pais" defaultValue={empresa.pais}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="España">España</SelectItem>
                                        <SelectItem value="Portugal">Portugal</SelectItem>
                                        <SelectItem value="Francia">Francia</SelectItem>
                                        <SelectItem value="Alemania">Alemania</SelectItem>
                                        <SelectItem value="Italia">Italia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CONTACTO */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Phone className="h-5 w-5" />
                            Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                name="telefono"
                                defaultValue={empresa.telefono || ''}
                                placeholder="+34 900 000 000"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={empresa.email || ''}
                                placeholder="info@empresa.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="web">Sitio Web</Label>
                            <Input
                                id="web"
                                name="web"
                                defaultValue={empresa.web || ''}
                                placeholder="www.empresa.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* DATOS BANCARIOS */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <CreditCard className="h-5 w-5" />
                            Datos Bancarios
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="banco">Nombre del Banco</Label>
                            <Input
                                id="banco"
                                name="banco"
                                defaultValue={empresa.banco || ''}
                                placeholder="Ej. BBVA"
                            />
                        </div>
                        <div>
                            <Label htmlFor="titular_cuenta">Titular de la cuenta</Label>
                            <Input
                                id="titular_cuenta"
                                name="titular_cuenta"
                                defaultValue={empresa.titular_cuenta || ''}
                                placeholder="Nombre del titular"
                            />
                        </div>
                        <div>
                            <Label htmlFor="iban">IBAN</Label>
                            <div className="relative">
                                <Input
                                    id="iban"
                                    name="iban"
                                    defaultValue={empresa.iban || ''}
                                    placeholder="ES00 0000 0000 0000 0000 0000"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        validarIBAN(val);
                                        setEmpresa({ ...empresa, iban: val });
                                    }}
                                    className={
                                        ibanValido === null ? '' :
                                            ibanValido ? 'border-green-500' : 'border-red-500'
                                    }
                                />
                                {ibanValido !== null && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {ibanValido ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="swift">SWIFT / BIC</Label>
                            <Input
                                id="swift"
                                name="swift"
                                defaultValue={empresa.swift || ''}
                                placeholder="BBVAESMM"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* CONFIGURACIÓN DE FACTURACIÓN */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <FileText className="h-5 w-5" />
                            Configuración de Facturación
                        </CardTitle>
                        <p className="text-sm text-slate-500 font-normal">
                            Serie predeterminada, plantilla PDF y plazos de pago
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="serie_predeterminada_id">Serie de Facturación Predeterminada</Label>
                                <input type="hidden" name="serie_predeterminada_id" value={seriePredeterminadaId === NONE_VALUE ? '' : seriePredeterminadaId} />
                                <Select value={seriePredeterminadaId} onValueChange={setSeriePredeterminadaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar serie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>Ninguna</SelectItem>
                                        {series.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.codigo} - {s.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500 mt-1">Se usará al crear nuevas facturas</p>
                            </div>
                            <div>
                                <Label htmlFor="plantilla_pdf_predeterminada_id">Plantilla PDF Predeterminada</Label>
                                <input type="hidden" name="plantilla_pdf_predeterminada_id" value={plantillaPredeterminadaId === NONE_VALUE ? '' : plantillaPredeterminadaId} />
                                <Select value={plantillaPredeterminadaId} onValueChange={setPlantillaPredeterminadaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar plantilla" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>Ninguna</SelectItem>
                                        {plantillas.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="dias_pago_predeterminados">Días para Vencimiento (por defecto)</Label>
                                <Input
                                    id="dias_pago_predeterminados"
                                    name="dias_pago_predeterminados"
                                    type="number"
                                    min="1"
                                    max="365"
                                    defaultValue={empresa.dias_pago_predeterminados ?? 30}
                                    placeholder="30"
                                />
                                <p className="text-xs text-slate-500 mt-1">Días desde emisión hasta vencimiento</p>
                            </div>
                            <div>
                                <Label htmlFor="lugar_expedicion">Lugar de Expedición</Label>
                                <Input
                                    id="lugar_expedicion"
                                    name="lugar_expedicion"
                                    defaultValue={empresa.lugar_expedicion || ''}
                                    placeholder="Ej. Madrid, España"
                                />
                                <p className="text-xs text-slate-500 mt-1">Aparece en las facturas emitidas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CONFIGURACIÓN FISCAL */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Euro className="h-5 w-5" />
                            Configuración Fiscal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="iva_predeterminado">IVA Predeterminado (%)</Label>
                                <Input
                                    id="iva_predeterminado"
                                    name="iva_predeterminado"
                                    type="number"
                                    step="0.01"
                                    defaultValue={empresa.iva_predeterminado}
                                />
                            </div>
                            <div>
                                <Label htmlFor="retencion_predeterminada">Retención IRPF (%)</Label>
                                <Input
                                    id="retencion_predeterminada"
                                    name="retencion_predeterminada"
                                    type="number"
                                    step="0.01"
                                    defaultValue={empresa.retencion_predeterminada}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="regimen_iva">Régimen IVA</Label>
                            <Select name="regimen_iva" defaultValue={empresa.regimen_iva}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REGIMENES_IVA.map((reg) => (
                                        <SelectItem key={reg.value} value={reg.value}>
                                            {reg.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="aplica_recargo">Recargo de Equivalencia</Label>
                                <p className="text-sm text-slate-500">
                                    Aplicar recargo de equivalencia por defecto
                                </p>
                            </div>
                            <input
                                type="hidden"
                                name="aplica_recargo_equivalencia"
                                value={empresa.aplica_recargo_equivalencia ? 'true' : 'false'}
                            />
                            <Switch
                                id="aplica_recargo"
                                checked={empresa.aplica_recargo_equivalencia}
                                onCheckedChange={(checked) => setEmpresa({ ...empresa, aplica_recargo_equivalencia: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>

                        <div>
                            <Label htmlFor="recargo_porcentaje">Porcentaje Recargo (%)</Label>
                            <Input
                                id="recargo_porcentaje"
                                name="recargo_porcentaje"
                                type="number"
                                step="0.01"
                                defaultValue={empresa.recargo_porcentaje}
                            />
                        </div>

                    </CardContent>
                </Card>

                {/* TEXTOS LEGALES */}
                <Card className="lg:col-span-2 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <FileText className="h-5 w-5" />
                            Textos Legales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="pie_factura">Pie de Factura (Texto corto)</Label>
                            <p className="text-sm text-slate-500 mb-2">Aparece al final de todas las facturas</p>
                            <Textarea
                                id="pie_factura"
                                name="pie_factura"
                                defaultValue={empresa.pie_factura || ''}
                                placeholder="Ej. Registro Mercantil de Madrid, Tomo 1234, Folio 12..."
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label htmlFor="clausulas_generales">Cláusulas Generales / Notas Legales</Label>
                            <p className="text-sm text-slate-500 mb-2">Aparece en una página anexa o al final del documento</p>
                            <Textarea
                                id="clausulas_generales"
                                name="clausulas_generales"
                                defaultValue={empresa.clausulas_generales || ''}
                                placeholder="Términos y condiciones, protección de datos, etc..."
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}
