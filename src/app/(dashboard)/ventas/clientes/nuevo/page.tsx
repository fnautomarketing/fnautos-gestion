import { ClienteForm } from '@/components/clientes/cliente-form'
import { getUserContext } from '@/app/actions/usuarios-empresas'

export default async function NuevoClientePage() {
    const { empresas } = await getUserContext()
    const empresasOptions = (empresas as { empresa_id: string; empresa?: { razon_social: string; nombre_comercial?: string } }[])
        .filter((e: any) => e.empresa_id)
        .map((e: any) => ({
            id: e.empresa_id,
            razon_social: e.empresa?.razon_social || 'Sin nombre',
            nombre_comercial: e.empresa?.nombre_comercial,
        }))

    return (
        <div className="space-y-6 w-full">
            <div>
                <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                    <span className="opacity-50">Ventas</span>
                    <span>›</span>
                    <span className="opacity-50">Clientes</span>
                    <span>›</span>
                    <span className="text-primary">Nuevo</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">Nuevo Cliente</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Registra un nuevo cliente en tu base de datos con validación fiscal automática.</p>
            </div>
            <ClienteForm empresas={empresasOptions} />
        </div>
    )
}
