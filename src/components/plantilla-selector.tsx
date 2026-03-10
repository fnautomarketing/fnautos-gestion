'use client'

import { useState, useEffect } from 'react'
import { FileText, Check } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { listarPlantillasEmpresaAction } from '@/app/actions/usuarios-empresas'

interface Plantilla {
    id: string
    nombre: string
    descripcion: string | null
    predeterminada: boolean | null
    activa: boolean | null
    logo_url: string | null
    color_primario: string | null
}

interface PlantillaSelectorProps {
    empresaId: string
    value?: string
    onChange: (plantillaId: string) => void
}

export function PlantillaSelector({ empresaId, value, onChange }: PlantillaSelectorProps) {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadPlantillas = async () => {
            setIsLoading(true)
            const result = await listarPlantillasEmpresaAction(empresaId)
            if (result.success && result.data) {
                setPlantillas(result.data)
                // Si hay una predeterminada y no hay valor seleccionado, seleccionarla
                if (!value) {
                    const predeterminada = result.data.find((p: Plantilla) => p.predeterminada)
                    if (predeterminada) {
                        onChange(predeterminada.id)
                    }
                }
            }
            setIsLoading(false)
        }
        loadPlantillas()
    }, [empresaId, value, onChange])

    if (isLoading) {
        return (
            <div className="h-10 bg-slate-100 animate-pulse rounded-md" />
        )
    }

    if (plantillas.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                <span>⚠️</span>
                <span>No hay plantillas configuradas para esta empresa</span>
            </div>
        )
    }

    return (
        <div className="min-w-0 w-full">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="bg-white w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
            <SelectContent>
                {plantillas.map((plantilla) => (
                    <SelectItem key={plantilla.id} value={plantilla.id}>
                        <div className="flex items-center gap-3 py-1 min-w-0">
                            <div
                                className="w-4 h-4 shrink-0 rounded-sm border"
                                style={{ backgroundColor: plantilla.color_primario ?? '#6366f1' }}
                            />
                            <div className="flex flex-col min-w-0 overflow-hidden">
                                <span className="font-medium truncate">
                                    {plantilla.nombre}
                                    {plantilla.predeterminada && (
                                        <span className="ml-2 text-xs text-primary">(predeterminada)</span>
                                    )}
                                </span>
                                {plantilla.descripcion && (
                                    <span className="text-xs text-slate-500 truncate">{plantilla.descripcion}</span>
                                )}
                            </div>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        </div>
    )
}
