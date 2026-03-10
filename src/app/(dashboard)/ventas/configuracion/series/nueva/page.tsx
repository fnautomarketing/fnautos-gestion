import { SerieForm } from '@/components/series/serie-form'

export default function NuevaSeriePage() {
    return (
        <div className="w-full space-y-6">
            <div className="text-sm text-slate-500">
                Ventas › Configuración › Series › Nueva
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="h-10 sm:h-14 w-1 flex-shrink-0 bg-primary rounded-full" />
                <h1 className="text-2xl sm:text-5xl font-serif font-bold">Nueva Serie</h1>
            </div>

            <SerieForm />
        </div>
    )
}
