/**
 * Importa facturas históricas desde un JSON (ej. data/facturas-historicas/facturas-enero-2026.json)
 * a la base de datos. Crea factura (externa), líneas, pago y registro de email si aplica.
 * Sube los PDFs indicados en archivo_pdf a Storage (facturas-externas) y asigna archivo_url.
 * Tras importar, sincroniza numero_actual de cada serie con el máximo de facturas emitidas/pagadas.
 *
 * Uso: node scripts/importar-facturas-historicas.mjs <ruta-json> [carpeta-pdfs]
 * Ejemplo: node scripts/importar-facturas-historicas.mjs data/facturas-historicas/facturas-enero-2026.json data/facturas-historicas
 *
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Cargar .env.local (sin dotenv: leer manualmente)
try {
  const envPath = join(root, '.env.local')
  const env = readFileSync(envPath, 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^["']|["']$/g, '').replace(/\r$/, '')
      if (key) process.env[key] = val
    }
  }
} catch (_) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

// Resolver empresa por nombre o id
async function resolveEmpresa(empresaRef) {
  const id = typeof empresaRef === 'string' && empresaRef.length === 36 && empresaRef.includes('-')
    ? empresaRef
    : null
  if (id) {
    const { data } = await supabase.from('empresas').select('id').eq('id', id).single()
    return data?.id ?? null
  }
  const nombre = String(empresaRef || '').trim().toLowerCase()
  if (!nombre) return null
  const { data: list } = await supabase
    .from('empresas')
    .select('id, razon_social, nombre_comercial')
    .or(`razon_social.ilike.%${nombre}%,nombre_comercial.ilike.%${nombre}%`)
  if (!list?.length) return null
  // Preferir coincidencia exacta o que contenga el nombre
  const match = list.find(
    (e) =>
      (e.nombre_comercial || '').toLowerCase().includes(nombre) ||
      (e.razon_social || '').toLowerCase().includes(nombre)
  )
  return match ? match.id : list[0].id
}

// Resolver cliente por CIF o nombre fiscal, asociado a la empresa
async function resolveCliente(empresaId, clienteRef) {
  const q = String(clienteRef || '').trim()
  if (!q) return null
  const isCif = /^[A-Z0-9]{8,}$/i.test(q.replace(/\s|-|\./g, ''))
  let clientes
  if (isCif) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .ilike('cif', `%${q}%`)
      .limit(5)
    clientes = data || []
  } else {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .or(`nombre_fiscal.ilike.%${q}%,nombre_comercial.ilike.%${q}%`)
      .limit(10)
    clientes = data || []
  }
  if (!clientes.length) return null
  const ids = clientes.map((c) => c.id)
  const { data: ce } = await supabase
    .from('clientes_empresas')
    .select('cliente_id')
    .eq('empresa_id', empresaId)
    .in('cliente_id', ids)
    .limit(1)
  if (ce?.length) return ce[0].cliente_id
  return ids[0]
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

/** Solo la parte numérica con ceros (ej. 0001). En BD se guarda esto; la UI muestra serie + '-' + numero. */
function formatearNumeroSolo(num, digitos) {
  const d = Number(digitos) || 4
  return String(num).padStart(d, '0')
}

const BUCKET_PDF = 'facturas-externas'

// Código de serie por empresa para facturas históricas (como en el programa)
const SERIE_POR_EMPRESA = {
  Edison: 'E2026',
  Yenifer: 'Y2026',
  Villegas: 'F2026',
}

/**
 * Sincroniza numero_actual de cada serie con el máximo de facturas emitidas/pagadas.
 * Evita desfases cuando se importan facturas externas sin pasar por obtener_siguiente_numero_serie.
 */
async function sincronizarNumeroActualSeries(supabase) {
  const { data: series } = await supabase
    .from('series_facturacion')
    .select('id, codigo, numero_inicial, numero_actual')
  if (!series?.length) return

  for (const s of series) {
    const { data: facturas } = await supabase
      .from('facturas')
      .select('numero')
      .eq('serie_id', s.id)
      .in('estado', ['emitida', 'pagada'])

    let maxNum = 0
    for (const f of facturas || []) {
      const numStr = String(f.numero || '').replace(/\D/g, '')
      const n = numStr ? parseInt(numStr, 10) : 0
      if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n)
    }
    const siguiente = Math.max((s.numero_actual ?? s.numero_inicial ?? 1), maxNum + 1, s.numero_inicial ?? 1)
    const { error } = await supabase
      .from('series_facturacion')
      .update({ numero_actual: siguiente })
      .eq('id', s.id)
    if (!error) {
      console.log(`Serie ${s.codigo}: siguiente número = ${siguiente}`)
    }
  }
}

