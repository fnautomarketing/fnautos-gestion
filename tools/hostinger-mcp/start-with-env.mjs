/**
 * Wrapper para Hostinger API MCP que carga el token desde .env.local
 * Uso: node tools/hostinger-mcp/start-with-env.mjs
 * Requiere: HOSTINGER_API_TOKEN en .env.local
 * Obtener token: https://hpanel.hostinger.com
 */
import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0) {
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (key && !process.env[key]) process.env[key] = val
    }
  }
}

// Hostinger MCP usa API_TOKEN; soportamos HOSTINGER_API_TOKEN o API_TOKEN
const token = process.env.HOSTINGER_API_TOKEN || process.env.API_TOKEN
if (token) process.env.API_TOKEN = token

// Ejecutar paquete local (evita npx en PATH)
const mcpPath = join(resolve(__dirname, '..', '..'), 'node_modules', 'hostinger-api-mcp', 'server.js')
const child = spawn(process.execPath, [mcpPath], {
  stdio: 'inherit',
  env: { ...process.env },
})
child.on('close', (code) => process.exit(code ?? 0))
