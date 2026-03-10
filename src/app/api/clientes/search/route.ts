import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext } from '@/app/actions/usuarios-empresas'
import { sanitizeSearchInput } from '@/lib/security/sanitize-search'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

/**
 * GET /api/clientes/search?q=texto&page=1&limit=50&empresa_id=uuid
 * Devuelve clientes paginados. Si q está vacío, lista todos (ordenados por nombre).
 * Respeta el contexto de empresa del usuario (si es global, devuelve todos).
 * Opcional: empresa_id filtra por clientes asociados a esa empresa (para informes).
 * Responde: { items: ClienteOption[], total: number, page: number, totalPages: number }
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = sanitizeSearchInput(searchParams.get('q'))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)))
    const from = (page - 1) * limit
    const to = from + limit - 1
    const empresaIdParam = searchParams.get('empresa_id') || null

    try {
        const adminClient = createAdminClient()
        const ctx = await getUserContext()
        const { empresaId: contextEmpresaId, empresas, isAdmin } = ctx

        // SEC-012: Validar que empresa_id del query pertenece al usuario
        let empresaId = empresaIdParam || contextEmpresaId
        if (empresaIdParam) {
            const tieneAcceso = isAdmin || (empresas as { empresa_id?: string }[]).some((e) => e.empresa_id === empresaIdParam)
            if (!tieneAcceso) {
                return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 0 }, { status: 403 })
            }
        }

        let query = adminClient
            .from('clientes')
            .select('id, nombre_fiscal, nombre_comercial, cif', { count: 'exact' })
            .order('nombre_fiscal', { ascending: true })
            .range(from, to)

        if (q.length >= 1) {
            query = query.or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%,cif.ilike.%${q}%`)
        }

        // Excluir clientes de tests E2E (solo clientes reales)
        query = query.not('nombre_fiscal', 'ilike', '%e2e%')

        if (empresaId) {
            const adminSb = createAdminClient()
            const { data: ceRows } = await adminSb
                .from('clientes_empresas')
                .select('cliente_id')
                .eq('empresa_id', empresaId)
            const ids = (ceRows || []).map((r: any) => r.cliente_id)
            if (ids.length === 0) {
                return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 0 })
            }
            query = query.in('id', ids)
        }

        const { data, error, count } = await query
        if (error) return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 0 }, { status: 500 })

        const total = count ?? 0
        const totalPages = Math.ceil(total / limit)

        return NextResponse.json({
            items: (data || []).map((c: any) => ({
                id: c.id,
                label: c.nombre_fiscal || c.nombre_comercial || c.cif || c.id,
                cif: c.cif,
            })),
            total,
            page,
            totalPages,
        })
    } catch {
        return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 0 }, { status: 500 })
    }
}
