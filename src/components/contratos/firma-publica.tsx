'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Download, ShieldCheck, PenTool, Eraser, Check, Eye, AlertCircle } from 'lucide-react'
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
    const [certificaFirma, setCertificaFirma] = useState(false)
    const [hasReadPdf, setHasReadPdf] = useState(false)
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true)
    const sigCanvas = useRef<SignatureCanvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 250 })

    // Responsive canvas
    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                const maxW = Math.min(containerRef.current.clientWidth - 32, 600)
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
        if (!hasReadPdf) {
            toast.error('Debes leer el documento completo antes de firmar')
            return
        }

        if (!aceptaTerminos || !certificaFirma) {
            toast.error('Debes aceptar todos los términos y certificar tu firma para continuar')
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
    
    // URL Segura con Token para el firmante
    const pdfPublicLink = `/api/contratos/public/pdf?id=${contrato.id}&token=${token}`

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 md:py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-8 space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shadow-lg shadow-primary/5 ring-4 ring-white dark:ring-slate-900 ring-offset-2 ring-offset-primary/20">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white text-center tracking-tight">
                    Firma de Documento Legal
                </h1>
                <p className="text-slate-500 text-center max-w-lg">
                    Estás firmando digitalmente el contrato con <strong>FN Autos</strong>. Sigue los pasos numerados para completar el proceso con validez legal.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
                
                {/* Panel lateral con Pasos y Resumen */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                    <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden overflow-y-auto max-h-[calc(100vh-120px)] lg:max-h-none">
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-500" />
                                <h2 className="font-bold text-slate-900 dark:text-white">Resumen Legal</h2>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px]">{contrato.numero_contrato}</Badge>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                <div className="p-6">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Check className="w-3 h-3 text-emerald-500" /> Paso 1: Identificación
                                    </p>
                                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">{rolAgente}</p>
                                    <p className="font-medium text-slate-900 dark:text-white text-lg">{nombreAgente}</p>
                                    <p className="text-sm text-slate-500 mt-1 font-mono">NIF/CIF: {contrato.tipo_operacion === 'venta' ? contrato.comprador_nif : contrato.vendedor_nif}</p>
                                </div>
                                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20">
                                    <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Objeto del Contrato</p>
                                    <p className="font-medium text-slate-900 dark:text-white leading-tight">
                                        Vehículo {contrato.vehiculo_marca} {contrato.vehiculo_modelo}
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <span className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold">
                                            {contrato.vehiculo_matricula}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 flex items-center gap-1.5">
                                        {hasReadPdf ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />} Paso 2: Lectura
                                    </p>
                                    <Button 
                                        variant={hasReadPdf ? "outline" : "default"}
                                        className={cn(
                                            "w-full h-12 shadow-sm transition-all duration-300",
                                            !hasReadPdf && "bg-primary hover:bg-primary/90 animate-pulse-subtle"
                                        )} 
                                        asChild
                                        onClick={() => setHasReadPdf(true)}
                                    >
                                        <a href={pdfPublicLink} target="_blank" rel="noopener noreferrer">
                                            <Eye className="w-4 h-4 mr-2" /> Leer Documento Completo
                                        </a>
                                    </Button>
                                    {!hasReadPdf && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2 text-center uppercase tracking-tighter italic flex items-center justify-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Debe abrir el documento antes de firmar
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Panel de Firma Principal */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className={cn(
                        "transition-all duration-500 overflow-hidden shadow-2xl relative",
                        !hasReadPdf ? "opacity-50 grayscale pointer-events-none" : "opacity-100 ring-4 ring-primary/5"
                    )}>
                        {!hasReadPdf && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/10 backdrop-blur-[1px]">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-200 dark:border-slate-800 scale-90 sm:scale-100">
                                    <Eye className="w-5 h-5 text-primary" />
                                    <span className="font-bold text-sm">Lea el documento arriba primero</span>
                                </div>
                            </div>
                        )}
                        <CardContent className="p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-primary" />
                                Paso 3: Estampa tu firma
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
                                        <p className="text-sm font-medium dark:text-white">Dibuja tu firma digital aquí</p>
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
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-2 uppercase tracking-widest font-bold">
                                Firma vinculante bajo eIDAS • {new Date().getFullYear()}
                            </p>

                            <div className="mt-8 space-y-4">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 flex items-center gap-1.5 px-1">
                                    {(aceptaTerminos && certificaFirma) ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />} Paso 4: Consentimiento Legal
                                </p>
                                
                                <Card className="p-4 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-4">
                                    {/* Checkbox 1 */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center pt-1">
                                            <Checkbox 
                                                id="terminos" 
                                                checked={aceptaTerminos}
                                                onCheckedChange={(c) => setAceptaTerminos(c as boolean)}
                                                className="h-5 w-5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600"
                                            />
                                        </div>
                                        <Label htmlFor="terminos" className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 cursor-pointer">
                                            Acepto los términos del contrato y las condiciones de firma electrónica.
                                        </Label>
                                    </div>

                                    {/* Checkbox 2 */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center pt-1">
                                            <Checkbox 
                                                id="certifica" 
                                                checked={certificaFirma}
                                                onCheckedChange={(c) => setCertificaFirma(c as boolean)}
                                                className="h-5 w-5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600"
                                            />
                                        </div>
                                        <Label htmlFor="certifica" className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 cursor-pointer">
                                            Certifico que soy <strong>{nombreAgente}</strong> y que la firma realizada arriba es auténtica y vinculante.
                                        </Label>
                                    </div>
                                </Card>

                                <div className="pt-2">
                                    <Button 
                                        size="lg" 
                                        className={cn(
                                            "w-full text-lg h-14 rounded-xl shadow-xl transition-all duration-500",
                                            isSubmitting || !aceptaTerminos || !certificaFirma || isCanvasEmpty 
                                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed grayscale"
                                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40"
                                        )}
                                        onClick={handleFirmar}
                                        disabled={isSubmitting || isCanvasEmpty || !aceptaTerminos || !certificaFirma}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando firma...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Check className="w-5 h-5" /> Confirmar y Finalizar Firma
                                            </span>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1.5 uppercase tracking-widest font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Entorno Directo Seguro eIDAS - IP: Registrada
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.02); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    )
}
