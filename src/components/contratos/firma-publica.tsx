'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    FileText, ShieldCheck, PenTool, Eraser, Check, Eye,
    AlertCircle, Info, ArrowRight, Download, Lock, Scale,
    X, Loader2, ChevronDown
} from 'lucide-react'
import type { Contrato } from '@/types/contratos'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

// ╔══════════════════════════════════════════════════════════╗
// ║  Firma Pública — Experiencia Premium de Firma Legal     ║
// ║  Cumplimiento: eIDAS (UE) 910/2014, LSSI-CE, RGPD,     ║
// ║  Código Civil Español (Arts. 1254-1258)                  ║
// ╚══════════════════════════════════════════════════════════╝

interface FirmaPublicaProps {
    contrato: Contrato
    token: string
}

// Icono personalizado para evitar importaciones pesadas
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    )
}

export function FirmaPublica({ contrato, token }: FirmaPublicaProps) {
    const router = useRouter()

    // ── Estado del flujo ────────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasReadPdf, setHasReadPdf] = useState(false)
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true)

    // ── Checkboxes legales ──────────────────────────────
    const [aceptaTerminos, setAceptaTerminos] = useState(false)
    const [certificaFirma, setCertificaFirma] = useState(false)
    const [aceptaProteccionDatos, setAceptaProteccionDatos] = useState(false)

    // ── Visor PDF ──────────────────────────────────────
    const [isViewingPdf, setIsViewingPdf] = useState(false)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [pdfError, setPdfError] = useState<string | null>(null)

    // ── Canvas de firma ────────────────────────────────
    const sigCanvas = useRef<SignatureCanvas | null>(null)
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 })

    // ── Responsive canvas ──────────────────────────────
    useEffect(() => {
        function handleResize() {
            if (canvasContainerRef.current) {
                const maxW = Math.min(canvasContainerRef.current.clientWidth - 4, 600)
                setCanvasSize({ width: maxW, height: Math.min(200, maxW * 0.42) })
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // ── Limpiar blob URL al desmontar ──────────────────
    useEffect(() => {
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
        }
    }, [pdfBlobUrl])

    // ── Cargar PDF vía fetch (evita problemas de X-Frame-Options) ──
    const loadPdf = useCallback(async () => {
        setPdfLoading(true)
        setPdfError(null)
        try {
            const res = await fetch(`/api/contratos/public/pdf?id=${contrato.id}&token=${token}`)
            if (!res.ok) {
                throw new Error(`Error ${res.status}: No se pudo cargar el documento`)
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setPdfBlobUrl(url)
            setHasReadPdf(true)
            setIsViewingPdf(true)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido al cargar el PDF'
            setPdfError(msg)
            toast.error('No se pudo cargar el documento', { description: msg })
        } finally {
            setPdfLoading(false)
        }
    }, [contrato.id, token])

    const openPdfViewer = () => {
        if (pdfBlobUrl) {
            setIsViewingPdf(true)
            return
        }
        loadPdf()
    }

    const closePdfViewer = () => {
        setIsViewingPdf(false)
    }

    const clearSignature = () => {
        sigCanvas.current?.clear()
        setIsCanvasEmpty(true)
    }

    const handleSignEnd = () => {
        setIsCanvasEmpty(sigCanvas.current?.isEmpty() ?? true)
    }

    // ── Validaciones legales completas ──────────────────
    const allLegalChecked = aceptaTerminos && certificaFirma && aceptaProteccionDatos
    const canSubmit = hasReadPdf && !isCanvasEmpty && allLegalChecked && !isSubmitting

    const handleFirmar = async () => {
        if (!hasReadPdf) {
            toast.error('Debe leer el documento completo antes de firmar', {
                description: 'Requisito legal según el Reglamento eIDAS (UE) 910/2014'
            })
            return
        }
        if (!allLegalChecked) {
            toast.error('Debe aceptar todos los consentimientos legales para continuar')
            return
        }
        if (sigCanvas.current?.isEmpty() || isCanvasEmpty) {
            toast.error('Debe realizar su firma manuscrita en el recuadro')
            return
        }

        setIsSubmitting(true)

        try {
            let firmaData: string
            try {
                firmaData = sigCanvas.current!.getTrimmedCanvas().toDataURL('image/png')
            } catch {
                firmaData = sigCanvas.current!.getCanvas().toDataURL('image/png')
            }

            const res = await fetch('/api/contratos/firmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    firma_data: firmaData,
                    aceptar_terminos: aceptaTerminos,
                })
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Error al procesar la firma')
            }

            toast.success('¡Contrato firmado con éxito!', {
                description: 'Recibirá una copia firmada en su correo electrónico.',
                duration: 8000,
            })

            router.refresh()

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido'
            toast.error('Error al firmar el contrato', { description: message })
            setIsSubmitting(false)
        }
    }

    // ── Datos derivados ────────────────────────────────
    const nombreAgente = contrato.tipo_operacion === 'venta' ? contrato.comprador_nombre : contrato.vendedor_nombre
    const rolAgente = contrato.tipo_operacion === 'venta' ? 'Comprador' : 'Vendedor'

    // ── Stepper ────────────────────────────────────────
    const steps = [
        { name: 'Identidad', icon: UsersIcon, completed: true },
        { name: 'Lectura', icon: Eye, completed: hasReadPdf },
        { name: 'Firma', icon: PenTool, completed: !isCanvasEmpty },
        { name: 'Legal', icon: ShieldCheck, completed: allLegalChecked },
    ]

    // ── Determinar paso activo ─────────────────────────
    const currentStep = !hasReadPdf ? 1 : isCanvasEmpty ? 2 : !allLegalChecked ? 3 : 4

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 md:py-12 animate-in fade-in duration-700">

            {/* ═══ STEPPER PREMIUM ═══ */}
            <div className="mb-10">
                <div className="flex items-center justify-between max-w-xl mx-auto relative px-2 sm:px-0">
                    {/* Línea de progreso */}
                    <div className="absolute top-5 sm:top-6 left-[12%] right-[12%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                    <div
                        className="absolute top-5 sm:top-6 left-[12%] h-0.5 bg-emerald-500 z-0 transition-all duration-700"
                        style={{ width: `${Math.max(0, (currentStep - 1) / 3) * 76}%` }}
                    />
                    {steps.map((step, idx) => {
                        const Icon = step.icon
                        const isActive = idx === currentStep
                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5">
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                    step.completed
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                                        : isActive
                                            ? "bg-white dark:bg-slate-900 border-primary text-primary shadow-md animate-pulse"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                                )}>
                                    {step.completed ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                </div>
                                <span className={cn(
                                    "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider",
                                    step.completed ? "text-emerald-600" : isActive ? "text-primary" : "text-slate-400"
                                )}>
                                    {step.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ═══ HEADER ═══ */}
            <div className="text-center mb-10 space-y-3">
                <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 rounded-full font-bold tracking-widest uppercase text-[9px]">
                    <Lock className="w-3 h-3 mr-1.5" /> Firma Electrónica Segura
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
                    Contrato de Compraventa
                </h1>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">
                    Documento enviado por <strong>FN Autos</strong> para su revisión y firma electrónica vinculante
                    conforme al Reglamento (UE) nº 910/2014 (eIDAS).
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ═══ LATERAL: Información + Lectura ═══ */}
                <div className="lg:col-span-4 space-y-5">
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" /> Detalles del Contrato
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {contrato.numero_contrato}
                            </span>
                        </div>
                        <CardContent className="p-5 space-y-5">
                            {/* Datos del firmante */}
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{rolAgente}</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{nombreAgente}</p>
                                <p className="text-xs font-mono text-slate-500">
                                    {contrato.tipo_operacion === 'venta' ? contrato.comprador_nif : contrato.vendedor_nif}
                                </p>
                            </div>

                            {/* Vehículo */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Vehículo</p>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                    {contrato.vehiculo_marca} {contrato.vehiculo_modelo}
                                </p>
                                <Badge variant="secondary" className="mt-1.5 font-mono text-[10px]">
                                    {contrato.vehiculo_matricula}
                                </Badge>
                            </div>

                            {/* Importe */}
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest mb-1">Importe Total</p>
                                <p className="text-2xl font-black text-primary">
                                    {formatCurrency(contrato.total_con_iva || contrato.precio_venta)}
                                </p>
                            </div>

                            {/* Botón de lectura */}
                            <div className="pt-1">
                                <Button
                                    className={cn(
                                        "w-full h-12 font-bold rounded-xl transition-all duration-500 shadow-md",
                                        hasReadPdf
                                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                            : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:shadow-primary/30"
                                    )}
                                    onClick={openPdfViewer}
                                    disabled={pdfLoading}
                                >
                                    {pdfLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando documento...
                                        </span>
                                    ) : hasReadPdf ? (
                                        <span className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600" /> Documento revisado
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" /> Leer contrato completo
                                        </span>
                                    )}
                                </Button>

                                {!hasReadPdf && (
                                    <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-primary font-bold uppercase leading-none justify-center">
                                        <ArrowRight className="w-3 h-3 animate-bounce-x" />
                                        Obligatorio antes de firmar
                                    </div>
                                )}

                                {pdfError && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        {pdfError}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aviso legal lateral */}
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                        <div className="flex items-start gap-2">
                            <Scale className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                Este proceso cumple con el <strong>Reglamento (UE) 910/2014 (eIDAS)</strong> para
                                firma electrónica simple. Su firma tiene validez jurídica conforme al
                                artículo 3.10 del citado Reglamento y los artículos 1254-1258 del Código Civil español.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ PRINCIPAL: Firma + Legal ═══ */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                        <CardContent className="p-5 sm:p-8">

                            {/* ── Bloque deshabilitado si no ha leído ── */}
                            <div className={cn(
                                "space-y-7 transition-all duration-700",
                                !hasReadPdf ? "opacity-15 blur-[3px] pointer-events-none select-none" : "opacity-100 blur-0"
                            )}>

                                {/* ═══ PASO 3: FIRMA ═══ */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold flex items-center gap-2.5">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <PenTool className="w-4 h-4 text-primary" />
                                        </div>
                                        Paso 3 — Firma manuscrita
                                    </h3>
                                    <p className="text-xs text-slate-500 -mt-1">
                                        Dibuje su firma con el ratón o dedo. Se integrará en el PDF del contrato.
                                    </p>

                                    <div
                                        ref={canvasContainerRef}
                                        className={cn(
                                            "relative w-full rounded-xl border-2 transition-all duration-300 bg-white dark:bg-slate-950 overflow-hidden",
                                            isCanvasEmpty
                                                ? "border-dashed border-slate-200 dark:border-slate-700"
                                                : "border-solid border-emerald-400/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.04)]"
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
                                            penColor="#1e293b"
                                            backgroundColor="transparent"
                                            minWidth={1.5}
                                            maxWidth={3}
                                        />

                                        {isCanvasEmpty && (
                                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                                <PenTool className="w-8 h-8 mb-1.5 opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest opacity-30">
                                                    Firme aquí
                                                </p>
                                            </div>
                                        )}

                                        {!isCanvasEmpty && (
                                            <button
                                                type="button"
                                                onClick={clearSignature}
                                                className="absolute top-3 right-3 p-2 bg-white/90 shadow-md dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg transition-all active:scale-90 backdrop-blur-sm"
                                                title="Borrar firma"
                                            >
                                                <Eraser className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-400 tracking-wider px-1">
                                        <span className="flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Firma electrónica simple (SES)
                                        </span>
                                        <span>{formatDate(new Date())}</span>
                                    </div>
                                </div>

                                {/* ═══ PASO 4: CONSENTIMIENTOS LEGALES ═══ */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-lg font-bold flex items-center gap-2.5">
                                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        Paso 4 — Consentimientos legales
                                    </h3>
                                    <p className="text-xs text-slate-500 -mt-1">
                                        Active las tres casillas para verificar su consentimiento informado.
                                    </p>

                                    <div className="space-y-3">
                                        {/* Check 1: Aceptar términos */}
                                        <div
                                            onClick={() => setAceptaTerminos(!aceptaTerminos)}
                                            className={cn(
                                                "p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex gap-3 group",
                                                aceptaTerminos
                                                    ? "bg-emerald-50 border-emerald-400/30 dark:bg-emerald-950/20 dark:border-emerald-500/40"
                                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                            )}
                                        >
                                            <div className="pt-0.5 flex-shrink-0">
                                                <Checkbox
                                                    checked={aceptaTerminos}
                                                    onCheckedChange={(c) => setAceptaTerminos(c as boolean)}
                                                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold leading-tight cursor-pointer block">
                                                    Acepto íntegramente los términos y cláusulas del contrato
                                                </Label>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                                    Declaro haber leído y comprendido todas las cláusulas del contrato de compraventa,
                                                    incluyendo las condiciones económicas, garantías y obligaciones de las partes
                                                    (Art. 1258 C.C., Art. 97 TRLGDCU).
                                                </p>
                                            </div>
                                        </div>

                                        {/* Check 2: Certificar firma */}
                                        <div
                                            onClick={() => setCertificaFirma(!certificaFirma)}
                                            className={cn(
                                                "p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex gap-3 group",
                                                certificaFirma
                                                    ? "bg-emerald-50 border-emerald-400/30 dark:bg-emerald-950/20 dark:border-emerald-500/40"
                                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                            )}
                                        >
                                            <div className="pt-0.5 flex-shrink-0">
                                                <Checkbox
                                                    checked={certificaFirma}
                                                    onCheckedChange={(c) => setCertificaFirma(c as boolean)}
                                                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold leading-tight cursor-pointer block">
                                                    Certifico mi identidad y la autenticidad de mi firma
                                                </Label>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                                    Confirmo que soy la persona identificada en este contrato ({nombreAgente})
                                                    y que la firma electrónica que realizo es voluntaria, vinculante y tiene
                                                    plenos efectos jurídicos (Art. 25 Reglamento eIDAS 910/2014).
                                                </p>
                                            </div>
                                        </div>

                                        {/* Check 3: Protección de datos */}
                                        <div
                                            onClick={() => setAceptaProteccionDatos(!aceptaProteccionDatos)}
                                            className={cn(
                                                "p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex gap-3 group",
                                                aceptaProteccionDatos
                                                    ? "bg-emerald-50 border-emerald-400/30 dark:bg-emerald-950/20 dark:border-emerald-500/40"
                                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                            )}
                                        >
                                            <div className="pt-0.5 flex-shrink-0">
                                                <Checkbox
                                                    checked={aceptaProteccionDatos}
                                                    onCheckedChange={(c) => setAceptaProteccionDatos(c as boolean)}
                                                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold leading-tight cursor-pointer block">
                                                    Autorizo el tratamiento de mis datos personales
                                                </Label>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                                    Conforme al RGPD (UE) 2016/679 y la LOPDGDD 3/2018, acepto que mis datos
                                                    (nombre, NIF, IP, firma) se traten exclusivamente para la gestión de este contrato.
                                                    Puedo ejercer mis derechos ARCO-POL dirigiéndome a la empresa emisora.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ BOTÓN DE FIRMA FINAL ═══ */}
                                <div className="pt-4">
                                    <Button
                                        size="lg"
                                        disabled={!canSubmit}
                                        className={cn(
                                            "w-full h-14 text-lg font-black rounded-xl transition-all duration-500 shadow-xl",
                                            !canSubmit
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]"
                                        )}
                                        onClick={handleFirmar}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2.5">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Procesando firma segura...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2.5">
                                                <ShieldCheck className="w-5 h-5" />
                                                FIRMAR CONTRATO
                                            </span>
                                        )}
                                    </Button>

                                    {!canSubmit && hasReadPdf && (
                                        <p className="text-center text-[10px] text-amber-600 dark:text-amber-400 mt-3 font-bold">
                                            {isCanvasEmpty
                                                ? '⬆ Realice su firma manuscrita arriba'
                                                : !allLegalChecked
                                                    ? '⬆ Active todas las casillas de consentimiento'
                                                    : ''
                                            }
                                        </p>
                                    )}

                                    <div className="text-center mt-5 space-y-1">
                                        <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                                            Conexión cifrada TLS 1.3 • {formatDate(new Date())} • FN Autos
                                        </p>
                                        <p className="text-[8px] text-slate-300 dark:text-slate-600">
                                            Se registrará su dirección IP y agente de usuario como evidencia electrónica
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Mensaje de bloqueo si no ha leído ── */}
                            {!hasReadPdf && (
                                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-700">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Lectura obligatoria del contrato
                                    </h3>
                                    <p className="text-sm text-slate-500 max-w-sm">
                                        La legislación española requiere que el firmante lea íntegramente el documento
                                        antes de estampar su firma. Pulse el botón para abrir el contrato.
                                    </p>
                                    <Button
                                        className="mt-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-8 shadow-lg"
                                        onClick={openPdfViewer}
                                        disabled={pdfLoading}
                                    >
                                        {pdfLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Abrir contrato PDF
                                            </span>
                                        )}
                                    </Button>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
                                        <Lock className="w-3 h-3" /> El área de firma se desbloqueará tras la lectura
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══ VISOR DE PDF (Modal Fullscreen) ═══ */}
            {isViewingPdf && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 flex flex-col">
                    {/* Header del visor */}
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {contrato.numero_contrato} — Revisión de Contrato
                                </h3>
                                <p className="text-[10px] text-slate-400">
                                    Lea atentamente todas las cláusulas antes de firmar
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {pdfBlobUrl && (
                                <a
                                    href={pdfBlobUrl}
                                    download={`Contrato-${contrato.numero_contrato}.pdf`}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Descargar PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            )}
                            <button
                                onClick={closePdfViewer}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Visor PDF */}
                    <div className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-auto">
                        {pdfBlobUrl ? (
                            <iframe
                                src={pdfBlobUrl}
                                className="w-full h-full"
                                title="Visor de Contrato"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Footer del visor */}
                    <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 hidden sm:block">
                            <Lock className="w-3 h-3 inline mr-1" />
                            Documento visualizado con acceso seguro por token
                        </p>
                        <Button
                            onClick={closePdfViewer}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-md ml-auto"
                        >
                            <Check className="w-4 h-4 mr-1.5" /> He leído el documento — Proceder a firmar
                        </Button>
                    </div>
                </div>
            )}

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
