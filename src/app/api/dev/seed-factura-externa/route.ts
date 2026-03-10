/**
 * API de desarrollo: sube un PDF de prueba y actualiza la factura externa
 * para poder emitirla. Solo en desarrollo.
 *
 * GET /api/dev/seed-factura-externa?id=FACTURA_ID
 */
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserContext } from '@/app/actions/usuarios-empresas'

const MINIMAL_PDF = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n',
    'utf-8'
)

export async function GET(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get('id')
    if (!facturaId) {
        return NextResponse.json({ error: 'Falta id de factura (query param id)' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { empresaId, rol } = await getUserContext()
    const isGlobal = !empresaId && rol === 'admin'

    let query = supabase
        .from('facturas')
        .select('id, empresa_id, es_externa')
        .eq('id', facturaId)
        .eq('es_externa', true)
    if (!isGlobal && empresaId) query = query.eq('empresa_id', empresaId)
    const { data: factura } = await query.single()

    if (!factura) {
        return NextResponse.json({ error: 'Factura externa no encontrada' }, { status: 404 })
    }

    const fileName = `facturas/${facturaId}_${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
        .from('facturas-externas')
        .upload(fileName, MINIMAL_PDF, {
            contentType: 'application/pdf',
            upsert: true
        })

    if (uploadError) {
        return NextResponse.json({ error: `Error subiendo PDF: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
        .from('facturas-externas')
        .getPublicUrl(fileName)

    const { error: updateError } = await supabase
        .from('facturas')
        .update({ archivo_url: publicUrl })
        .eq('id', facturaId)

    if (updateError) {
        return NextResponse.json({ error: `Error actualizando: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        archivo_url: publicUrl,
        message: 'PDF subido. Puedes emitir la factura desde la UI.'
    })
}
