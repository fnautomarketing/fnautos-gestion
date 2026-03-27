'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Download, ShieldCheck, PenTool, Eraser, Check, Eye, AlertCircle, Info, ArrowRight } from 'lucide-react'
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
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 250 })

    // Responsive canvas
    useEffect(() => {
        function handleResize() {
            if (canvasContainerRef.current) {
                const maxW = Math.min(canvasContainerRef.current.clientWidth, 600)
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
    
    const pdfPublicLink = `/api/contratos/public/pdf?id=${contrato.id}&token=${token}`

    const steps = [
        { name: 'Identidad', icon: UsersIcon, completed: true },
        { name: 'Lectura', icon: Eye, completed: hasReadPdf },
        { name: 'Firma', icon: PenTool, completed: !isCanvasEmpty },
        { name: 'Legal', icon: ShieldCheck, completed: aceptaTerminos && certificaFirma }
    ]

    function UsersIcon(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        )
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 md:py-16 animate-in fade-in duration-1000">
            {/* Nav Stepper Premium */}
            <div className="mb-12">
                <div className="flex items-center justify-between max-w-2xl mx-auto relative px-4 sm:px-0">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                    {steps.map((step, idx) => {
                        const Icon = step.icon
                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                    step.completed 
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                                )}>
                                    {step.completed && idx < 3 ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] sm:text-xs font-bold uppercase tracking-widest",
                                    step.completed ? "text-emerald-600" : "text-slate-400"
                                )}>
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-12 space-y-4">
                <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 rounded-full font-bold tracking-widest uppercase text-[10px]">
                    Proceso de Firma Segura Pro
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
                    Confirmación de Contrato
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Has recibido este documento de <strong>FN Autos</strong> para su revisión y firma legal vinculante.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Lateral: Información y Lectura */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" /> Detalles
                            </h3>
                            <span className="text-xs font-mono text-slate-400">{contrato.numero_contrato}</span>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{rolAgente}</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{nombreAgente}</p>
                                <p className="text-sm font-mono text-slate-500">{contrato.tipo_operacion === 'venta' ? contrato.comprador_nif : contrato.vendedor_nif}</p>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Vehículo</p>
                                <p className="font-bold text-slate-900 dark:text-white">{contrato.vehiculo_marca} {contrato.vehiculo_modelo}</p>
                                <Badge variant="secondary" className="mt-2 font-mono">{contrato.vehiculo_matricula}</Badge>
                            </div>

                            <div className="pt-2">
                                <Button 
                                    className={cn(
                                        "w-full h-14 text-white font-bold rounded-xl transition-all duration-500 shadow-xl",
                                        hasReadPdf 
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
                                            : "bg-primary hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40"
                                    )}
                                    asChild
                                    onClick={() => setHasReadPdf(true)}
                                >
                                    <a href={pdfPublicLink} target="_blank" rel="noopener noreferrer">
                                        {hasReadPdf ? (
                                            <span className="flex items-center gap-2">
                                                <Check className="w-5 h-5 text-emerald-500" /> Documento Leído
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Eye className="w-5 h-5 mr-1" /> Paso 2: Leer Documento
                                            </span>
                                        )}
                                    </a>
                                </Button>
                                {!hasReadPdf && (
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-primary font-black uppercase leading-none justify-center">
                                        <ArrowRight className="w-3 h-3 animate-bounce-x" /> Haz clic para desbloquear firma
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Principal: Firma y Legal */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardContent className="p-6 sm:p-10">
                            
                            <div className={cn(
                                "space-y-8 transition-all duration-700",
                                !hasReadPdf ? "opacity-20 blur-[2px] pointer-events-none" : "opacity-100 blur-0"
                            )}>
                                {/* Signature Area */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <PenTool className="w-5 h-5 text-primary" />
                                        </div>
                                        Paso 3: Realiza tu firma
                                    </h3>
                                    
                                    <div 
                                        ref={canvasContainerRef}
                                        className={cn(
                                            "relative w-full rounded-2xl border-2 transition-all duration-300 bg-white dark:bg-slate-950",
                                            isCanvasEmpty ? "border-dashed border-slate-200 dark:border-slate-800" : "border-solid border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]"
                                        )}
                                    >
                                        <SignatureCanvas 
                                            ref={sigCanvas}
                                            canvasProps={{
                                                width: canvasSize.width,
                                                height: canvasSize.height,
                                                className: 'sigCanvas touch-none select-none'
                                            }}
                                            onEnd={handleSignEnd}
                                            penColor="black"
                                            backgroundColor="transparent"
                                        />
                                        
                                        {isCanvasEmpty && (
                                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                                <PenTool className="w-10 h-10 mb-2 opacity-20" />
                                                <p className="text-sm font-bold uppercase tracking-widest opacity-40">Firma aquí usando tu dedo o ratón</p>
                                            </div>
                                        )}

                                        {!isCanvasEmpty && (
                                            <button 
                                                type="button"
                                                onClick={clearSignature}
                                                className="absolute top-4 right-4 p-2.5 bg-white shadow-lg dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-xl transition-all active:scale-90"
                                                title="Limpiar"
                                            >
                                                <Eraser className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-tighter px-1">
                                        <span>Validez Legal eIDAS</span>
                                        <span>{formatDate(new Date())}</span>
                                    </div>
                                </div>

                                {/* Legal Checks */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        Paso 4: Consentimiento Final
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div 
                                            onClick={() => setAceptaTerminos(!aceptaTerminos)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex gap-3",
                                                aceptaTerminos 
                                                    ? "bg-emerald-50 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/50" 
                                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                            )}
                                        >
                                            <div className="pt-0.5">
                                                <Checkbox 
                                                    checked={aceptaTerminos}
                                                    onCheckedChange={(c) => setAceptaTerminos(c as boolean)}
                                                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-600"
                                                />
                                            </div>
                                            <Label className="text-sm font-bold leading-tight cursor-pointer">
                                                Acepto los términos del contrato
                                            </Label>
                                        </div>

                                        <div 
                                            onClick={() => setCertificaFirma(!certificaFirma)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex gap-3",
                                                certificaFirma 
                                                    ? "bg-emerald-50 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/50" 
                                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                            )}
                                        >
                                            <div className="pt-0.5">
                                                <Checkbox 
                                                    checked={certificaFirma}
                                                    onCheckedChange={(c) => setCertificaFirma(c as boolean)}
                                                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-600"
                                                />
                                            </div>
                                            <Label className="text-sm font-bold leading-tight cursor-pointer">
                                                Certifico mi identidad y firma
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-6">
                                    <Button 
                                        size="lg" 
                                        disabled={isSubmitting || isCanvasEmpty || !aceptaTerminos || !certificaFirma}
                                        className={cn(
                                            "w-full h-16 text-xl font-black rounded-2xl transition-all duration-500 shadow-2xl",
                                            (isCanvasEmpty || !aceptaTerminos || !certificaFirma) 
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 grayscale"
                                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 hover:scale-[1.02] border-b-4 border-emerald-800"
                                        )}
                                        onClick={handleFirmar}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-3">
                                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Finalizando Proceso Seguro...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-3">
                                                <ShieldCheck className="w-6 h-6" /> FIRMAR LEGALMENTE
                                            </span>
                                        )}
                                    </Button>
                                    <p className="text-center text-[10px] text-slate-400 mt-6 font-bold tracking-widest uppercase">
                                        Seguridad Cifrada TLS • IP {formatDate(new Date())} • FN AUTOS
                                    </p>
                                </div>
                            </div>

                            {!hasReadPdf && (
                                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-1000">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                                        <Eye className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Para continuar, lea el contrato</h3>
                                    <p className="text-slate-500 max-w-sm">
                                        Por motivos legales, debe abrir el documento PDF lateral para revisar las cláusulas antes de realizar su firma.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="mt-4 border-primary/20 text-primary font-black hover:bg-primary/5 rounded-xl h-12"
                                        asChild
                                        onClick={() => setHasReadPdf(true)}
                                    >
                                        <a href={pdfPublicLink} target="_blank" rel="noopener noreferrer">
                                            ABRIR PDF AHORA
                                        </a>
                                    </Button>
                                    <div className="lg:hidden mt-2 text-[10px] text-primary font-black flex items-center gap-1.5 animate-pulse">
                                        <AlertCircle className="w-3.5 h-3.5" /> El botón de arriba es el Paso 2
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes bounce-x {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(5px); }
                }
                .animate-bounce-x {
                    animation: bounce-x 1s infinite;
                }
                .sigCanvas {
                    background-color: transparent !important;
                }
            `}</style>
        </div>
    )
}
