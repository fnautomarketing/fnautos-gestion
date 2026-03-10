/**
 * Tests unitarios: actualizarEmpresaAction
 *
 * Valida especialmente que el action usa empresa_id del formulario
 * en lugar de perfiles.empresa_id, evitando el error de constraint única
 * cuando el usuario opera en una empresa distinta a la de su perfil.
 */
import { vi, describe, test, expect, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Supabase query builder encadenable: todos los métodos devuelven `this`,
// sólo `single()` resuelve la promesa con el valor configurado.
function makeBuilder(resolveWith: { data?: any; error?: any }) {
    const b: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(resolveWith),
    }
    return b
}

// Mock configurable de createServerClient
const mockGetSession = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createServerClient: vi.fn(() =>
        Promise.resolve({
            auth: { getSession: mockGetSession },
            from: mockFrom,
            rpc: mockRpc,
        })
    ),
}))

// Admin client no se usa en actualizarEmpresaAction
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ID_EMPRESA_PERFIL = 'empresa-villegas-id'
const ID_EMPRESA_FORM = 'empresa-edison-id'
const CIF_NIF = '12345678A' // NIF persona → omite el SELECT previo al UPDATE

function buildSession(userId = 'user-123') {
    return { data: { session: { user: { id: userId } } } }
}

function buildPerfil(empresaId: string, rol = 'administrador') {
    return { data: { empresa_id: empresaId, rol }, error: null }
}

