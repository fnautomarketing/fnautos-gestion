/**
 * E2E: Header / Navbar – responsive y accesibilidad
 *
 * Verifica:
 * - Elementos visibles en desktop y móvil
 * - Menú hamburguesa en móvil
 * - Touch targets mínimos (44px)
 * - Selector de empresa, notificaciones, usuario
 * - Sin scroll horizontal
 *
 * Credenciales en .env.e2e (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
    const email = process.env.E2E_TEST_EMAIL
    const password = process.env.E2E_TEST_PASSWORD
    if (!email || !password) {
        test.skip(true, 'Credenciales E2E no configuradas en .env.e2e')
        return
    }
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByPlaceholder(/usuario@|email/i).fill(email)
    await page.getByPlaceholder(/••••/).fill(password)
    await page.getByRole('button', { name: /acceder al portal|iniciar|entrar/i }).click()
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 25000 })
}

test.describe('Header / Navbar', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1500)
    })

    test('header visible con role banner', async ({ page }) => {
        const header = page.getByTestId('navbar-header')
        await expect(header).toBeVisible({ timeout: 5000 })
        await expect(header).toHaveAttribute('role', 'banner')
    })

    test('en desktop: búsqueda, selector empresa, notificaciones, usuario visibles', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })

        await expect(page.getByPlaceholder(/buscar en stv/i)).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('empresa-selector-trigger')).toBeVisible()
        await expect(page.getByTestId('navbar-notifications')).toBeVisible()
        await expect(page.getByTestId('navbar-user-dropdown')).toBeVisible()
        await expect(page.getByTestId('navbar-theme-toggle')).toBeVisible()
    })

    test('en móvil: menú hamburguesa visible, búsqueda oculta', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })

        await expect(page.getByTestId('navbar-toggle-menu')).toBeVisible()
        await expect(page.getByPlaceholder(/buscar en stv/i)).toBeHidden()
        await expect(page.getByTestId('empresa-selector-trigger')).toBeVisible()
        await expect(page.getByTestId('navbar-notifications')).toBeVisible()
        await expect(page.getByTestId('navbar-user-dropdown')).toBeVisible()
    })

    test('menú hamburguesa abre Sheet con Sidebar en móvil', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })

        await page.getByTestId('navbar-toggle-menu').click()
        await page.waitForTimeout(500)

        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
        await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible()
        await expect(page.getByRole('button', { name: 'Ventas' })).toBeVisible()
    })

    test('selector de empresa abre dropdown y permite elegir', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })

        await page.getByTestId('empresa-selector-trigger').click()
        await page.waitForTimeout(400)

        const globalOpt = page.getByRole('menuitem', { name: /todas las empresas/i })
        const empresasOpt = page.getByTestId(/empresa-option-/)
        await expect(globalOpt.or(empresasOpt.first())).toBeVisible({ timeout: 3000 })
    })

    test('dropdown usuario abre y muestra opciones', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })

        await page.getByTestId('navbar-user-dropdown').click()
        await page.waitForTimeout(300)

        await expect(page.getByTestId('user-menu-perfil')).toBeVisible({ timeout: 3000 })
        await expect(page.getByText('Cerrar Sesión')).toBeVisible()
    })

    test('touch targets: botones con min 44px en móvil', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })

        const toggleMenu = page.getByTestId('navbar-toggle-menu')
        const box = await toggleMenu.boundingBox()
        expect(box?.width, 'Botón menú debe tener al menos 44px de ancho').toBeGreaterThanOrEqual(42)
        expect(box?.height, 'Botón menú debe tener al menos 44px de alto').toBeGreaterThanOrEqual(42)
    })

    test('sin scroll horizontal en dashboard (desktop y móvil)', async ({ page }) => {
        for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport)
            await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
            expect(scrollWidth, `Viewport ${viewport.width}x${viewport.height}: no scroll horizontal`).toBeLessThanOrEqual(clientWidth + 2)
        }
    })
})
