interface ConceptosStatsProps {
    totalConceptos: number
    masUsado: string
    precioPromedio: number
}

export function ConceptosStats({ totalConceptos, masUsado, precioPromedio }: ConceptosStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: 'Total Conceptos', value: totalConceptos, icon: '📦', badge: '+12' },
                { label: 'Más Usado', value: masUsado, icon: '⚡' },
                { label: 'Precio Promedio', value: `${precioPromedio.toFixed(2)}€`, icon: '💰' },
                { label: 'Facturas con Catálogo', value: '85%', icon: '📊', badge: '↑ 2.4%' },
            ].map((stat, i) => (
                <div key={i} className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4 hover:scale-105 transition-all duration-300">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl">{stat.icon}</span>
                        {stat.badge && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">{stat.badge}</span>}
                    </div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-200">{stat.value}</p>
                </div>
            ))}
        </div>
    )
}
