#!/usr/bin/env node
/**
 * Elimina todos los clientes actuales y crea nuevos:
 * - Clientes comunes para Edison y Yenifer
 * - Clientes solo para Villegas
 *
 * Ejecutar: node scripts/seed-clientes-empresas.mjs
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') })

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })

const EMPRESA_VILLEGAS = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const EMPRESA_YENIFER = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
const EMPRESA_EDISON = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

// Clientes comunes para Edison y Yenifer
const CLIENTES_COMUNES_EDISON_YENIFER = [
  {
    cif: 'B12345678',
    nombre_fiscal: 'Servicios Comunes Edison Yenifer S.L.',
    nombre_comercial: 'Comunes EY',
    email_principal: 'contabilidad@comunes-ey.es',
    telefono_principal: '912345678',
    direccion: 'Calle Mayor 10',
    codigo_postal: '28013',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
  },
  {
    cif: 'B87654321',
    nombre_fiscal: 'Consultoría Edison Yenifer S.A.',
    nombre_comercial: 'Consultoría EY',
    email_principal: 'info@consultoria-ey.es',
    telefono_principal: '913456789',
    direccion: 'Paseo de la Castellana 100',
    codigo_postal: '28046',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
  },
]

// Clientes solo para Villegas
const CLIENTES_SOLO_VILLEGAS = [
  {
    cif: 'B11111111',
    nombre_fiscal: 'Cliente Exclusivo Villegas S.L.',
    nombre_comercial: 'Exclusivo Villegas',
    email_principal: 'admin@exclusivo-villegas.es',
    telefono_principal: '914567890',
    direccion: 'Avenida Principal 5',
    codigo_postal: '28001',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
  },
  {
    cif: 'B22222222',
    nombre_fiscal: 'Premium Villegas Marketing S.L.',
    nombre_comercial: 'Premium Villegas',
    email_principal: 'contacto@premium-villegas.es',
    telefono_principal: '915678901',
    direccion: 'Calle Comercial 22',
    codigo_postal: '28002',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
  },
]

async function run() {
  console.log('1. Eliminando facturas y datos relacionados...')
  await supabase.from('facturas').update({ factura_rectificada_id: null }).not('factura_rectificada_id', 'is', null)

  const { data: facturas } = await supabase.from('facturas').select('id')
  if (facturas?.length) {
    const ids = facturas.map(f => f.id)
    for (const id of ids) {
      await supabase.from('recordatorios').delete().eq('factura_id', id)
      await supabase.from('pagos_factura').delete().eq('factura_id', id)
      await supabase.from('emails_factura').delete().eq('factura_id', id)
      await supabase.from('eventos_factura').delete().eq('factura_id', id)
      await supabase.from('lineas_factura').delete().eq('factura_id', id)
    }
    const { error: delF } = await supabase.from('facturas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (delF) console.error('Error eliminando facturas:', delF)
  }
  console.log('   Facturas eliminadas.')

  console.log('2. Eliminando clientes...')
  const { data: clientes } = await supabase.from('clientes').select('id')
  if (clientes?.length) {
    for (const c of clientes) {
      await supabase.from('clientes_empresas').delete().eq('cliente_id', c.id)
    }
    await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }
  console.log('   Clientes eliminados.')

  console.log('3. Insertando clientes comunes (Edison + Yenifer)...')
  for (const c of CLIENTES_COMUNES_EDISON_YENIFER) {
    const { data: inserted, error } = await supabase
      .from('clientes')
      .insert({
        cif: c.cif,
        nombre_fiscal: c.nombre_fiscal,
        nombre_comercial: c.nombre_comercial,
        email_principal: c.email_principal,
        telefono_principal: c.telefono_principal,
        direccion: c.direccion,
        codigo_postal: c.codigo_postal,
        ciudad: c.ciudad,
        provincia: c.provincia,
        pais: c.pais,
        empresa_id: null,
        activo: true,
        forma_pago_predeterminada: 'transferencia_30',
        dias_vencimiento: 30,
        descuento_comercial: 0,
        iva_aplicable: 21,
        tipo_cliente: 'empresa',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error insertando', c.nombre_fiscal, error)
      continue
    }
    await supabase.from('clientes_empresas').insert([
      { cliente_id: inserted.id, empresa_id: EMPRESA_EDISON },
      { cliente_id: inserted.id, empresa_id: EMPRESA_YENIFER },
    ])
    console.log('   +', c.nombre_fiscal)
  }

  console.log('4. Insertando clientes solo Villegas...')
  for (const c of CLIENTES_SOLO_VILLEGAS) {
    const { data: inserted, error } = await supabase
      .from('clientes')
      .insert({
        cif: c.cif,
        nombre_fiscal: c.nombre_fiscal,
        nombre_comercial: c.nombre_comercial,
        email_principal: c.email_principal,
        telefono_principal: c.telefono_principal,
        direccion: c.direccion,
        codigo_postal: c.codigo_postal,
        ciudad: c.ciudad,
        provincia: c.provincia,
        pais: c.pais,
        empresa_id: null,
        activo: true,
        forma_pago_predeterminada: 'transferencia_30',
        dias_vencimiento: 30,
        descuento_comercial: 0,
        iva_aplicable: 21,
        tipo_cliente: 'empresa',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error insertando', c.nombre_fiscal, error)
      continue
    }
    await supabase.from('clientes_empresas').insert([
      { cliente_id: inserted.id, empresa_id: EMPRESA_VILLEGAS },
    ])
    console.log('   +', c.nombre_fiscal)
  }

  console.log('Listo. Clientes comunes (Edison+Yenifer):', CLIENTES_COMUNES_EDISON_YENIFER.length)
  console.log('Clientes solo Villegas:', CLIENTES_SOLO_VILLEGAS.length)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
