import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, UserX, Banknote } from 'lucide-react'

interface ClientesStatsProps {
    stats: {
        totalClientes: number
        activos: number
        inactivos: number
        facturacionTotal: number
    }
}

const statItems = [
    { key: 'total', label: 'Total Clientes', value: (s: ClientesStatsProps['stats']) => s.totalClientes, icon: Users, color: 'text-primary', bg: 'bg-primary/20 dark:bg-primary/20' },
    { key: 'activos', label: 'Clientes Activos', value: (s: ClientesStatsProps['stats']) => s.activos, icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', badge: 'Saludable' },
    { key: 'inactivos', label: 'Inactivos', value: (s: ClientesStatsProps['stats']) => s.inactivos, icon: UserX, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
    { key: 'facturacion', label: 'Facturación Total', value: (s: ClientesStatsProps['stats']) => s.facturacionTotal, icon: Banknote, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40', format: 'currency' },
]

export function ClientesStats({ stats }: ClientesStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount)
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statItems.map((item, idx) => (
            <Card
                key={item.key}
                data-testid={`clientes-stat-${item.key}`}
                className="group border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20 transition-all duration-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                style={{ animationDelay: `${idx * 75}ms` } as React.CSSProperties}
            >
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {item.label}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {item.format === 'currency' ? (
                                        <span suppressHydrationWarning>{formatCurrency(item.value(stats))}</span>
                                    ) : (
                                        item.value(stats)
                                    )}
                                </p>
                                {item.badge && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={`rounded-full p-2 transition-transform duration-200 group-hover:scale-105 ${item.bg}`}>
                            <item.icon className={`h-5 w-5 ${item.color}`} aria-hidden />
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
    )
}
