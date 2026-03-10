'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, FileText, MoreVertical, Star, Trash2, ToggleLeft } from 'lucide-react'
import { toast } from 'sonner'
import { toggleActivaPlantillaAction, establecerPredeterminadaAction, eliminarPlantillaAction } from '@/app/actions/plantillas'
import { useRouter } from 'next/navigation'

interface PlantillasGridProps {
    plantillas: any[]
}

/**
 * Grid de plantillas PDF con diseño Premium.
 * Muestra cada plantilla como card con preview visual de factura.
 */
export function PlantillasGrid({ plantillas }: PlantillasGridProps) {
    const router = useRouter()

    const handleToggleActiva = async (plantillaId: string, activa: boolean) => {
        const result = await toggleActivaPlantillaAction(plantillaId, !activa)
        if (result.success) {
            toast.success(activa ? 'Plantilla desactivada' : 'Plantilla activada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const handleSetPredeterminada = async (plantillaId: string) => {
        const result = await establecerPredeterminadaAction(plantillaId)
        if (result.success) {
            toast.success('Plantilla establecida como predeterminada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const handleEliminar = async (plantillaId: string) => {
        if (!confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) return

        const result = await eliminarPlantillaAction(plantillaId)
        if (result.success) {
            toast.success('Plantilla eliminada')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantillas.map((plantilla) => (
                <div
                    key={plantilla.id}
                    className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300"
                >
                    {/* Overlay de efecto glassmorphism en hover */}
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Preview del PDF (mockup visual) */}
                    <div className="relative aspect-210/280 bg-white overflow-hidden">
                        {/* Badge de estado flotante */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                            {plantilla.predeterminada && (
                                <Badge className="bg-linear-to-r from-amber-500 to-orange-600 text-white border-none shadow-lg text-xs">
                                    ⭐ PREDETERMINADA
                                </Badge>
                            )}
                            <Badge className={`text-xs ${plantilla.activa
                                ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                }`}>
                                • {plantilla.activa ? 'ACTIVA' : 'INACTIVA'}
                            </Badge>
                        </div>

                        {/* Menu contextual */}
                        <div className="absolute top-3 right-3 z-10">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1a2332] border-white/10 text-slate-200">
                                    <DropdownMenuItem onClick={() => handleSetPredeterminada(plantilla.id)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        <Star className="h-4 w-4 mr-2 text-amber-500" />
                                        Establecer como predeterminada
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleActiva(plantilla.id, plantilla.activa)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        <ToggleLeft className="h-4 w-4 mr-2" />
                                        {plantilla.activa ? 'Desactivar' : 'Activar'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer" onClick={() => handleEliminar(plantilla.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Contenido del preview de factura */}
                        <div className="p-4 text-xs">
                            {/* Logo área */}
                            {plantilla.logo_url ? (
                                <div className={`mb-3 ${plantilla.logo_posicion === 'centro' ? 'text-center' :
                                    plantilla.logo_posicion === 'derecha' ? 'text-right' : 'text-left'
                                    }`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={plantilla.logo_url}
                                        alt="Logo"
                                        className="inline-block object-contain"
                                        style={{
                                            width: `${Math.min(plantilla.logo_ancho, 100)}px`,
                                            height: `${Math.min(plantilla.logo_alto, 40)}px`,
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className={`mb-3 ${plantilla.logo_posicion === 'centro' ? 'text-center' :
                                    plantilla.logo_posicion === 'derecha' ? 'text-right' : 'text-left'
                                    }`}>
                                    <div className="inline-flex items-center justify-center h-8 w-16 bg-slate-200 rounded text-slate-400 text-[8px]">
                                        LOGO
                                    </div>
                                </div>
                            )}

                            {/* Encabezado factura */}
                            <div className="flex justify-between items-start mb-2 text-[9px]">
                                <div>
                                    <p className="text-slate-400">Para:</p>
                                    <p className="font-semibold text-slate-700">Cliente Example SL</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800" style={{ color: plantilla.color_primario }}>FACTURA</p>
                                    <p className="text-slate-500">FAC-2024-001</p>
                                </div>
                            </div>

                            {/* Tabla de líneas */}
                            <div className="mt-3 border-t pt-2">
                                <table className="w-full text-[8px]">
                                    <thead>
                                        <tr style={{ backgroundColor: plantilla.color_encabezado_tabla }} className="text-white">
                                            <th className="p-1 text-left rounded-l">Concepto</th>
                                            <th className="p-1 text-right">Cant.</th>
                                            <th className="p-1 text-right rounded-r">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className={plantilla.alternar_color_filas ? 'bg-slate-50' : ''}>
                                            <td className="p-1 text-slate-600">Servicio Logístico</td>
                                            <td className="p-1 text-right text-slate-600">1</td>
                                            <td className="p-1 text-right text-slate-700 font-medium">850.00€</td>
                                        </tr>
                                        <tr>
                                            <td className="p-1 text-slate-600">Transporte Especial</td>
                                            <td className="p-1 text-right text-slate-600">2</td>
                                            <td className="p-1 text-right text-slate-700 font-medium">300.00€</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Total */}
                            <div className="mt-3 pt-2 border-t text-right">
                                <p className="text-[9px] text-slate-500">Subtotal: 1.150,00€</p>
                                <p className="text-[9px] text-slate-500">IVA (21%): 241,50€</p>
                                <p className="text-sm font-black mt-1" style={{ color: plantilla.color_primario }}>
                                    1.391,50€
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info de la plantilla */}
                    <div className="p-5 space-y-3">
                        <div>
                            <h3 className="text-lg font-bold text-white">{plantilla.nombre}</h3>
                            {plantilla.descripcion && (
                                <p className="text-sm text-slate-400 line-clamp-1">{plantilla.descripcion}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Usado en: <strong className="text-white">{plantilla.facturas_generadas}</strong> facturas
                            </span>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2 pt-2">
                            <Link href={`/ventas/configuracion/plantillas/${plantilla.id}/preview`} className="flex-1">
                                <Button variant="outline" className="w-full h-9 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-slate-200">
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    Vista Previa
                                </Button>
                            </Link>
                            <Link href={`/ventas/configuracion/plantillas/${plantilla.id}/editar`} className="flex-1">
                                <Button className="w-full h-9 text-xs bg-linear-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800">
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Editar
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Estado vacío */}
            {plantillas.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-2xl font-bold text-white mb-2">No hay plantillas configuradas</h3>
                    <p className="text-slate-400 mb-6">Crea tu primera plantilla para personalizar tus facturas PDF.</p>
                    <Link href="/ventas/configuracion/plantillas/nueva">
                        <Button className="bg-linear-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-300 font-bold px-8">
                            + Crear Plantilla
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