function makeFormData(overrides: Record<string, string> = {}) {
    const fd = new FormData()
    fd.append('razon_social', 'Edison Test S.L.')
    fd.append('cif', overrides.cif ?? CIF_NIF)
    fd.append('tipo_empresa', overrides.tipo_empresa ?? 'autonomo')
    fd.append('pais', 'España')
    fd.append('iva_predeterminado', '21')
    fd.append('retencion_predeterminada', '0')
    fd.append('regimen_iva', 'general')
    fd.append('aplica_recargo_equivalencia', 'false')
    fd.append('recargo_porcentaje', '0')
    fd.append('dias_pago_predeterminados', '30')
    if (overrides.empresa_id !== undefined) fd.append('empresa_id', overrides.empresa_id)
    if (overrides.lugar_expedicion) fd.append('lugar_expedicion', overrides.lugar_expedicion)
    if (overrides.iban) fd.append('iban', overrides.iban)
    return fd
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('actualizarEmpresaAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetSession.mockResolvedValue(buildSession())
    })

    // ── Autenticación ──────────────────────────────────────────────────────

    test('devuelve error si el usuario no tiene sesión', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } })
        const { actualizarEmpresaAction } = await import('../empresa')
        const result = await actualizarEmpresaAction(makeFormData())
        expect(result.success).toBe(false)
    })

    // ── Permisos ───────────────────────────────────────────────────────────

    test('devuelve error si el rol no es admin', async () => {
        mockFrom.mockReturnValue(makeBuilder(buildPerfil(ID_EMPRESA_PERFIL, 'usuario')))
        const { actualizarEmpresaAction } = await import('../empresa')
        const result = await actualizarEmpresaAction(makeFormData({ empresa_id: ID_EMPRESA_FORM }))
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/permisos/i)
    })

    // ── Empresa ID: campo oculto del formulario ────────────────────────────

    test('usa empresa_id del formulario cuando está presente', async () => {
        let updateEqArg: string | null = null
        const perfilBuilder = makeBuilder(buildPerfil(ID_EMPRESA_PERFIL))
        const empresaUpdateBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, val: string) => {
                updateEqArg = val
                return empresaUpdateBuilder
            }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: ID_EMPRESA_FORM }, error: null }),
        }

        mockFrom.mockImplementation((table: string) => {
            if (table === 'perfiles') return perfilBuilder
            return empresaUpdateBuilder
        })
        mockRpc.mockResolvedValue({ data: true, error: null })

        const { actualizarEmpresaAction } = await import('../empresa')
        const result = await actualizarEmpresaAction(makeFormData({ empresa_id: ID_EMPRESA_FORM }))

        expect(result.success).toBe(true)
        // El update debe haberse ejecutado sobre la empresa del formulario, no la del perfil
        expect(updateEqArg).toBe(ID_EMPRESA_FORM)
        expect(updateEqArg).not.toBe(ID_EMPRESA_PERFIL)
    })

    test('usa empresaId del perfil como fallback cuando no hay empresa_id en el formulario', async () => {
        let updateEqArg: string | null = null
        const perfilBuilder = makeBuilder(buildPerfil(ID_EMPRESA_PERFIL))
        const empresaUpdateBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, val: string) => {
                updateEqArg = val
                return empresaUpdateBuilder
            }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: ID_EMPRESA_PERFIL }, error: null }),
        }

        mockFrom.mockImplementation((table: string) => {
            if (table === 'perfiles') return perfilBuilder
            return empresaUpdateBuilder
        })
        mockRpc.mockResolvedValue({ data: true, error: null })

        const { actualizarEmpresaAction } = await import('../empresa')
        // Sin empresa_id en el form
        const result = await actualizarEmpresaAction(makeFormData())

        expect(result.success).toBe(true)
        expect(updateEqArg).toBe(ID_EMPRESA_PERFIL)
    })

    test('empresa_id vacío en el formulario usa el fallback del perfil', async () => {
        let updateEqArg: string | null = null
        const perfilBuilder = makeBuilder(buildPerfil(ID_EMPRESA_PERFIL))
        const empresaUpdateBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, val: string) => {
                updateEqArg = val
                return empresaUpdateBuilder
            }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: ID_EMPRESA_PERFIL }, error: null }),
        }

        mockFrom.mockImplementation((table: string) => {
            if (table === 'perfiles') return perfilBuilder
            return empresaUpdateBuilder
        })
        mockRpc.mockResolvedValue({ data: true, error: null })

        const { actualizarEmpresaAction } = await import('../empresa')
        const result = await actualizarEmpresaAction(makeFormData({ empresa_id: '   ' }))

        expect(result.success).toBe(true)
        expect(updateEqArg).toBe(ID_EMPRESA_PERFIL)
    })

    // ── Validación de CIF/NIF ──────────────────────────────────────────────

    test('devuelve error si el CIF está vacío', async () => {
        mockFrom.mockReturnValue(makeBuilder(buildPerfil(ID_EMPRESA_PERFIL)))
        const { actualizarEmpresaAction } = await import('../empresa')
        const fd = makeFormData({ empresa_id: ID_EMPRESA_FORM })
        fd.set('cif', '')
        const result = await actualizarEmpresaAction(fd)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/cif.*obligatorio/i)
    })

    test('devuelve error si el CIF tiene formato inválido', async () => {
        mockFrom.mockReturnValue(makeBuilder(buildPerfil(ID_EMPRESA_PERFIL)))
        const { actualizarEmpresaAction } = await import('../empresa')
        const fd = makeFormData({ empresa_id: ID_EMPRESA_FORM })
        fd.set('cif', 'INVALIDO')
        const result = await actualizarEmpresaAction(fd)
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/formato/i)
    })

    test('acepta CIF empresa formato B12345678', async () => {
        const perfilBuilder = makeBuilder(buildPerfil(ID_EMPRESA_PERFIL))
        // Primera llamada a empresas: SELECT cif para comparar
        const empresaSelectBuilder = makeBuilder({ data: { cif: 'B12345678' }, error: null })
        const empresaUpdateBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: ID_EMPRESA_FORM }, error: null }),
        }

        let empresasCallCount = 0
        mockFrom.mockImplementation((table: string) => {
            if (table === 'perfiles') return perfilBuilder
            empresasCallCount++
            return empresasCallCount === 1 ? empresaSelectBuilder : empresaUpdateBuilder
        })
        mockRpc.mockResolvedValue({ data: true, error: null })

        const { actualizarEmpresaAction } = await import('../empresa')
        const fd = makeFormData({ empresa_id: ID_EMPRESA_FORM })
        fd.set('cif', 'B12345678')
        const result = await actualizarEmpresaAction(fd)
        expect(result.success).toBe(true)
    })

    // ── Propagación de error de Supabase ───────────────────────────────────

    test('propaga error de Supabase en el update (ej. duplicate key)', async () => {
        const perfilBuilder = makeBuilder(buildPerfil(ID_EMPRESA_PERFIL))
        const empresaUpdateBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'duplicate key value violates unique constraint "empresas_cif_key_active"' },
            }),
        }
        mockFrom.mockImplementation((table: string) => {
            if (table === 'perfiles') return perfilBuilder
            return empresaUpdateBuilder
        })
        mockRpc.mockResolvedValue({ data: true, error: null })

        const { actualizarEmpresaAction } = await import('../empresa')
        const result = await actualizarEmpresaAction(makeFormData({ empresa_id: ID_EMPRESA_FORM }))
        expect(result.success).toBe(false)
        expect(result.error).toMatch(/duplicate key/i)
    })

    // ── lugar_expedicion ───────────────────────────────────────────────────

    test('guarda lugar_expedicion correctamente', async () => {
        let capturedData: any = null
        const perfilBuilder = makeBuilder(buildPerfil(ID_EMPRESA_PERFIL))
        const empresaUpdateBuilder = {
            update: vi.fn().mockImplementation((data: any) => {
                capturedData = data
                return empresaUpdateBuilder
            }),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: ID_EMPRESA_FORM }, error: null }),
        }
        mockFrom.mockImplementation((table: string) => {
            if (table === 'perfiles') return perfilBuilder
            return empresaUpdateBuilder
        })
        mockRpc.mockResolvedValue({ data: true, error: null })

        const { actualizarEmpresaAction } = await import('../empresa')
        await actualizarEmpresaAction(
            makeFormData({ empresa_id: ID_EMPRESA_FORM, lugar_expedicion: 'Barcelona' })
        )
        expect(capturedData?.lugar_expedicion).toBe('Barcelona')
    })
})
