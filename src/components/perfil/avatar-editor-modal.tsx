'use client'

import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RotateCcw, RotateCw, Loader2 } from 'lucide-react'
import { subirAvatarPerfilAction } from '@/app/actions/perfil'
import { toast } from 'sonner'

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
): Promise<Blob> {
    const image = await createImage(imageSrc)
    const rotRad = (rotation * Math.PI) / 180
    const sin = Math.abs(Math.sin(rotRad))
    const cos = Math.abs(Math.cos(rotRad))
    const bBoxW = image.naturalWidth * cos + image.naturalHeight * sin
    const bBoxH = image.naturalWidth * sin + image.naturalHeight * cos

    const canvas1 = document.createElement('canvas')
    canvas1.width = bBoxW
    canvas1.height = bBoxH
    const ctx1 = canvas1.getContext('2d')
    if (!ctx1) throw new Error('No canvas context')
    ctx1.translate(bBoxW / 2, bBoxH / 2)
    ctx1.rotate(rotRad)
    ctx1.translate(-image.naturalWidth / 2, -image.naturalHeight / 2)
    ctx1.drawImage(image, 0, 0)

    const canvas2 = document.createElement('canvas')
    canvas2.width = pixelCrop.width
    canvas2.height = pixelCrop.height
    const ctx2 = canvas2.getContext('2d')
    if (!ctx2) throw new Error('No canvas context')
    ctx2.drawImage(
        canvas1,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return new Promise((resolve, reject) => {
        canvas2.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob failed'))
        }, 'image/jpeg', 0.9)
    })
}

interface AvatarEditorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    imageSrc: string
    onSuccess?: () => void
}

export function AvatarEditorModal({
    open,
    onOpenChange,
    imageSrc,
    onSuccess,
}: AvatarEditorModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (imageSrc) {
            setCrop({ x: 0, y: 0 })
            setZoom(1)
            setRotation(0)
            setCroppedAreaPixels(null)
        }
    }, [imageSrc])

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels)
    }, [])

    const handleSave = async () => {
        if (!croppedAreaPixels) {
            toast.error('Selecciona el área de recorte')
            return
        }
        setSaving(true)
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
            const formData = new FormData()
            formData.append('file', file)

            const result = await subirAvatarPerfilAction(formData)
            if (result.success) {
                toast.success('Avatar actualizado correctamente')
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || 'Error al guardar')
            }
        } catch (e) {
            toast.error('Error al procesar la imagen')
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const rotateLeft = () => setRotation((r) => (r - 90) % 360)
    const rotateRight = () => setRotation((r) => (r + 90) % 360)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle>Personalizar avatar</DialogTitle>
                </DialogHeader>
                <div className="relative h-[320px] w-full bg-slate-100 dark:bg-slate-800">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        minZoom={0.5}
                        maxZoom={3}
                    />
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
                            Zoom
                        </span>
                        <Slider
                            data-testid="avatar-editor-zoom"
                            value={[zoom]}
                            onValueChange={([v]) => setZoom(v)}
                            min={0.5}
                            max={3}
                            step={0.1}
                            className="flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={rotateLeft}
                            className="flex-1"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Girar izq.
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={rotateRight}
                            className="flex-1"
                        >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Girar der.
                        </Button>
                    </div>
                </div>
                <DialogFooter className="p-4 pt-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button data-testid="avatar-editor-guardar" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Guardando…
                            </>
                        ) : (
                            'Guardar avatar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
