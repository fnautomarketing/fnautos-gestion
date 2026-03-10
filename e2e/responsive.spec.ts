/**
 * E2E: Comprobaciones responsive
 *
 * Verifica que no haya scroll horizontal en viewports móvil, tablet y desktop.
 * Se ejecuta en los proyectos desktop, mobile y tablet (playwright.config).
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect, type Page } from '@playwright/test'

async function assertNoHorizontalScroll(page: Page, label: string) {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth, `${label}: no debe haber scroll horizontal (scrollWidth=${scrollWidth} <= clientWidth=${clientWidth})`).toBeLessThanOrEqual(clientWidth + 1)
}

test.describe('Responsive: sin scroll horizontal', () => {
    test('Login: página de login sin desborde horizontal', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByRole('button', { name: /acceder al portal/i })).toBeVisible({ timeout: 5000 })
        await assertNoHorizontalScroll(page, 'Login')
    })

    test('Dashboard (autenticado): sin desborde horizontal', async ({ page }) => {
        const email = process.env.E2E_TEST_EMAIL
        const password = process.env.E2E_TEST_PASSWORD
        if (!email || !password) {
            test.skip(true, 'Credenciales E2E no configuradas en .env.e2e')
            return
        }
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('textbox', { name: /email corporativo/i }).fill(email)
        await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
        await page.getByRole('button', { name: /acceder al portal/i }).click()
        await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
        await assertNoHorizontalScroll(page, 'Dashboard')
    })

    test('Facturas (autenticado): listado sin desborde horizontal', async ({ page }) => {
        const email = process.env.E2E_TEST_EMAIL
        const password = process.env.E2E_TEST_PASSWORD
        if (!email || !password) {
            test.skip(true, 'Credenciales E2E no configuradas en .env.e2e')
            return
        }
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('textbox', { name: /email corporativo/i }).fill(email)
        await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
        await page.getByRole('button', { name: /acceder al portal/i }).click()
        await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 15000 })
        await assertNoHorizontalScroll(page, 'Facturas')
    })

    test('Informes (autenticado): sin desborde horizontal', async ({ page }) => {
        const email = process.env.E2E_TEST_EMAIL
        const password = process.env.E2E_TEST_PASSWORD
        if (!email || !password) {
            test.skip(true, 'Credenciales E2E no configuradas en .env.e2e')
            return
        }
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('textbox', { name: /email corporativo/i }).fill(email)
        await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
        await page.getByRole('button', { name: /acceder al portal/i }).click()
        await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 15000 })
        await expect(page.getByRole('heading', { name: /informes y analítica/i })).toBeVisible({ timeout: 8000 })
        await assertNoHorizontalScroll(page, 'Informes')
    })

    test('Informes: filtros Empresa y Cliente visibles y sin desborde', async ({ page }) => {
        const email = process.env.E2E_TEST_EMAIL
        const password = process.env.E2E_TEST_PASSWORD
        if (!email || !password) {
            test.skip(true, 'Credenciales E2E no configuradas en .env.e2e')
            return
        }
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('textbox', { name: /email corporativo/i }).fill(email)
        await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
        await page.getByRole('button', { name: /acceder al portal/i }).click()
        await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 15000 })
        await expect(page.getByRole('heading', { name: /informes y analítica/i })).toBeVisible({ timeout: 8000 })
        await expect(page.getByText('Empresa', { exact: false })).toBeVisible({ timeout: 5000 })
        await expect(page.getByText('Cliente', { exact: false })).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('informes-filter-empresa')).toBeVisible()
        await expect(page.getByTestId('informes-filter-cliente')).toBeVisible()
        await assertNoHorizontalScroll(page, 'Informes con filtros')
    })
})
