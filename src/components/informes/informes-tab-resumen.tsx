'use client'

import { InformesKPIs } from './informes-kpis'

interface InformesTabResumenProps {
    fechaDesde?: string
    fechaHasta?: string
    empresaId?: string | null
    clienteId?: string | null
}

export function InformesTabResumen({ fechaDesde, fechaHasta, empresaId, clienteId }: InformesTabResumenProps) {
    return (
        <div className="space-y-6">
            <InformesKPIs fechaDesde={fechaDesde} fechaHasta={fechaHasta} empresaId={empresaId} clienteId={clienteId} />
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Para ver la evolución mensual de facturación y el estado de facturas, usa la pestaña <strong>Ventas</strong>.
            </p>
        </div>
    )
}
