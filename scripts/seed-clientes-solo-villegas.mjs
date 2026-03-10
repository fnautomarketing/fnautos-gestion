#!/usr/bin/env node
/**
 * Inserta clientes solo para Villegas.
 * Ejecutar: node scripts/seed-clientes-solo-villegas.mjs
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

const CLIENTES = [
  {
    cif: 'A08227829',
    nombre_fiscal: 'EMPRESAS RAMONEDA S.A',
    direccion: 'AVDA.TORRE MATEU 151',
    codigo_postal: '08210',
    ciudad: 'Barberà del Vallès',
    provincia: 'Barcelona',
    email_principal: 'Personal@ramoneda.com',
    telefono_principal: null,
    tipo_cliente: 'empresa',
  },
  {
    cif: 'B60901766',
    nombre_fiscal: 'RADOCKS S.L',
    direccion: 'AVDA.TORRE MATEU 149',
    codigo_postal: '08210',
    ciudad: 'Barberà del Vallès',
    provincia: 'Barcelona',
    email_principal: 'Personal@ramoneda.com',
    telefono_principal: null,
    tipo_cliente: 'empresa',
  },
  {
    cif: 'B25466855',
    nombre_fiscal: 'NAGRUP HISPANIA S.L',
    direccion: "POL.IND.LES MINETES NAU 8",
    codigo_postal: '08130',
    ciudad: 'Santa Perpètua de la Mogoda',
    provincia: 'Barcelona',
    email_principal: 'comptabilitat@nagrup.com',
    telefono_principal: null,
    tipo_cliente: 'empresa',
  },
  {
    cif: 'B66410036',
    nombre_fiscal: 'PERSAN LOGISTICA INTEGRAL SL',
    direccion: 'JOSEP TARRADELLAS 76 LOCAL',
    codigo_postal: '08160',
    ciudad: 'Montmeló',
    provincia: 'Barcelona',
    email_principal: 'sonia.persan@persanlogistica.com',
    telefono_principal: null,
    tipo_cliente: 'empresa',
  },
  {
    cif: 'B67394387',
    nombre_fiscal: 'CARFERTRANSPORTO627, SL',
    direccion: 'AVD VALENCIA 18 PLANTA 3 PO1',
    codigo_postal: '08750',
    ciudad: 'Molins de Rei',
    provincia: 'Barcelona',
    email_principal: 'carfertransport@gmail.com',
    telefono_principal: null,
    tipo_cliente: 'empresa',
  },
]

async function run() {
  console.log('Insertando clientes solo Villegas...')
  for (const c of CLIENTES) {
    const { data: inserted, error } = await supabase
      .from('clientes')
      .insert({
        cif: c.cif,
        nombre_fiscal: c.nombre_fiscal,
        email_principal: c.email_principal,
        telefono_principal: c.telefono_principal,
        direccion: c.direccion,
        codigo_postal: c.codigo_postal,
        ciudad: c.ciudad,
        provincia: c.provincia,
        pais: 'España',
        empresa_id: null,
        activo: true,
        forma_pago_predeterminada: 'transferencia_30',
        dias_vencimiento: 30,
        descuento_comercial: 0,
        iva_aplicable: 21,
        tipo_cliente: c.tipo_cliente,
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
  console.log('Listo. 5 clientes insertados (solo Villegas).')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
