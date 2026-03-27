'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Download, ShieldCheck, PenTool, Eraser, Check } from 'lucide-react'
import type { Contrato } from '@/types/contratos'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface FirmaPublicaProps {
    contrato: Contrato
    token: string
}

export function FirmaPublica({ contrato, token }: FirmaPublicaProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [aceptaTerminos, setAceptaTerminos] = useState(false)
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true)
    const sigCanvas = useRef<SignatureCanvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 250 })

    // Responsive canvas
    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                const maxW = Math.min(containerRef.current.clientWidth - 32, 600) // Padding compensation
                setCanvasSize({ width: maxW, height: 250 })
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const clearSignature = () => {
        sigCanvas.current?.clear()
        setIsCanvasEmpty(true)
    }

    const handleSignEnd = () => {
        setIsCanvasEmpty(sigCanvas.current?.isEmpty() ?? true)
    }

    const handleFirmar = async () => {
        if (!aceptaTerminos) {
            toast.error('Debes aceptar los términos y condiciones para continuar')
            return
        }

        if (sigCanvas.current?.isEmpty() || isCanvasEmpty) {
            toast.error('Debes realizar tu firma en el recuadro para continuar')
            return
        }

        setIsSubmitting(true)

        try {
            let firmaData: string
            try {
                firmaData = sigCanvas.current!.getTrimmedCanvas().toDataURL('image/png')
            } catch (e) {
                console.warn('getTrimmedCanvas failed, using getCanvas', e)
                firmaData = sigCanvas.current!.getCanvas().toDataURL('image/png')
            }

            const res = await fetch('/api/contratos/firmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    firma_data: firmaData,
                    aceptar_terminos: aceptaTerminos
                })
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Error al procesar la firma')
            }

            toast.success('Contrato firmado exitosamente', {
                description: 'Recibirás una copia en tu correo electrónico.'
            })
            
            // Recargar la página para que el server component muestre la vista de éxito
            router.refresh()
            
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido'
            toast.error('Ocurrió un error al firmar el contrato', {
                description: message
            })
            setIsSubmitting(false)
        }
    }

    const nombreAgente = contrato.tipo_operacion === 'venta' ? contrato.comprador_nombre : contrato.vendedor_nombre
    const rolAgente = contrato.tipo_operacion === 'venta' ? 'Comprador' : 'Vendedor'

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 md:py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-8 space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shadow-lg shadow-primary/5">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white text-center tracking-tight">
                    Firma de Documento Legal
                </h1>
                <p className="text-slate-500 text-center max-w-lg">
                    Revisa cuidadosamente los detalles del contrato a continuación antes de proceder con tu firma digital legalmente vinculante.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
                
                {/* Panel de Información del Contrato */}
                <Card className="lg:col-span-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden self-start sticky top-8">
                    <div className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" />
                            <h2 className="font-bold text-slate-900 dark:text-white">Resumen</h2>
                        </div>
                        <Badge variant="outline" className="font-mono">{contrato.numero_contrato}</Badge>
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            <div className="p-6">
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">{rolAgente}</p>
                                <p className="font-medium text-slate-900 dark:text-white text-lg">{nombreAgente}</p>
                                <p className="text-sm text-slate-500 mt-1">NIF/CIF: {contrato.tipo_operacion === 'venta' ? contrato.comprador_nif : contrato.vendedor_nif}</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20">
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Vehículo</p>
                                <p className="font-medium text-slate-900 dark:text-white leading-tight">
                                    {contrato.vehiculo_marca} {contrato.vehiculo_modelo} {contrato.vehiculo_version || ''}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold">
                                        {contrato.vehiculo_matricula}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                                        VIN: {contrato.vehiculo_bastidor.substring(0, 8)}...
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Importe {contrato.tipo_operacion === 'venta' ? 'de Venta' : 'de Adquisición'}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {formatCurrency(contrato.total_con_iva || contrato.precio_venta)}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Forma de pago: <span className="capitalize">{contrato.forma_pago}</span></p>
                            </div>
                            <div className="p-6 flex justify-center bg-slate-50/80 dark:bg-slate-800/40">
                                <Button variant="outline" className="w-full bg-white dark:bg-slate-900 shadow-sm" asChild>
                                    <a href={`/api/contratos/${contrato.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4 mr-2" /> Leer Documento Completo (PDF)
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Panel de Firma */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-primary/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-primary/10">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />
                        <CardContent className="p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-primary" />
                                Estampa tu firma
                            </h3>
                            
                            <div 
                                ref={containerRef}
                                className={cn(
                                    "relative w-full rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-950",
                                    isCanvasEmpty ? "border-dashed border-slate-300 dark:border-slate-700" : "border-solid border-primary/50"
                                )}
                            >
                                <SignatureCanvas 
                                    ref={sigCanvas}
                                    canvasProps={{
                                        width: canvasSize.width,
                                        height: canvasSize.height,
                                        className: 'sigCanvas touch-none select-none cursor-crosshair'
                                    }}
                                    onEnd={handleSignEnd}
                                    penColor="black"
                                    backgroundColor="rgba(255,255,255,0)"
                                />
                                
                                {isCanvasEmpty && (
                                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40">
                                        <PenTool className="w-8 h-8 mb-2 dark:text-white" />
                                        <p className="text-sm font-medium dark:text-white">Dibuja tu firma aquí</p>
                                    </div>
                                )}

                                {!isCanvasEmpty && (
                                    <button 
                                        type="button"
                                        onClick={clearSignature}
                                        className="absolute top-3 right-3 p-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-lg backdrop-blur text-slate-500 transition-colors z-10"
                                        title="Borrar firma"
                                    >
                                        <Eraser className="w-4 h-4" />
                                    </button>
                                )}
                                
                                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none opacity-20">
                                    <div className="h-px bg-slate-900 dark:bg-slate-100 w-full mb-1 border-b border-dashed border-slate-900 dark:border-white"></div>
                                </div>
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-2 uppercase tracking-widest font-bold">Firma Digital eIDAS - {formatDate(new Date())}</p>

                            
                            {/* Sticky Action Area for Mobile Optimization Premium */}
                            <div className="sticky bottom-0 z-50 -mx-6 -mb-6 mt-8 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 sm:static sm:mx-0 sm:mb-0 sm:mt-8 sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none space-y-6">
                                <div className="flex items-start space-x-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <Checkbox 
                                        id="terms" 
                                        checked={aceptaTerminos}
                                        onCheckedChange={(c) => setAceptaTerminos(c as boolean)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="terms" className="font-semibold cursor-pointer text-slate-900 dark:text-slate-200">
                                            Acepto los términos y certifico mi firma
                                        </Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Entiendo que esta firma electrónica tiene la misma validez legal que mi firma manuscrita según el Reglamento (UE) nº 910/2014 (eIDAS). He leído el contrato en su totalidad y acepto sus condiciones.
                                        </p>
                                    </div>
                                </div>

                                <Button 
                                    size="lg" 
                                    className="w-full text-lg h-14 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                                    onClick={handleFirmar}
                                    disabled={isSubmitting || isCanvasEmpty || !aceptaTerminos}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando firma segura...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Check className="w-5 h-5" /> Firmar Legalmente
                                        </span>
                                    )}
                                </Button>
                                <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1.5 pb-safe">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Tu dirección IP y metadatos serán registrados por seguridad.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
