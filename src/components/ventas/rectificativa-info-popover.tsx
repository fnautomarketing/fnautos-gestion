'use client'

import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface RectificativaInfoPopoverProps {
    variant?: 'banner' | 'section'
    className?: string
}

export function RectificativaInfoPopover({ variant = 'section', className }: RectificativaInfoPopoverProps) {
    const isBanner = variant === 'banner'

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={`inline-flex items-center justify-center rounded-full transition-colors ${isBanner ? 'h-5 w-5 bg-red-100 dark:bg-red-900/40 text-red-600 hover:bg-red-200 dark:hover:bg-red-800' : 'h-5 w-5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-800'} ${className || ''}`}
                    aria-label="¿Qué son las facturas rectificativas?"
                >
                    <Info className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Facturas rectificativas</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Son documentos que anulan o corrigen facturas ya emitidas. Tienen importe negativo y se vinculan a la factura original.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Tipos:</strong> Devolución total (anula todo), parcial (solo algunas líneas) o error en datos (corrige CIF, nombre, etc.).
                </p>
            </PopoverContent>
        </Popover>
    )
}
