'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PenLine, Upload, Trash2, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { subirFirmaEmpresaAction, eliminarFirmaEmpresaAction } from '@/app/actions/firma-empresa'

// ╔══════════════════════════════════════════════════════════╗
// ║  Componente — Gestión de firma de empresa               ║
// ║  Subir, previsualizar y eliminar firma digital          ║
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
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const clearMessage = useCallback(() => {
        setTimeout(() => setMessage(null), 4000)
    }, [])

    const handleUpload = useCallback(async (file: File) => {
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
            setMessage({ type: 'success', text: 'Firma subida correctamente' })
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al subir la firma' })
        }

        setIsUploading(false)
        clearMessage()
    }, [empresaId, clearMessage])

    const handleDelete = useCallback(async () => {
        if (!confirm('¿Eliminar la firma de empresa? Esta acción no se puede deshacer.')) return

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

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
        // Reset input para permitir seleccionar el mismo archivo de nuevo
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [handleUpload])

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
        if (file) handleUpload(file)
    }, [handleUpload])

    return (
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
                <CardTitle className="text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    Firma de la Empresa
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Esta firma se insertará automáticamente en los contratos de compraventa como parte firmante de la empresa. 
                    Se recomienda una imagen con fondo transparente (PNG).
                </p>

                {/* Preview de firma actual */}
                {firmaUrl && (
                    <div className="relative group">
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={firmaUrl}
                                alt="Firma de empresa"
                                className="max-h-24 object-contain"
                            />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Firma configurada
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="rounded-lg text-xs"
                                >
                                    <Upload className="w-3.5 h-3.5 mr-1" />
                                    Cambiar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Zona de subida (drag & drop) */}
                {!firmaUrl && (
                    <div
                        className={`
                            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                            transition-all duration-200 ease-in-out
                            ${dragActive
                                ? 'border-primary bg-primary/5 scale-[1.02]'
                                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }
                            ${isUploading ? 'pointer-events-none opacity-60' : ''}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-sm text-slate-500 font-medium">Subiendo firma...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    Arrastra tu firma aquí o haz clic para seleccionar
                                </p>
                                <p className="text-xs text-slate-400">
                                    PNG, JPG o WEBP · Máx. 2MB · Fondo transparente recomendado
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Input oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Mensaje de resultado */}
                {message && (
                    <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                            message.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        {message.text}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
