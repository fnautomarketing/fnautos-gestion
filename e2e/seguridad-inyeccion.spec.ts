/**
 * E2E: Seguridad – sanitización de búsqueda (VER-004)
 * Inputs con caracteres especiales no deben romper la app
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
    const email = process.env.E2E_TEST_EMAIL
    const password = process.env.E2E_TEST_PASSWORD
    if (!email || !password) {
        test.skip(true, 'Credenciales E2E no configuradas')
        return
    }
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })
    await page.getByRole('textbox', { name: /email corporativo|usuario@|email/i }).fill(email)
    await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
    await page.getByRole('button', { name: /acceder al portal|iniciar|entrar/i }).click()
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 25000 })
}

test.describe('Seguridad: Inyección en búsquedas', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1500)
    })

    test('VER-004: Búsqueda con % no rompe la página de clientes', async ({ page }) => {
        await page.goto('/ventas/clientes?search=%25test%25', {
            waitUntil: 'networkidle',
            timeout: 15000,
        })
        await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible({ timeout: 5000 })
    })

    test('VER-004: Búsqueda con comillas no rompe la página', async ({ page }) => {
        await page.goto("/ventas/clientes?search=test'OR'1'='1", {
            waitUntil: 'networkidle',
            timeout: 15000,
        })
        await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible({ timeout: 5000 })
    })
})
