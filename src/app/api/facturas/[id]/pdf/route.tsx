
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
    let codigoSerie = 'F2026'
    if (factura.serie_info) {
        if (Array.isArray(factura.serie_info) && factura.serie_info.length > 0) {
            codigoSerie = factura.serie_info[0].codigo || 'F2026'
        } else if (!Array.isArray(factura.serie_info) && factura.serie_info.codigo) {
            codigoSerie = factura.serie_info.codigo
        }
    } else if (factura.serie && typeof factura.serie === 'string' && !factura.serie.includes('-')) {
        // Fallback para series pre-migración (IDs eran strings como 'F2026' en vez de UUIDs)
        codigoSerie = factura.serie
    }
    
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

    // Load Logo dinámicamente — optimizado para PDFs ligeros (<200KB)
    // El logo se muestra a 70×70px en el PDF, por lo que 200px es más que suficiente.
    // Usamos JPEG q75 (más ligero que PNG) y un logo pre-optimizado como fallback.
    const MAX_LOGO_PX = 200
    const JPEG_QUALITY = 75
    const MAX_RAW_BYTES = 200 * 1024 // 200 KB máximo para fallback sin sharp

    let logoUrl: string | undefined
    try {
        // 1. Intentar logo de la empresa (subido a Supabase)
        if (empresa.logo_url) {
            try {
                const res = await fetch(empresa.logo_url)
                if (res.ok) {
                    const buf = Buffer.from(await res.arrayBuffer())
                    const isSvg = empresa.logo_url.toLowerCase().endsWith('.svg') || res.headers.get('content-type')?.includes('svg')

                    try {
                        const resizedBuffer = await sharp(buf)
                            .resize(MAX_LOGO_PX, MAX_LOGO_PX, { fit: 'inside', withoutEnlargement: true })
                            .flatten({ background: { r: 255, g: 255, b: 255 } })
                            .jpeg({ quality: JPEG_QUALITY })
                            .toBuffer()
                        logoUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`
                    } catch (sharpError) {
                        console.warn('Sharp falló al redimensionar logo de empresa:', sharpError)
                        // Fallback: usar el original solo si pesa menos de 200 KB y no es SVG
                        if (!isSvg && buf.length <= MAX_RAW_BYTES) {
                            logoUrl = `data:image/png;base64,${buf.toString('base64')}`
                        }
                    }
                }
            } catch (e) {
                console.error('Error cargando logo de empresa:', e)
            }
        }

        // 2. Fallback: logo pre-optimizado para PDF (8.9 KB, 240×240px)
        if (!logoUrl) {
            const pdfLogoPath = path.join(process.cwd(), 'public', 'logo-fnautos-pdf.png')
            if (fs.existsSync(pdfLogoPath)) {
                const logoBuffer = fs.readFileSync(pdfLogoPath)
                logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
            } else {
                // Último recurso: comprimir el logo original con sharp
                const relativeLogoPath = clientConfig.logoPngPath || clientConfig.logoPath
                const logoPath = path.join(process.cwd(), 'public', relativeLogoPath.replace(/^\//, ''))
                if (fs.existsSync(logoPath)) {
                    const logoBuffer = fs.readFileSync(logoPath)
                    try {
                        const resizedBuffer = await sharp(logoBuffer)
                            .resize(MAX_LOGO_PX, MAX_LOGO_PX, { fit: 'inside', withoutEnlargement: true })
                            .flatten({ background: { r: 255, g: 255, b: 255 } })
                            .jpeg({ quality: JPEG_QUALITY })
                            .toBuffer()
                        logoUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`
                    } catch (sharpError) {
                        console.warn('Sharp falló con logo del sistema:', sharpError)
                        // Solo usar raw si pesa menos de 200 KB
                        if (logoBuffer.length <= MAX_RAW_BYTES) {
                            logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
                        }
                    }
                }
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
