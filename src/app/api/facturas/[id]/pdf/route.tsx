
import { createServerClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { FacturaPdfDocument, type Empresa, type PdfOptions } from '@/components/ventas/pdf/pdf-document'
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
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
            lineas:lineas_factura(*),
            serie_info:series_facturacion(codigo)
        `)
        .eq('id', id)
    if (empresaFiltro) query = query.eq('empresa_id', empresaFiltro)
    const { data: facturaRaw, error } = await query.single()

    if (error || !facturaRaw) {
        return new NextResponse('Invoice not found', { status: 404 })
    }

    const factura = facturaRaw as any
    // Asegurar que la serie es el código oficial (F2026, etc.)
    const codigoSerie = factura.serie_info?.codigo || factura.serie || 'F2026'
    const facturaConSerie = { ...factura, serie: codigoSerie }

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
        // 1. Intentar logo de la empresa (subido a Supabase)
        if (empresa.logo_url) {
            try {
                const res = await fetch(empresa.logo_url)
                if (res.ok) {
                    const buf = Buffer.from(await res.arrayBuffer())
                    // Usar sharp para redimensionar logos externos/grandes a un tamaño manejable (400px x 400px)
                    // Esto evita PDFs gigantes y errores de memoria con imágenes de 4096px
                    const resizedBuffer = await sharp(buf)
                        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                        .png()
                        .toBuffer()
                    logoUrl = `data:image/png;base64,${resizedBuffer.toString('base64')}`
                }
            } catch (e) {
                console.error('Error cargando logo de empresa:', e)
            }
        }

        // 2. Fallback al logo del sistema (FNAUTOS) if unavailable
        if (!logoUrl) {
            // Priorizar siempre PNG sobre SVG para el PDF
            const relativeLogoPath = clientConfig.logoPngPath || clientConfig.logoPath
            const logoPath = path.join(process.cwd(), 'public', relativeLogoPath.replace(/^\//, ''))
            
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath)
                // Redimensionar también el logo del sistema si es muy grande
                const resizedBuffer = await sharp(logoBuffer)
                    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                    .png()
                    .toBuffer()
                logoUrl = `data:image/png;base64,${resizedBuffer.toString('base64')}`
            }
        }
    } catch (e) {
        console.warn('Could not load logo for PDF', e)
    }

    // Generate Stream
    try {

        const stream = await renderToStream(
            <FacturaPdfDocument
                factura={facturaConSerie as unknown as any}
                empresa={empresa}
                options={options}
                logoUrl={logoUrl}
            />
        )

        // Return PDF Response
        const filename = `${facturaConSerie.serie}-${facturaConSerie.numero}.pdf`
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
