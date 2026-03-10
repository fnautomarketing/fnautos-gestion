/**
 * Tests E2E: Descarga de PDF de datos fiscales por empresa
 * Configuración › Empresa → botón "Descargar datos fiscales"
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
        test.skip()
        return
    }
    await page.goto('/login')
    await page.getByPlaceholder(/usuario@|email/i).fill(email)
    await page.getByPlaceholder(/••••/).fill(password)
    await page.getByRole('button', { name: /acceder al portal|iniciar|entrar/i }).click()
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 25000 })
    if (page.url().includes('login')) {
        throw new Error('Login falló')
    }
}

test.describe('Descarga PDF datos fiscales', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1500)
    })

    test('página Configuración Empresa muestra botón Descargar datos fiscales', async ({ page }) => {
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 20000 })
        const btn = page.getByTestId('btn-descargar-datos-fiscales')
        await expect(btn).toBeVisible({ timeout: 10000 })
        await expect(btn).toContainText(/descargar datos fiscales/i)
    })

    test('al hacer clic en Descargar datos fiscales se descarga un PDF', async ({ page }) => {
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 20000 })
        const btn = page.getByTestId('btn-descargar-datos-fiscales')
        await expect(btn).toBeVisible({ timeout: 10000 })

        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 30000 }),
            btn.click(),
        ])
        expect(download.suggestedFilename()).toMatch(/Datos-fiscales-.+\.pdf$/i)
        const filePath = await download.path()
        expect(filePath).toBeTruthy()
        const fs = await import('fs')
        const stat = fs.statSync(filePath)
        expect(stat.size).toBeGreaterThan(500)
    })
})
