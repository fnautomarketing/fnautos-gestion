import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface VencidaNivelStats {
    importe: number
    num_facturas: number
    num_clientes: number
}

interface VencidasStatsData {
    critico: VencidaNivelStats
    urgente: VencidaNivelStats
    atencion: VencidaNivelStats
    total: {
        total_impagado: number
        total_facturas: number
        tasa_morosidad: number
        recordatorios_enviados: number
    }
}

interface VencidasStatsProps {
    stats: VencidasStatsData
}

export function VencidasStats({ stats }: VencidasStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crítico */}
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">🔴</span>
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                        CRÍTICO (+60 días)
                    </h3>
                </div>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {stats?.critico?.importe?.toFixed(2) || '0.00'}€
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {stats?.critico?.num_facturas || 0} facturas · {stats?.critico?.num_clientes || 0} clientes
                </p>
                <Link href="/ventas/facturas-vencidas?nivel=critico">
                    <Button variant="link" className="text-red-600 p-0 mt-2">
                        Ver Detalles →
                    </Button>
                </Link>
            </div>

            {/* Urgente */}
            <div className="rounded-2xl bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">🟠</span>
                    <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                        URGENTE (30-60 días)
                    </h3>
                </div>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {stats?.urgente?.importe?.toFixed(2) || '0.00'}€
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    {stats?.urgente?.num_facturas || 0} facturas · {stats?.urgente?.num_clientes || 0} clientes
                </p>
                <Link href="/ventas/facturas-vencidas?nivel=urgente">
                    <Button variant="link" className="text-orange-600 p-0 mt-2">
                        Ver Detalles →
                    </Button>
                </Link>
            </div>

            {/* Atención */}
            <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">🟡</span>
                    <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                        ATENCIÓN (0-30 días)
                    </h3>
                </div>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                    {stats?.atencion?.importe?.toFixed(2) || '0.00'}€
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    {stats?.atencion?.num_facturas || 0} facturas · {stats?.atencion?.num_clientes || 0} clientes
                </p>
                <Link href="/ventas/facturas-vencidas?nivel=atencion">
                    <Button variant="link" className="text-yellow-600 p-0 mt-2">
                        Ver Detalles →
                    </Button>
                </Link>
            </div>

            {/* Resumen */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">📊</span>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wide">
                        RESUMEN GENERAL
                    </h3>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Total Impagado:</span>
                        <span className="font-bold">{stats?.total?.total_impagado?.toFixed(2) || '0.00'}€</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Facturas vencidas:</span>
                        <span className="font-bold">{stats?.total?.total_facturas || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Tasa morosidad:</span>
                        <span className="font-bold text-red-600">{stats?.total?.tasa_morosidad || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Recordatorios:</span>
                        <span className="font-bold">{stats?.total?.recordatorios_enviados || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
