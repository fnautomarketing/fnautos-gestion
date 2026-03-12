'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download, Mail, Edit, MoreVertical, Copy, XCircle, Trash2, CreditCard, Send } from 'lucide-react'
import { toast } from 'sonner'

import { emitirDesdeBorradorAction } from '@/app/actions/ventas'
import { formatFacturaDisplayNumero } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


import { Factura } from '@/types/ventas'

interface DetalleFacturaHeaderProps {
    factura: Factura & {
        cliente: {
            nombre_fiscal?: string | null
        } | null
    }
}

import { AnularFacturaModal } from './anular-factura-modal'
import { DuplicarFacturaModal } from './duplicar-factura-modal'
import { ModalCrearRectificativa } from '@/components/facturas/modal-crear-rectificativa'
import { SeedPdfExternaButton } from './seed-pdf-externa-button'
import { FileX, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DetalleFacturaHeader({ factura }: DetalleFacturaHeaderProps) {
    const router = useRouter()
    const [showAnularModal, setShowAnularModal] = useState(false)
    const [emitindo, setEmitiendo] = useState(false)
    const [showDuplicarModal, setShowDuplicarModal] = useState(false)
    const [showRectificativaModal, setShowRectificativaModal] = useState(false)

    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            pagada: {
                label: 'Pagada',
                className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            },
            parcial: {
                label: 'Parcial',
                className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
            },
            emitida: {
                label: 'Emitida',
                className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            },
            vencida: {
                label: 'Vencida',
                className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            },
            borrador: {
                label: 'Borrador',
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            },
            anulada: {
                label: 'Anulada',
                className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 decoration-slice line-through',
            },
        }

        const variant = variants[estado] || variants.borrador
        return <Badge className={variant.className}>{variant.label}</Badge>
    }

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-slate-900 dark:text-slate-100 break-all">
                        {formatFacturaDisplayNumero(factura.serie, factura.numero)}
                    </h1>
                    {getEstadoBadge(factura.estado)}
                    {factura.es_rectificativa && (
                        <Badge variant="destructive" className="ml-2">Rectificativa</Badge>
                    )}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                    Fecha emisión: {format(new Date(factura.fecha_emision), 'dd MMM, yyyy', { locale: es })}
                </p>
                {factura.estado === 'borrador' && factura.es_externa && factura.numero !== '000' && factura.serie && (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg inline-block">
                        Envía este número a la empresa externa: <strong className="font-mono">{formatFacturaDisplayNumero(factura.serie, factura.numero)}</strong>
                    </p>
                )}
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {factura.estado === 'borrador' && factura.es_externa && !factura.archivo_url && (
                    <SeedPdfExternaButton facturaId={factura.id} />
                )}
                {factura.estado === 'borrador' && (
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white min-h-[44px] sm:min-h-9"
                        onClick={async () => {
                            setEmitiendo(true)
                            const result = await emitirDesdeBorradorAction(factura.id)
                            setEmitiendo(false)
                            if (result.success) {
                                toast.success(`Factura emitida: ${result.data?.numero}`)
                                router.refresh()
                            } else {
                                toast.error(result.error)
                            }
                        }}
                        disabled={emitindo}
                    >
                        {emitindo ? 'Emitiendo...' : <><Send className="h-4 w-4 shrink-0 mr-2" /><span className="hidden sm:inline">Emitir Factura</span><span className="sm:hidden">Emitir</span></>}
                    </Button>
                )}
                {!factura.es_rectificativa && factura.estado !== 'anulada' && factura.estado !== 'borrador' && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10"
                            onClick={() => setShowRectificativaModal(true)}
                        >
                            <FileX className="h-4 w-4 mr-2" />
                            Crear Rectificativa
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    aria-label="¿Qué es una rectificativa?"
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-4" align="start">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">¿Qué es una factura rectificativa?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Anula o corrige esta factura emitida. Úsala para devoluciones, errores en datos o cambios que no puedes hacer editando. La rectificativa tendrá importe negativo.
                                </p>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                <Button
                    variant="outline"
                    onClick={() => router.push(`/ventas/facturas/${factura.id}/editar`)}
                    disabled={factura.estado === 'anulada' || !!factura.es_rectificativa}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                </Button>

                <Button
                    variant="outline"
                    onClick={() => router.push(`/ventas/facturas/${factura.id}/pdf`)}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                </Button>
                {factura.archivo_url && (
                    <Button
                        variant="outline"
                        onClick={() => window.open(factura.archivo_url!, '_blank')}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF original
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={() => router.push(`/ventas/facturas/${factura.id}/pago`)}
                    disabled={factura.estado === 'anulada' || factura.estado === 'pagada'}
                >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pago
                </Button>
                <Button
                    variant="outline"
                    onClick={() => router.push(`/ventas/facturas/${factura.id}/email`)}
                    disabled={factura.estado === 'borrador' || factura.estado === 'anulada'}
                >
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowDuplicarModal(true)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar Factura
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setShowAnularModal(true)}
                            disabled={factura.estado === 'anulada' || !!factura.es_rectificativa}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Anular Factura
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => toast.error('Eliminar - Requiere confirmación')}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AnularFacturaModal
                factura={factura}
                open={showAnularModal}
                onOpenChange={setShowAnularModal}
            />

            <DuplicarFacturaModal
                factura={factura}
                open={showDuplicarModal}
                onOpenChange={setShowDuplicarModal}
            />

            <ModalCrearRectificativa
                facturaId={factura.id}
                open={showRectificativaModal}
                onOpenChange={setShowRectificativaModal}
            />
        </div>
    )
}
