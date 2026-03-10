#!/usr/bin/env node
/**
 * Crea un PDF mínimo de prueba y lo guarda como temp-factura.pdf
 * Ejecutar: node scripts/create-minimal-pdf.mjs
 */
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n',
  'utf-8'
)

const outPath = join(__dirname, '..', 'temp-factura.pdf')
writeFileSync(outPath, MINIMAL_PDF)
console.log('PDF guardado en:', outPath)
