'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
    Mail,
    Building2,
    Shield,
    Settings,
    LayoutDashboard,
    Sparkles,
    Calendar,
    Camera,
    Trash2,
    Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { actualizarNombrePerfilAction, eliminarAvatarPerfilAction } from '@/app/actions/perfil'
import { AvatarEditorModal } from './avatar-editor-modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PerfilFormProps {
    displayName: string
    email: string
    avatarUrl: string | null
    createdAt: string | null
    empresas: Array<{
        nombre: string
        rol: string
        empresa_activa?: boolean
        logo_url?: string | null
    }>
    isAdmin: boolean
    rol: string
}

export function PerfilForm({
    displayName: initialName,
    email,
    avatarUrl,
    createdAt,
    empresas,
    isAdmin,
    rol,
}: PerfilFormProps) {
    const [name, setName] = useState(initialName)
    const [savingName, setSavingName] = useState(false)
    const [editorOpen, setEditorOpen] = useState(false)
    const [editorImageSrc, setEditorImageSrc] = useState('')
    const [deletingAvatar, setDeletingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const initials =
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase() || 'US'

    const handleSaveName = async () => {
        const trimmed = name.trim()
        if (!trimmed) {
            toast.error('El nombre no puede estar vacío')
            return
        }
        if (trimmed === initialName) return
        setSavingName(true)
        try {
            const result = await actualizarNombrePerfilAction(trimmed)
            if (result.success) {
                toast.success('Nombre actualizado')
            } else {
                toast.error(result.error || 'Error al guardar')
            }
        } finally {
            setSavingName(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Formato no permitido. Usa JPEG, PNG o WebP.')
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('El archivo no puede superar 2 MB.')
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            setEditorImageSrc(reader.result as string)
            setEditorOpen(true)
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleDeleteAvatar = async () => {
        if (!avatarUrl) return
        setDeletingAvatar(true)
        try {
            const result = await eliminarAvatarPerfilAction()
            if (result.success) {
                toast.success('Avatar eliminado')
            } else {
                toast.error(result.error || 'Error al eliminar')
            }
        } finally {
            setDeletingAvatar(false)
        }
    }

    return (
        <div className="space-y-6 max-w-3xl min-w-0" data-testid="perfil-form">
            {/* Card principal: Identidad */}
            <Card className="overflow-hidden border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/70/5 dark:from-primary/10 dark:to-primary/70/10 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative group" data-testid="perfil-avatar-container">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white dark:border-slate-800 shadow-xl shrink-0">
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-2xl sm:text-3xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                aria-label="Subir foto de perfil"
                                data-testid="perfil-avatar-file-input"
                                onChange={handleFileChange}
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    aria-label="Cambiar foto"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                {avatarUrl && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8"
                                        data-testid="perfil-avatar-eliminar"
                                        onClick={handleDeleteAvatar}
                                        disabled={deletingAvatar}
                                        aria-label="Eliminar foto"
                                    >
                                        {deletingAvatar ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Input
                                        data-testid="perfil-nombre-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onBlur={handleSaveName}
                                        className="text-xl sm:text-2xl font-bold h-auto py-2 max-w-[280px]"
                                        placeholder="Tu nombre"
                                    />
                                    {savingName && (
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                    )}
                                </div>
                                <Badge
                                    variant={isAdmin ? 'default' : 'secondary'}
                                    className={
                                        isAdmin
                                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-0 shrink-0'
                                            : 'shrink-0'
                                    }
                                >
                                    {isAdmin ? (
                                        <>
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            Administrador
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-3 w-3 mr-1" />
                                            {rol === 'admin' ? 'Admin' : 'Operador'}
                                        </>
                                    )}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="text-sm truncate">{email || '—'}</span>
                            </div>
                            {createdAt && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Cuenta desde{' '}
                                    {format(new Date(createdAt), "d 'de' MMMM yyyy", {
                                        locale: es,
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Empresas vinculadas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Empresas vinculadas
                    </CardTitle>
                    <CardDescription>
                        {empresas.length > 0
                            ? 'Empresas a las que tienes acceso en el sistema'
                            : 'No hay empresas vinculadas a tu cuenta'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {empresas.length > 0 ? (
                        <ul className="space-y-2">
                            {empresas.slice(0, 10).map((emp, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                                >
                                    {emp.logo_url ? (
                                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white shrink-0">
                                            <Image
                                                src={emp.logo_url}
                                                alt=""
                                                fill
                                                className="object-contain"
                                                sizes="40px"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                            {emp.nombre}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {emp.rol === 'admin' ? 'Administrador' : 'Operador'}
                                        </p>
                                    </div>
                                    {emp.empresa_activa && (
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            Activa
                                        </Badge>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                            Contacta con el administrador para vincular tu cuenta a una empresa.
                        </p>
                    )}
                    {empresas.length > 10 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            +{empresas.length - 10} empresas más
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Accesos rápidos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Accesos rápidos
                    </CardTitle>
                    <CardDescription>Enlaces a las secciones más utilizadas</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full justify-start gap-3 h-12">
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/ventas/configuracion/empresa">
                        <Button variant="outline" className="w-full justify-start gap-3 h-12">
                            <Building2 className="h-4 w-4" />
                            Configuración empresa
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <AvatarEditorModal
                open={editorOpen}
                onOpenChange={(open) => {
                    setEditorOpen(open)
                    if (!open) setEditorImageSrc('')
                }}
                imageSrc={editorImageSrc}
                onSuccess={() => window.location.reload()}
            />
        </div>
    )
}
