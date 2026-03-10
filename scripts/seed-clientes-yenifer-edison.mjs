#!/usr/bin/env node
/**
 * Inserta clientes comunes para Yenifer y Edison.
 * Ejecutar: node scripts/seed-clientes-yenifer-edison.mjs
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

const EMPRESA_YENIFER = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
const EMPRESA_EDISON = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

const CLIENTES = [
  {
    cif: 'B60710282',
    nombre_fiscal: 'ROIELLA S.L',
    direccion: "AVD.prat de la riba 180 nv 7",
    codigo_postal: '08780',
    ciudad: 'Palleja',
    provincia: 'Barcelona',
    email_principal: 'Vicentecalzadaprieto1966@gmail.com',
    telefono_principal: null,
    tipo_cliente: 'empresa',
  },
  {
    cif: 'B66617010',
    nombre_fiscal: "Yerai Serveis Logistic S.L.",
    direccion: "Poligono industrial Moli d'en Xec c/moli d'en Xec, Nau 3",
    codigo_postal: '08291',
    ciudad: 'Ripollet',
    provincia: 'Barcelona',
    email_principal: 'traficoserveislogistics@gmail.com',
    telefono_principal: '672277660',
    tipo_cliente: 'empresa',
  },
  {
    cif: '54449716E',
    nombre_fiscal: 'MILTON CASTIBLANCO',
    direccion: 'CALLE SAMUNTADA 52',
    codigo_postal: '08203',
    ciudad: 'Sabadell',
    provincia: 'Barcelona',
    email_principal: 'info@taxitruck.es',
    telefono_principal: '615803020',
    tipo_cliente: 'autonomo',
  },
  {
    cif: 'A08887473',
    nombre_fiscal: 'COMERCIAL FRAMAN S.A',
    direccion: 'C/MANUEL FERNANDEZ MARQUEZ, 30',
    codigo_postal: '08918',
    ciudad: 'Badalona',
    provincia: 'Barcelona',
    email_principal: 'alex@framan.es',
    telefono_principal: '932081890',
    tipo_cliente: 'empresa',
  },
]

async function run() {
  console.log('Insertando clientes comunes (Yenifer + Edison)...')
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
      { cliente_id: inserted.id, empresa_id: EMPRESA_EDISON },
      { cliente_id: inserted.id, empresa_id: EMPRESA_YENIFER },
    ])
    console.log('   +', c.nombre_fiscal)
  }
  console.log('Listo. 4 clientes insertados (comunes Yenifer + Edison).')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
