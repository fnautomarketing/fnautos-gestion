/**
 * Sube un PDF de prueba a facturas-externas y actualiza la factura externa
 * para poder emitirla y probar la descarga.
 *
 * Uso: npx ts-node scripts/seed-factura-externa-pdf.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan credenciales Supabase (SUPABASE_SERVICE_ROLE_KEY en .env.local)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

// PDF mínimo válido
const MINIMAL_PDF = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n',
    'utf-8'
)

const FACTURA_EXTERNA_ID = '85d0f3f8-2f9d-4b89-a77f-4ec56f179f3b'

async function main() {
    console.log('--- Seed Factura Externa con PDF ---')

    const fileName = `facturas/${FACTURA_EXTERNA_ID}_${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
        .from('facturas-externas')
        .upload(fileName, MINIMAL_PDF, {
            contentType: 'application/pdf',
            upsert: true
        })

    if (uploadError) {
        console.error('Error subiendo PDF:', uploadError)
        process.exit(1)
    }

    const { data: { publicUrl } } = supabase.storage
        .from('facturas-externas')
        .getPublicUrl(fileName)

    console.log('PDF subido:', publicUrl)

    const { error: updateError } = await supabase
        .from('facturas')
        .update({ archivo_url: publicUrl })
        .eq('id', FACTURA_EXTERNA_ID)
        .eq('es_externa', true)

    if (updateError) {
        console.error('Error actualizando factura:', updateError)
        process.exit(1)
    }

    console.log('Factura actualizada con archivo_url.')
    console.log('Puedes emitir la factura desde la UI y probar la descarga.')
}

main()
