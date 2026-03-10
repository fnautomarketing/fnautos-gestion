
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEmpresaAction, actualizarEmpresaAction } from '@/app/actions/empresa'
import { crearClienteAction, actualizarClienteAction } from '@/app/actions/clientes'
import { crearFacturaAction } from '@/app/actions/ventas'
import { registrarPagoAction } from '@/app/actions/pagos'
import { crearFacturaRectificativaAction, getRectificativasDeFacturaAction } from '@/app/actions/facturas-rectificativas'
import { getKPIsAction, getEvolucionFacturacionAction, exportarInformeExcelAction } from '@/app/actions/informes'

type TestResult = {
    name: string
    status: 'passed' | 'failed'
    message?: string
    duration?: number
    logs: string[]
}

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
    }

    const results: TestResult[] = []

    // Helper to get invoice directly
    const getFactura = async (id: string) => {
        const supabase = await createServerClient()
        const { data } = await supabase.from('facturas').select('*').eq('id', id).single()
        return { data }
    }

    const runTest = async (name: string, fn: () => Promise<void>) => {
        const start = performance.now()
        const testLogs: string[] = []
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const consoleLog = (msg: string) => testLogs.push(msg)

        try {
            await fn()
            results.push({
                name,
                status: 'passed',
                duration: performance.now() - start,
                logs: testLogs
            })
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            results.push({
                name,
                status: 'failed',
                message: msg,
                duration: performance.now() - start,
                logs: testLogs
            })
        }
    }

    // --- EMPRESAS ---
    await runTest('Empresa: Get & Update', async () => {
        const res = await getEmpresaAction()
        if (!res.success) throw new Error(res.error)
        if (!res.data) throw new Error('No data')

        // Update
        const formData = new FormData()
        formData.append('razon_social', res.data.razon_social || 'Test Company')
        if (res.data.cif) formData.append('cif', res.data.cif)

        const update = await actualizarEmpresaAction(formData)
        if (!update.success) throw new Error(update.error)
    })

    // Helper to get client directly
    const getCliente = async (id: string) => {
        const supabase = await createServerClient()
        const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
        return { success: true, data }
    }

    // Helper to search clients
    const buscarClientes = async (searchQuery: string) => {
        const { sanitizeSearchInput } = await import('@/lib/security/sanitize-search')
        const q = sanitizeSearchInput(searchQuery)
        const supabase = await createServerClient()
        const { data } = await supabase.from('clientes').select('*').ilike('nombre_fiscal', q ? `%${q}%` : '%')
        return { success: true, data }
    }

    // --- CLIENTES ---
    let clienteId = ''
    await runTest('Clientes: Modulo Completo', async () => {
        // 1. Create
        const uniqueCif = `B${Date.now().toString().slice(-8)}`

        const create = await crearClienteAction({
            nombre_fiscal: 'QA Test Client ' + Date.now(),
            cif: uniqueCif,
            email: 'qa@test.com',
            direccion: 'Test St',
            ciudad: 'Madrid',
            codigo_postal: '28001',
            tipo_persona: 'juridica',
            dias_vencimiento: '30',
            descuento_comercial: '0',
            iva_aplicable: '21',
            activo: 'on'
        } as any) // formData mocking

        if (create.success && create.data) {
            clienteId = create.data.id
        } else {
            // Fallback: create formData if logic expects it
            const fd = new FormData()
            fd.append('nombre_fiscal', 'QA Test Client ' + Date.now())
            fd.append('cif', uniqueCif)
            fd.append('email', 'qa@test.com')
            fd.append('activo', 'on')

            const createFd = await crearClienteAction(fd)
            if (!createFd.success || !createFd.data) throw new Error(createFd.error || 'Create failed no data')
            clienteId = createFd.data.id
        }

        if (!clienteId) throw new Error('Cliente ID not set')

        // 2. Get
        const get = await getCliente(clienteId)
        if (!get.data || get.data.cif !== uniqueCif) throw new Error('Get failed')

        // 3. Update
        const fd = new FormData()
        fd.append('ciudad', 'Barcelona')
        const update = await actualizarClienteAction(clienteId, fd)
        if (!update.success) throw new Error('Update failed')

        // 4. Search
        const search = await buscarClientes('QA Test')
        if (!search.success || !search.data || search.data.length === 0) throw new Error('Search failed')
    })

    // --- FACTURAS ---
    let facturaId = ''
    await runTest('Facturas: Flujo Completo', async () => {
        if (!clienteId) throw new Error('No clienteId from previous test')

        // 1. Get Series
        const supabase = await createServerClient()
        const { data: serie } = await supabase.from('series_facturacion').select('id').limit(1).single()
        const serieId = serie?.id

        if (!serieId) throw new Error('No series found in database')

        // 2. Create - Need FormData
        const fd = new FormData()
        fd.append('cliente_id', clienteId)
        fd.append('fecha_emision', new Date().toISOString().split('T')[0])
        fd.append('fecha_vencimiento', new Date(Date.now() + 86400000).toISOString().split('T')[0])
        fd.append('serie', serieId)
        fd.append('empresa_id', 'ignored') // Just in case schema validates presence

        // We need to match the JSON expectation of the action
        const lineas = [{ concepto: 'QA Test Item', cantidad: 1, precio_unitario: 100, iva: 21, descripcion: 'QA Test' }]
        fd.append('lineas', JSON.stringify(lineas))
        fd.append('subtotal', '100')
        fd.append('total', '121')
        fd.append('base_imponible', '100')
        fd.append('iva', '21')

        const create = await crearFacturaAction(fd)
        if (!create.success || !create.data) throw new Error(create.error || 'Create Invoice failed no data')
        facturaId = create.data.id
        if (!facturaId) throw new Error('Action success but no ID')

        // 3. Payment
        const fdPago = new FormData()
        fdPago.append('factura_id', facturaId)
        fdPago.append('importe', '121')
        fdPago.append('metodo_pago', 'transferencia')
        fdPago.append('fecha_pago', new Date().toISOString().split('T')[0])

        const pay = await registrarPagoAction(fdPago)
        if (!pay.success) throw new Error(pay.error)

        // 4. Check Status (It should be 'pagada' if paid fully)
        const check = await getFactura(facturaId)
        if (check.data?.estado !== 'pagada') throw new Error(`Estado incorrecto: ${check.data?.estado} expected pagada`)
    })

    // --- RECTIFICATIVAS ---
    await runTest('Rectificativas: Total con Abono', async () => {
        if (!facturaId) throw new Error('No facturaId')

        const rect = await crearFacturaRectificativaAction({
            factura_original_id: facturaId,
            tipo_rectificativa: 'total',
            motivo: 'QA Test Rectification Automatic -----------------',
            generar_abono: true
        })
        if (!rect.success) throw new Error(rect.error)

        const list = await getRectificativasDeFacturaAction(facturaId)
        if (!list.success || !list.data || list.data.length === 0) throw new Error('List rectificativas failed')
    })

    // --- INFORMES ---
    await runTest('Informes: KPIs & Data', async () => {
        const kpis = await getKPIsAction(new Date().toISOString(), new Date().toISOString())
        if (!kpis.success) throw new Error('KPIs failed')

        const evol = await getEvolucionFacturacionAction(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            new Date().toISOString()
        )
        if (!evol.success) throw new Error('Evolucion failed')

        const excel = await exportarInformeExcelAction(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            new Date().toISOString()
        )
        if (!excel.success) throw new Error('Excel failed')
    })

    // Clean up
    await runTest('Cleanup', async () => {
        if (clienteId) {
            // Typically we can't delete if related invoices exist depending on FK cascade.
            // But we can try soft delete or just skip.
            // await eliminarClienteAction(clienteId)
        }
    })

    return NextResponse.json({
        summary: {
            total: results.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length
        },
        results
    })
}
