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
    { key: 'facturacion', label: 'Facturación Total', value: (s: ClientesStatsProps['stats']) => s.facturacionTotal, icon: Banknote, color: 'text-primary dark:text-primary', bg: 'bg-primary/10 dark:bg-primary/20', format: 'currency' },
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
                className="group relative overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:ring-1 hover:ring-primary/30 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 100}ms` } as React.CSSProperties}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-4 sm:p-5">
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
