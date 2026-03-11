
import { createServerClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { FacturaPdfDocument, type Empresa, type PdfOptions } from '@/components/ventas/pdf/pdf-document'
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { getUserContext } from '@/app/actions/usuarios-empresas'

import { clientConfig } from '@/config/clients'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    let plantillaOpt = (searchParams.get('plantilla') as any) || null

    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { empresaId, rol } = await getUserContext()
    const isGlobal = !empresaId && rol === 'admin'

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

    const empresaFiltro = isGlobal ? undefined : (empresaId || perfil?.empresa_id)
    if (!empresaFiltro && !isGlobal) {
        return new NextResponse('No company assigned', { status: 403 })
    }

    let query = supabase
        .from('facturas')
        .select(`
            *,
            cliente:clientes(*),
            lineas:lineas_factura(*)
        `)
        .eq('id', id)
    if (empresaFiltro) query = query.eq('empresa_id', empresaFiltro)
    const { data: factura, error } = await query.single()

    if (error || !factura) {
        return new NextResponse('Invoice not found', { status: 404 })
    }

    // PLANTILLA LOGIC (RFC-025 override)
    // If no query param provided, check DB invoice template
    if (!plantillaOpt && factura.plantilla_pdf_id) {
        // Map DB ID to visual template option
        const PLANTILLA_CORPORATIVA_ID = '5e63ff58-2cd5-4234-805a-fd93f50ee84c'
        if (factura.plantilla_pdf_id === PLANTILLA_CORPORATIVA_ID) {
            plantillaOpt = 'premium'
        } else {
            plantillaOpt = 'estandar'
        }
    }

    // Default fallback
    const finalPlantilla = plantillaOpt || 'estandar'

    const options: PdfOptions = {
        plantilla: finalPlantilla as any,
        idioma: (searchParams.get('idioma') as any) || 'es',
        incluirLogo: searchParams.get('incluirLogo') === 'true',
        incluirDatosBancarios: searchParams.get('incluirDatosBancarios') === 'true',
        notasPie: searchParams.get('notasPie') || '',
        colorAcento: searchParams.get('colorAcento') || undefined,
    }

    // Fetch Empresa Data (emisor de la factura)
    const { data: empresaRow } = await supabase
        .from('empresas')
        .select('razon_social, nombre_comercial, direccion, ciudad, codigo_postal, provincia, pais, cif, email, iban, banco, pie_factura, logo_url')
        .eq('id', factura.empresa_id)
        .single()

    const empresa: Empresa = empresaRow ? {
        nombre_fiscal: empresaRow.razon_social || empresaRow.nombre_comercial || 'Empresa',
        direccion: empresaRow.direccion || '',
        ciudad: empresaRow.ciudad || '',
        codigo_postal: empresaRow.codigo_postal || '',
        cif: empresaRow.cif || '',
        email: empresaRow.email || undefined,
        iban: empresaRow.iban || undefined,
        banco: empresaRow.banco || undefined,
        pie_factura: empresaRow.pie_factura || undefined,
    } : {
        nombre_fiscal: 'Empresa',
        direccion: '',
        ciudad: '',
        codigo_postal: '',
        cif: '',
    }

    // Load Logo dinámicamente desde el config del cliente
    let logoUrl: string | undefined
    try {
        const relativeLogoPath = clientConfig.logoPngPath || clientConfig.logoPath
        const logoPath = path.join(process.cwd(), 'public', relativeLogoPath.replace(/^\//, ''))
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath)
            const isSvg = relativeLogoPath.endsWith('.svg')
            const mimeType = isSvg ? 'image/svg+xml' : 'image/png'
            logoUrl = `data:${mimeType};base64,${logoBuffer.toString('base64')}`
        } else {
            logoUrl = undefined
        }
    } catch (e) {
        console.warn('Could not load logo for PDF', e)
        logoUrl = undefined
    }

    // Generate Stream
    try {

        const stream = await renderToStream(
            <FacturaPdfDocument
                factura={factura as unknown as any}
                empresa={empresa}
                options={options}
                logoUrl={logoUrl}
            />
        )

        // Return PDF Response
        const filename = `${factura.serie}-${factura.numero}.pdf`
        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
            }
        })
    } catch (err: any) {
        console.error('PDF Generation Error Stack:', err.stack)
        return new NextResponse(`Error generating PDF: ${err.message}`, { status: 500 })
    }
}
