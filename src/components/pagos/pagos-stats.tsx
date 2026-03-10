interface PagosStatsData {
    totalCobradoMes: number
    pendienteCobro: number
    numFacturasPendientes: number
    venceSemana: number
    numVencenSemana: number
    totalPagos: number
    pagosConciliados: number
}

interface PagosStatsProps {
    stats: PagosStatsData
}

export function PagosStats({ stats }: PagosStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4 hover:scale-105 transition-all duration-300">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">+8.4%</span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Cobrado (Mes)</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalCobradoMes?.toFixed(2) || '0.00'}€</p>
                <p className="text-xs text-slate-500">vs mes anterior</p>
            </div>

            <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4 hover:scale-105 transition-all duration-300">
                <span className="text-2xl">⏳</span>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Pendiente de Cobro</p>
                <p className="text-2xl font-bold mt-1">{stats?.pendienteCobro?.toFixed(2) || '0.00'}€</p>
                <p className="text-xs text-slate-500">{stats?.numFacturasPendientes || 0} facturas</p>
            </div>

            <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4 hover:scale-105 transition-all duration-300">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">📅</span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        {stats?.numVencenSemana || 0} pagos urgentes
                    </span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Vence esta Semana</p>
                <p className="text-2xl font-bold mt-1">{stats?.venceSemana?.toFixed(2) || '0.00'}€</p>
            </div>

            <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4 hover:scale-105 transition-all duration-300">
                <span className="text-2xl">✅</span>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Conciliados</p>
                <p className="text-2xl font-bold mt-1">{stats?.pagosConciliados || 0} pagos</p>
                <p className="text-xs text-slate-500">
                    {stats?.totalPagos > 0 ? Math.round((stats.pagosConciliados / stats.totalPagos) * 100) : 0}% del total
                </p>
            </div>
        </div>
    )
}
