
import { NextResponse } from 'next/server'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const context = await getUserContext()
        const supabase = await createServerClient()
        const admin = createAdminClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('user_id', user?.id || '')
            .single()

        const { data: usuarioEmpresas } = await admin
            .from('usuarios_empresas')
            .select('*, empresas(*)')
            .eq('usuario_id', user?.id || '')

        const { data: seriesAdmin } = await admin
            .from('series_facturacion')
            .select('*')
            .eq('empresa_id', context.empresaId || '')

        const { data: clientesEmpresas } = await admin
            .from('clientes_empresas')
            .select('cliente_id')
            .eq('empresa_id', context.empresaId || '')
        
        const clienteIds = (clientesEmpresas || []).map(c => c.cliente_id)
        const { data: clientesAdmin } = clienteIds.length > 0 
            ? await admin.from('clientes').select('*').in('id', clienteIds)
            : { data: [] }

        return NextResponse.json({
            user: {
                id: user?.id,
                email: user?.email
            },
            context: {
                empresaId: context.empresaId,
                rol: context.rol,
                empresa: context.empresa,
                empresas: context.empresas
            },
            perfil,
            usuarioEmpresas,
            seriesAdmin,
            clientesAdmin
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