/** Sube un PDF a Storage y devuelve la URL pública, o null si falla. */
async function subirPdfFactura(supabase, facturaId, pdfPath) {
  if (!pdfPath || !existsSync(pdfPath)) return null
  try {
    const buf = readFileSync(pdfPath)
    const fileName = `facturas/historicas/${facturaId}.pdf`
    const { error } = await supabase.storage.from(BUCKET_PDF).upload(fileName, buf, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (error) {
      console.warn('  Subida PDF:', error.message)
      return null
    }
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_PDF).getPublicUrl(fileName)
    return publicUrl
  } catch (e) {
    console.warn('  PDF:', e.message)
    return null
  }
}

export async function importarFacturas(jsonPath, carpetaPdfs = null) {
  const pathAbs = resolve(root, jsonPath)
  const raw = readFileSync(pathAbs, 'utf8')
  const json = JSON.parse(raw)
  const facturas = json.facturas || []
  if (!facturas.length) {
    console.log('No hay facturas en el JSON.')
    return { ok: 0, err: 0, ids: [] }
  }

  const basePdfs = carpetaPdfs ? resolve(root, carpetaPdfs) : resolve(pathAbs, '..')

  // Obtener series (codigo, digitos, id) por empresa para mostrar número correcto en el programa
  const { data: seriesList } = await supabase
    .from('series_facturacion')
    .select('id, empresa_id, codigo, digitos')
    .in('codigo', ['E2026', 'Y2026', 'F2026'])
  const seriesPorEmpresaId = {}
  for (const s of seriesList || []) {
    seriesPorEmpresaId[s.empresa_id] = { serie_id: s.id, codigo: s.codigo, digitos: s.digitos ?? 4 }
  }
  // Siguiente número a asignar por empresa (en programa): Edison 1, Yenifer 1, Villegas 4
  const siguientePorEmpresa = {}
  for (const f of facturas) {
    const empId = await resolveEmpresa(f.empresa)
    if (empId && siguientePorEmpresa[empId] == null) {
      const codigo = SERIE_POR_EMPRESA[f.empresa] || 'F2026'
      siguientePorEmpresa[empId] = codigo === 'F2026' ? 4 : 1
    }
  }

  let ok = 0
  let err = 0
  const ids = []

  for (let i = 0; i < facturas.length; i++) {
    const f = facturas[i]
    const empresaId = await resolveEmpresa(f.empresa)
    if (!empresaId) {
      console.error(`[${i + 1}] Empresa no encontrada: ${f.empresa}`)
      err++
      continue
    }
    const clienteId = await resolveCliente(empresaId, f.cliente)
    if (!clienteId) {
      console.error(`[${i + 1}] Cliente no encontrado para empresa: ${f.cliente}`)
      err++
      continue
    }

    const fechaEmision = parseDate(f.fecha_emision) || new Date().toISOString().split('T')[0]
    const fechaVenc = parseDate(f.fecha_vencimiento) || fechaEmision
    const total = Number(f.total) || 0
    const importeDescuento = Number(f.importe_descuento) ?? 0
    const importeRetencion = Number(f.importe_retencion) ?? 0
    const retencionPorcentaje = Number(f.retencion_porcentaje) ?? 0
    const descuentoTipo = f.descuento_tipo || 'porcentaje'
    const descuentoValor = Number(f.descuento_valor) ?? 0
    let baseImponible = Number(f.base_imponible)
    let iva = Number(f.iva)
    if (Number.isNaN(baseImponible) || Number.isNaN(iva)) {
      baseImponible = Number.isNaN(baseImponible) ? (f.iva_porcentaje ? total / (1 + f.iva_porcentaje / 100) : total) : baseImponible
      iva = Number.isNaN(iva) ? total - baseImponible : iva
    }
    const lineas = Array.isArray(f.lineas) ? f.lineas : []
    const subtotal = lineas.length
      ? lineas.reduce((s, l) => s + (Number(l.subtotal) || 0), 0)
      : baseImponible

    const serieInfo = seriesPorEmpresaId[empresaId]
    const codigo = serieInfo?.codigo || SERIE_POR_EMPRESA[f.empresa] || 'F2026'
    const digitos = serieInfo?.digitos ?? 4

    // Solo facturas de Villegas para cliente JS Trans (B67181768) son externas; el resto internas.
    const clienteRef = String(f.cliente || '').toUpperCase()
    const esJstrans = clienteRef === 'B67181768' || clienteRef.includes('JSTRANS')
    const esExterna = f.empresa === 'Villegas' && esJstrans

    // Si hay numero_manual (externas o históricas internas), usarlo; si no, usar siguiente de la serie
    let numeroSolo
    if (f.numero_manual) {
      const numManual = String(f.numero_manual).replace(/^[A-Za-z0-9]+-/, '') // quitar prefijo F2026- si existe
      numeroSolo = formatearNumeroSolo(numManual, digitos)
    } else {
      const numDisplay = siguientePorEmpresa[empresaId] ?? 1
      numeroSolo = formatearNumeroSolo(numDisplay, digitos)
      if (siguientePorEmpresa[empresaId] != null) siguientePorEmpresa[empresaId]++
    }

    const { data: factura, error: eFactura } = await supabase
      .from('facturas')
      .insert({
        empresa_id: empresaId,
        cliente_id: clienteId,
        numero: numeroSolo,
        serie: codigo,
        serie_id: serieInfo?.serie_id || null,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVenc,
        subtotal,
        base_imponible: baseImponible,
        iva,
        total,
        descuento_tipo: descuentoTipo,
        descuento_valor: descuentoValor,
        importe_descuento: importeDescuento,
        retencion_porcentaje: retencionPorcentaje,
        importe_retencion: importeRetencion,
        estado: f.pagada ? 'pagada' : 'emitida',
        divisa: 'EUR',
        es_externa: esExterna,
        numero_manual: f.numero_manual || null,
        fecha_pago: f.pagada && f.fecha_pago ? parseDate(f.fecha_pago) : null,
        pagado: f.pagada ? total : null,
        notas: f.notas || null,
      })
      .select('id')
      .single()

    if (eFactura || !factura) {
      console.error(`[${i + 1}] Error creando factura:`, eFactura?.message)
      err++
      continue
    }

    ids.push(factura.id)

    for (const l of lineas) {
      await supabase.from('lineas_factura').insert({
        factura_id: factura.id,
        concepto: l.concepto || 'Línea',
        descripcion: l.descripcion || null,
        cantidad: Number(l.cantidad) || 1,
        precio_unitario: Number(l.precio_unitario) || 0,
        iva_porcentaje: Number(l.iva_porcentaje) ?? 21,
        subtotal: Number(l.subtotal) || 0,
      })
    }

    if (f.pagada && total > 0) {
      const fechaPago = parseDate(f.fecha_pago) || fechaEmision
      await supabase.from('pagos_factura').insert({
        factura_id: factura.id,
        empresa_id: empresaId,
        importe: total,
        fecha_pago: fechaPago,
        metodo_pago: f.metodo_pago || 'Transferencia',
        referencia: f.referencia_pago || null,
      })
      await supabase.from('pagos').insert({
        factura_id: factura.id,
        empresa_id: empresaId,
        importe: total,
        fecha_pago: fechaPago,
        metodo_pago: f.metodo_pago || 'Transferencia',
        referencia: f.referencia_pago || null,
        conciliado: false,
        anulado: false,
      })
      await supabase.from('facturas').update({
        estado: 'pagada',
        pagado: total,
        fecha_pago: fechaPago,
      }).eq('id', factura.id)
    }

    if (f.enviada && f.email_enviado_a) {
      const para = Array.isArray(f.email_enviado_a) ? f.email_enviado_a : [f.email_enviado_a]
      await supabase.from('emails_factura').insert({
        factura_id: factura.id,
        empresa_id: empresaId,
        para,
        asunto: `Factura ${f.numero_manual || factura.id}`,
        mensaje: 'Factura enviada (importación histórica).',
        estado: 'enviado',
        enviado_at: new Date().toISOString(),
      })
    }

    if (f.archivo_pdf) {
      const pdfPath = join(basePdfs, f.archivo_pdf)
      const archivoUrl = await subirPdfFactura(supabase, factura.id, pdfPath)
      if (archivoUrl) {
        await supabase.from('facturas').update({ archivo_url: archivoUrl }).eq('id', factura.id)
        console.log(`  PDF subido: ${f.archivo_pdf}`)
      }
    }

    // Para facturas externas: forzar totales del PDF (pueden haberse recalculado desde líneas)
    if (esExterna && (f.base_imponible != null || f.iva != null || f.total != null)) {
      const fix = {}
      if (Number(f.base_imponible)) fix.base_imponible = Number(f.base_imponible)
      if (Number(f.iva)) fix.iva = Number(f.iva)
      if (Number(f.total)) fix.total = Number(f.total)
      if (Number(f.importe_retencion)) fix.importe_retencion = Number(f.importe_retencion)
      if (Object.keys(fix).length) {
        await supabase.from('facturas').update(fix).eq('id', factura.id)
      }
    }

    ok++
    console.log(`[${i + 1}] OK: ${codigo}-${numeroSolo} (original: ${f.numero_manual}) -> ${factura.id}`)
  }

  // Sincronizar numero_actual de todas las series con el máximo de facturas emitidas/pagadas.
  // Evita que facturas externas importadas dejen el contador desincronizado.
  await sincronizarNumeroActualSeries(supabase)

  return { ok, err, ids }
}

const file = process.argv[2]
const carpetaPdfs = process.argv[3] || null
if (!file) {
  console.log('Uso: node scripts/importar-facturas-historicas.mjs <ruta-al-json> [carpeta-pdfs]')
  console.log('Ejemplo: node scripts/importar-facturas-historicas.mjs data/facturas-historicas/facturas-enero-2026.json data/facturas-historicas')
  process.exit(1)
}

importarFacturas(file, carpetaPdfs)
  .then(({ ok, err, ids }) => {
    console.log(`\nHecho: ${ok} facturas importadas, ${err} errores.`)
    if (ids.length) console.log('IDs:', ids.join(', '))
    process.exit(err > 0 ? 1 : 0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
