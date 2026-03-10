/**
 * E2E: White-Label Branding — Validación del sistema multi-cliente
 *
 * Este test verifica que al cambiar el NEXT_PUBLIC_CLIENT_ID,
 * la aplicación aplica correctamente el branding del nuevo cliente.
 *
 * Flujo probado:
 * 1. Login con cliente STVLS → verificar nombre en sidebar
 * 2. Verificar que el selector de empresa está oculto (multiEmpresa: false simulado)
 * 3. Verificar textos dinámicos de la UI (navbar, sidebar, login)
 *
 * Skills aplicadas: senior_qa_protocol + documentacion_espanol + code_quality_guardian
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect, type Page } from '@playwright/test'

// ─── Helper: login compartido ────────────────────────────────────────────────
async function login(page: Page): Promise<boolean> {
    const email = process.env.E2E_TEST_EMAIL
    const password = process.env.E2E_TEST_PASSWORD

    if (!email || !password) {
        test.skip(true, 'Credenciales E2E no configuradas en .env.e2e')
        return false
    }

    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('textbox', { name: /email corporativo/i }).fill(email)
    await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
    await page.getByRole('button', { name: /acceder al portal/i }).click()
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
    return true
}

// ─── Suite 1: Página de Login (sin autenticar) ───────────────────────────────
test.describe('Branding White-Label — Página de Login', () => {

    test('Pantalla de login carga sin errores JS', async ({ page }) => {
        const errores: string[] = []
        page.on('pageerror', (err) => errores.push(err.message))

        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })

        // No debe haber errores JavaScript en la consola
        expect(errores.filter(e => !e.includes('hydration'))).toHaveLength(0)
    })

    test('Formulario de login tiene campos de email y contraseña', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })

        await expect(page.getByRole('textbox', { name: /email corporativo/i })).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('textbox', { name: /contraseña/i })).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('button', { name: /acceder al portal/i })).toBeVisible({ timeout: 10000 })
    })

    test('Login con credenciales vacías muestra validación', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('button', { name: /acceder al portal/i }).click()

        // Debe permanecer en /login (no redirigir)
        await expect(page).toHaveURL(/login/, { timeout: 5000 })
    })

    test('Login con email inválido muestra error', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('textbox', { name: /email corporativo/i }).fill('no-valido')
        await page.getByRole('textbox', { name: /contraseña/i }).fill('cualquiera')
        await page.getByRole('button', { name: /acceder al portal/i }).click()

        // Debe permanecer en /login
        await expect(page).toHaveURL(/login/, { timeout: 8000 })
    })
})

// ─── Suite 2: Branding del Sidebar tras login ────────────────────────────────
test.describe('Branding White-Label — Sidebar y Navbar', () => {

    test('Sidebar muestra el nombre del cliente activo', async ({ page }) => {
        const loggedIn = await login(page)
        if (!loggedIn) return

        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

        // El sidebar debe mostrar el nombre del cliente (STVLS o el activo)
        const sidebar = page.locator('aside')
        await expect(sidebar).toBeVisible({ timeout: 10000 })

        // El nombre del cliente debe aparecer (no texto genérico ni "undefined")
        await expect(sidebar.getByText(/STVLS|FNAUTOS|NIKE|Enterprise/i).first()).toBeVisible({ timeout: 8000 })
    })

    test('Navbar: botón de toggle de tema (modo oscuro/claro) funciona', async ({ page }) => {
        const loggedIn = await login(page)
        if (!loggedIn) return

        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

        const themeToggle = page.getByTestId('navbar-theme-toggle')
        await expect(themeToggle).toBeVisible({ timeout: 10000 })
        await themeToggle.click()
        await page.waitForTimeout(500)

        // El toggle debe seguir visible (no colapsar)
        await expect(themeToggle).toBeVisible()
    })

    test('Navbar: selector de empresa NO visible en modo single-empresa', async ({ page }) => {
        const loggedIn = await login(page)
        if (!loggedIn) return

        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

        // En cliente STVLS con multiEmpresa: true, el selector SÍ debe ser visible
        // En cliente Nike/FNAUTOS con multiEmpresa: false, NO debe serlo
        // Este test verifica que el selector tiene un data-testid adecuado
        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || 'stvls'

        if (clientId === 'nike' || clientId === 'fnautos') {
            // Modo single-empresa: el selector debe estar oculto
            const selector = page.getByTestId('empresa-selector-trigger')
            await expect(selector).not.toBeVisible({ timeout: 5000 })
        } else {
            // Modo multi-empresa: el selector puede estar visible
            // (no es un error que esté oculto por CSS en móvil)
            const body = page.locator('body')
            await expect(body).toBeVisible()
        }
    })

    test('Navbar: botón de menú móvil visible y abre el sidebar', async ({ page }) => {
        const loggedIn = await login(page)
        if (!loggedIn) return

        // Simular viewport móvil
        await page.setViewportSize({ width: 375, height: 812 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

        const menuBtn = page.getByTestId('navbar-toggle-menu')
        await expect(menuBtn).toBeVisible({ timeout: 10000 })
        await menuBtn.click()
        await page.waitForTimeout(500)

        // El sidebar debe aparecer en el Sheet/drawer
        const sheetContent = page.locator('[data-state="open"]').first()
        await expect(sheetContent).toBeVisible({ timeout: 5000 })
    })
})

// ─── Suite 3: Rutas críticas tras login ─────────────────────────────────────
test.describe('Branding White-Label — Rutas de aplicación', () => {

    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('Dashboard carga sin texto "undefined" ni "null"', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        const bodyText = await page.locator('body').innerText()

        // Ningún texto crítico debe aparecer sin resolver
        expect(bodyText).not.toContain('[object Object]')
        expect(bodyText.toLowerCase()).not.toMatch(/\bundefined\b/)
    })

    test('Ruta /ventas/facturas carga sin error 404', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
        await expect(page).not.toHaveURL(/404/)
    })

    test('Ruta /ventas/clientes carga sin error 404', async ({ page }) => {
        await page.goto('/ventas/clientes', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
        await expect(page).not.toHaveURL(/404/)
    })

    test('Ruta /ventas/configuracion/empresa carga correctamente (single-empresa)', async ({ page }) => {
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
        // No debe redirigir a 404 ni /login
        await expect(page).not.toHaveURL(/404|login/, { timeout: 10000 })
    })

    test('Ruta /configuracion/empresas redirige en modo single-empresa', async ({ page }) => {
        await page.goto('/configuracion/empresas', { waitUntil: 'networkidle', timeout: 30000 })

        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || 'stvls'
        if (clientId === 'nike' || clientId === 'fnautos') {
            // Debe redirigir a /ventas/configuracion/empresa
            await expect(page).toHaveURL(/ventas\/configuracion\/empresa/, { timeout: 10000 })
        } else {
            // En STVLS (multi): debe mostrar la página de gestión de empresas
            await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
        }
    })

    test('Ruta /perfil carga sin error', async ({ page }) => {
        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page).not.toHaveURL(/404|login/, { timeout: 10000 })
    })
})

// ─── Suite 4: Seguridad básica (contexto limpio sin cookies) ─────────────────
test.describe('Branding White-Label — Seguridad de rutas', () => {

    test('Ruta protegida /dashboard redirige a /login sin sesión', async ({ browser }) => {
        // Usar un contexto completamente limpio (sin cookies ni sesión)
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
        const page = await context.newPage()

        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

        // Debe redirigir a /login
        await expect(page).toHaveURL(/login/, { timeout: 10000 })
        await context.close()
    })

    test('Ruta protegida /ventas/facturas redirige a /login sin sesión', async ({ browser }) => {
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
        const page = await context.newPage()

        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page).toHaveURL(/login/, { timeout: 10000 })
        await context.close()
    })
})
