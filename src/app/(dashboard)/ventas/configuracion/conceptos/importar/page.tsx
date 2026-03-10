'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { importarCSVAction } from '@/app/actions/conceptos'

export default function ImportarConceptosPage() {
    const router = useRouter()
    const [csvData, setCsvData] = useState('')
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

    const handleImport = () => {
        if (!csvData.trim()) {
            toast.error('Por favor ingresa datos CSV')
            return
        }

        startTransition(async () => {
            const res = await importarCSVAction(csvData)
            setResult(res)
            if (res.success) {
                toast.success(`Se importaron ${res.count} conceptos correctamente`)
                setTimeout(() => {
                    router.push('/ventas/configuracion/conceptos')
                    router.refresh()
                }, 2000)
            } else {
                toast.error('Error al importar')
            }
        })
    }

    const exampleCSV = `codigo,nombre,descripcion,categoria,tipo,precio_base,iva_porcentaje
SRV-001,Consultoría Básica,Asesoramiento inicial,otros,servicio,50.00,21
PRD-005,Cable HDMI 2m,Cable de alta velocidad,material,producto,12.50,21`

    return (
        <div className="w-full py-8 px-4 space-y-6">
            <Button
                variant="ghost"
                className="pl-0 hover:pl-2 transition-all"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
            </Button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Importar Conceptos</h1>
                <p className="text-muted-foreground mt-2">
                    Carga múltiples servicios o productos a la vez usando formato CSV.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pegar CSV</CardTitle>
                            <CardDescription>
                                Pega el contenido de tu archivo CSV aquí. La primera línea debe ser la cabecera.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="codigo,nombre,precio_base..."
                                className="min-h-[300px] font-mono text-sm"
                                value={csvData}
                                onChange={(e) => setCsvData(e.target.value)}
                            />

                            {result && (
                                <Alert variant={result.success ? "default" : "destructive"} className={result.success ? "border-green-500 bg-green-50 dark:bg-green-900/20" : ""}>
                                    {result.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                                    <AlertTitle>{result.success ? "Importación exitosa" : "Error en importación"}</AlertTitle>
                                    <AlertDescription>
                                        {result.success
                                            ? `Se han creado ${result.count} conceptos nuevos.`
                                            : result.error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleImport}
                                    disabled={isPending || !csvData.trim()}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {isPending ? 'Importando...' : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Procesar Importación
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-50 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Formato Requerido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <p>Las columnas obligatorias son:</p>
                            <ul className="list-disc pl-4 space-y-1 text-slate-500">
                                <li>codigo (texto único)</li>
                                <li>nombre (texto)</li>
                                <li>categoria (transporte, almacenaje, logistica, material, otros)</li>
                                <li>tipo (servicio, producto)</li>
                                <li>precio_base (número)</li>
                                <li>iva_porcentaje (número)</li>
                            </ul>
                            <div className="mt-4">
                                <p className="font-medium mb-2">Ejemplo:</p>
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto">
                                    <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre">
                                        {exampleCSV}
                                    </pre>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => setCsvData(exampleCSV)}
                                >
                                    <FileText className="h-3 w-3 mr-2" />
                                    Cargar Ejemplo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
