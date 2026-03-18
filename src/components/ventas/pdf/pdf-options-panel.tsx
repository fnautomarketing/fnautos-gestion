'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Mail, Printer, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

import { clientConfig } from '@/config/clients'

export type PdfOptions = {
    /** Siempre 'premium' – única plantilla activa */
    plantilla: 'premium'
    idioma: 'es' | 'en' | 'fr'
    incluirLogo: boolean
    notasPie: string
    incluirDatosBancarios: boolean
}

/** Única plantilla disponible: Premium */
export function getPlantillasDisponibles(): Array<{ value: 'premium'; label: string }> {
    return [{ value: 'premium', label: 'Premium (logotipo y colores corporativos)' }]
}

interface PdfOptionsPanelProps {
    options: PdfOptions
    onChange: (options: PdfOptions) => void
    onDownload: () => void
    esExterna?: boolean
    tieneArchivoOriginal?: boolean
    facturaId?: string | null
}

export function PdfOptionsPanel({ options, onChange, onDownload, esExterna, tieneArchivoOriginal, facturaId = null }: PdfOptionsPanelProps) {
    const handleChange = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
        onChange({ ...options, [key]: value })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-slate-500" />
                        Configuración
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Idioma</Label>
                        <Select value={options.idioma} onValueChange={(val) => handleChange('idioma', val as 'es' | 'en' | 'fr')}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="en">Inglés</SelectItem>
                                <SelectItem value="fr">Francés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="flex flex-col gap-1">
                                <span>Datos Bancarios</span>
                                <span className="font-normal text-xs text-slate-500">IBAN y Banco en el pie</span>
                            </Label>
                            <Switch
                                checked={options.incluirDatosBancarios}
                                onCheckedChange={(checked) => handleChange('incluirDatosBancarios', checked)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notas al pie</Label>
                        <Textarea
                            value={options.notasPie}
                            onChange={(e) => handleChange('notasPie', e.target.value)}
                            placeholder="Gracias por su confianza..."
                            className="h-20 resize-none text-xs"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <Button onClick={onDownload} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        {esExterna && tieneArchivoOriginal ? 'Generar PDF con plantilla' : 'Descargar PDF'}
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                        {facturaId ? (
                            <Button variant="outline" asChild>
                                <Link href={`/ventas/facturas/${facturaId}/email`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => toast.info('Envío de email próximamente')}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
