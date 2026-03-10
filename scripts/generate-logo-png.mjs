#!/usr/bin/env node
/**
 * Genera logo-stv.png y favicon.ico desde logo-stv.svg.
 * Uso: node scripts/generate-logo-png.mjs
 */
import sharp from 'sharp'
import ico from 'sharp-ico'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'logo-stv.svg')
const pngPath = join(root, 'public', 'logo-stv.png')
const icoPath = join(root, 'public', 'favicon.ico')

if (!existsSync(svgPath)) {
  console.error('No existe public/logo-stv.svg')
  process.exit(1)
}

const svg = readFileSync(svgPath)
// fit: 'cover' = logo llena todo el espacio, sin padding (máximo tamaño visible)
await sharp(svg).resize(512, 512, { fit: 'cover' }).png().toFile(pngPath)
console.log('✓ Generado public/logo-stv.png (512x512)')

const sizes = [256, 128, 64, 48, 32, 16]
const sharps = sizes.map((s) => sharp(svg).resize(s, s, { fit: 'cover' }))
await ico.sharpsToIco(sharps, icoPath, { sizes })
console.log('✓ Generado public/favicon.ico')
