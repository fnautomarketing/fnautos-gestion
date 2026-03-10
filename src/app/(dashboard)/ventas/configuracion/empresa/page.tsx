import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConfiguracionEmpresaForm } from '@/components/configuracion/empresa-form'
import { DescargarDatosFiscalesButton } from '@/components/configuracion/descargar-datos-fiscales-button'
import type { Empresa } from '@/types/empresa'
import { getUserContext } from '@/app/actions/usuarios-empresas'

export default async function ConfiguracionEmpresaPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { empresaId: empresaActivaId, empresas, rol } = await getUserContext()

    // Fallback: si por alguna raz?n no hay empresa activa en el contexto, usar perfil cl?sico
    let empresaIdParaConfig = empresaActivaId
    if (!empresaIdParaConfig) {
        const { data: perfil } = await supabase.from('perfiles').select('empresa_id').eq('user_id', user.id).single()
        empresaIdParaConfig = perfil?.empresa_id || null
    }
    if (!empresaIdParaConfig) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Sin empresa activa</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">No se ha podido determinar una empresa activa. Selecciona una empresa desde el selector del header.</p>
            </div>
        )
    }
    const { data: empresaData } = await supabase.from('empresas').select('*').eq('id', empresaIdParaConfig).single()
    if (!empresaData) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error: Empresa no encontrada</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">No se han podido cargar los datos de la empresa activa seleccionada.</p>
                <p className="text-xs text-slate-500 mt-4">ID Empresa: {empresaIdParaConfig}</p>
            </div>
        )
    }
    const empresa = empresaData as unknown as Empresa
    const { data: seriesData } = await supabase.from('series_facturacion').select('id, codigo, nombre, prefijo').eq('empresa_id', empresaIdParaConfig).eq('activa', true).order('codigo')
    const series = (seriesData || []).map((s) => ({ id: s.id, codigo: s.codigo || '', nombre: s.nombre || '', prefijo: s.prefijo || '' }))
    const { data: plantillasData } = await supabase.from('plantillas_pdf').select('id, nombre').eq('empresa_id', empresaIdParaConfig).eq('activa', true).order('nombre')
    const plantillas = plantillasData || []
    return (
        <div className="space-y-6">
            <div className="text-sm text-slate-500">Configuración → Empresa</div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold">Configuración de Empresa</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                    Datos fiscales y de facturación
                    </p>
                </div>
                <DescargarDatosFiscalesButton
                    empresaId={empresaIdParaConfig}
                    nombreEmpresa={empresa.razon_social}
                />
            </div>
            <ConfiguracionEmpresaForm empresa={empresa} series={series} plantillas={plantillas} />
        </div>
    )
}
