'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PenLine, Upload, Trash2, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, PenTool, Eraser } from 'lucide-react'
import { subirFirmaEmpresaAction, eliminarFirmaEmpresaAction } from '@/app/actions/firma-empresa'
import SignatureCanvas from 'react-signature-canvas'
import { cn } from '@/lib/utils'

// ╔══════════════════════════════════════════════════════════╗
// ║  Componente — Gestión de firma de empresa               ║
// ║  Subir imagen, dibujar manual y eliminar firma          ║
// ╚══════════════════════════════════════════════════════════╝

interface FirmaEmpresaManagerProps {
    empresaId: string
    firmaUrlActual?: string | null
}

export function FirmaEmpresaManager({ empresaId, firmaUrlActual }: FirmaEmpresaManagerProps) {
    const [firmaUrl, setFirmaUrl] = useState<string | null>(firmaUrlActual || null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    
    // Modo de ingreso: 'upload' (Subir Imagen) o 'draw' (Dibujar Manualmente)
    const [mode, setMode] = useState<'upload' | 'draw'>('upload')
    
    // Upload State
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Canvas State
    const sigCanvas = useRef<SignatureCanvas>(null)
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true)
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 })
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    // --- UTILS ---
    const clearMessage = useCallback(() => {
        setTimeout(() => setMessage(null), 4000)
    }, [])

    // Resizing del canvas dinámico
    useEffect(() => {
        const handleResize = () => {
            if (canvasContainerRef.current) {
                setCanvasSize({
                    width: canvasContainerRef.current.offsetWidth,
                    height: 200
                })
            }
        }
        
        // Ejecutar al montar y cuando cambie a la pestaña de dibujo
        if (mode === 'draw' && !firmaUrl) {
            handleResize()
            // Timer sutil para asegurarse de que el DOM ya renderizó el contenedor final
            setTimeout(handleResize, 50) 
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [mode, firmaUrl])

    // --- CORE HANDLERS ---
    const processFirmaUpload = useCallback(async (file: File) => {
        setIsUploading(true)
        setMessage(null)

        // Validación lado cliente
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Formato no válido. Use PNG, JPG o WEBP.' })
            setIsUploading(false)
            clearMessage()
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB.' })
            setIsUploading(false)
            clearMessage()
            return
        }

        const formData = new FormData()
        formData.append('firma', file)

        const result = await subirFirmaEmpresaAction(empresaId, formData)

        if (result.success && result.data) {
            setFirmaUrl(result.data.url)
            setMessage({ type: 'success', text: 'Firma guardada correctamente' })
            // Si estábamos dibujando, reseteamos el canvas por si se elimina y se dibuja otra
            if (mode === 'draw' && sigCanvas.current) {
                sigCanvas.current.clear()
                setIsCanvasEmpty(true)
            }
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al guardar la firma' })
        }

        setIsUploading(false)
        clearMessage()
    }, [empresaId, clearMessage, mode])

    const handleDelete = useCallback(async () => {
        if (!confirm('¿Eliminar la firma de la empresa? Los próximos contratos PDF saldrán sin firma. Esta acción no se puede deshacer.')) return

        setIsDeleting(true)
        setMessage(null)

        const result = await eliminarFirmaEmpresaAction(empresaId)

        if (result.success) {
            setFirmaUrl(null)
            setMessage({ type: 'success', text: 'Firma eliminada correctamente' })
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al eliminar la firma' })
        }

        setIsDeleting(false)
        clearMessage()
    }, [empresaId, clearMessage])

    // --- UPLOAD HANDLERS ---
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFirmaUpload(file)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [processFirmaUpload])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const file = e.dataTransfer.files?.[0]
        if (file) processFirmaUpload(file)
    }, [processFirmaUpload])

    // --- DRAW HANDLERS ---
    const handleSignEnd = () => {
        if (!sigCanvas.current) return
        setIsCanvasEmpty(sigCanvas.current.isEmpty())
    }

    const clearCanvas = () => {
        if (!sigCanvas.current) return
        sigCanvas.current.clear()
        setIsCanvasEmpty(true)
    }

    const saveDrawing = () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            setMessage({ type: 'error', text: 'Dibuja tu firma antes de guardar.' })
            clearMessage()
            return
        }

        // Extraer PNG recortado (elimina espacios vacíos alrededor)
        const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
        
        // Convertir DataURL a Blob
        const byteString = atob(dataUrl.split(',')[1])
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
        }
        const blob = new Blob([ab], { type: mimeString })
        
        // Crear archivo a partir del Blob
        const f = new File([blob], `firma_empresa_${Date.now()}.png`, { type: 'image/png' })
        
        processFirmaUpload(f)
    }

    return (
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <PenLine className="w-4 h-4" />
                        Firma de la Empresa
                    </CardTitle>

                    {/* TABS (Subir / Dibujar) - Solo visibles si NO hay firma cargada */}
                    {!firmaUrl && (
                        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setMode('upload')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                                    mode === 'upload' 
                                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <Upload className="w-3.5 h-3.5" /> Subir Imagen
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('draw')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                                    mode === 'draw' 
                                        ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <PenTool className="w-3.5 h-3.5" /> Dibujar Manual
                            </button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
                {!firmaUrl && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {mode === 'upload' 
                            ? "Sube una imagen (PNG transparente recomendado) que se incrustará directamente como firma corporativa en los PDFs generados."
                            : "Dibuja a mano la firma corporativa. El sistema recortará los bordes y la transformará óptimamente para los documentos PDF."
                        }
                    </p>
                )}

                {/* --- MODO: YA HAY FIRMA CARGADA --- */}
                {firmaUrl && (
                    <div className="relative group animate-in fade-in duration-500">
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center min-h-[140px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={firmaUrl}
                                alt="Firma de empresa activa"
                                className="max-h-28 object-contain drop-shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                <CheckCircle2 className="w-4 h-4" />
                                Firma activa y operando en contratos
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="rounded-lg text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Eliminar y Cambiar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODO: SUBIR IMAGEN --- */}
                {!firmaUrl && mode === 'upload' && (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2",
                            dragActive
                                ? "border-primary bg-primary/5 scale-[1.02]"
                                : "border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-inner",
                            isUploading && "pointer-events-none opacity-60"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                                </div>
                                <p className="text-sm text-slate-600 font-bold">Procesando y almacenando firma segura...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <h4 className="text-base text-slate-800 dark:text-slate-200 font-bold">
                                    Arrastra tu firma aquí o haz clic
                                </h4>
                                <p className="text-xs text-slate-400 max-w-[250px] mx-auto">
                                    Requerimos PNG, JPG o WEBP con un tamaño máximo de 2MB.
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                )}

                {/* --- MODO: DIBUJAR --- */}
                {!firmaUrl && mode === 'draw' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div
                            ref={canvasContainerRef}
                            className={cn(
                                "relative w-full rounded-xl border-2 transition-all duration-500 bg-white dark:bg-slate-950/50 overflow-hidden",
                                isCanvasEmpty
                                    ? "border-dashed border-slate-300 dark:border-slate-700"
                                    : "border-solid border-emerald-400 border-opacity-60 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)]",
                                isUploading && "opacity-60 pointer-events-none blur-[1px]"
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
                                penColor="#1e293b" // Color slate-900 oscuro profesional
                                backgroundColor="transparent"
                                minWidth={1.5}
                                maxWidth={3.5}
                            />

                            {/* Marca de agua / placeholder si está vacío */}
                            {isCanvasEmpty && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                    <PenTool className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">
                                        Firme sobre este recuadro
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Botones de acción del Canvas */}
                        <div className="flex items-center justify-between pt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearCanvas}
                                disabled={isCanvasEmpty || isUploading}
                                className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Eraser className="w-3.5 h-3.5 mr-1.5" />
                                Limpiar lienzo
                            </Button>
                            
                            <Button
                                type="button"
                                size="sm"
                                onClick={saveDrawing}
                                disabled={isCanvasEmpty || isUploading}
                                className={cn(
                                    "rounded-lg text-xs font-bold transition-all w-32",
                                    isCanvasEmpty ? "opacity-50" : "shadow-md shadow-primary/20",
                                    isUploading && "pointer-events-none"
                                )}
                            >
                                {isUploading ? (
                                    <span className="flex items-center">
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Guardando
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                        Guardar Firma
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- ALERTAS / MENSAJES --- */}
                {message && (
                    <div
                        className={cn(
                            "flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 border",
                            message.type === 'success'
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                                : "bg-red-50 text-red-800 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                        )}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                        )}
                        {message.text}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
