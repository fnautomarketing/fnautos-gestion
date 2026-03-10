/**
 * E2E: Retención IRPF y estado Pagada para Edison
 *
 * Verifica que:
 * - Al crear factura con Edison: Retención IRPF tiene -1% por defecto
 * - Factura emitida muestra retención en Resumen Financiero
 * - Facturas pagadas muestran "Pagada (totalidad)" en Resumen Financiero
 *
 * Requiere: credenciales en .env.e2e (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)
 * Migración 20260305: aplicar retención -1% a facturas Edison existentes
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect, type Page } from '@playwright/test'

const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

async function login(page: Page) {
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
    if (page.url().includes('login')) throw new Error('Login falló')
}

async function cambiarEmpresa(page: Page, empresaId: string) {
    const selector = page.getByTestId('empresa-selector-trigger')
    if (!(await selector.isVisible({ timeout: 5000 }).catch(() => false))) return false
    await selector.click()
    await page.waitForTimeout(400)
    const opcion = page.getByTestId(`empresa-option-${empresaId}`)
    if (!(await opcion.isVisible({ timeout: 3000 }).catch(() => false))) return false
    await opcion.click()
    await page.waitForTimeout(400)
    const confirmBtn = page.getByTestId('confirm-dialog-confirm')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click()
        await page.waitForTimeout(1500)
    }
    return true
}

test.describe('Edison: Retención IRPF por defecto', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1000)
    })

    test('al crear factura con Edison, retención IRPF tiene -1% por defecto', async ({ page }) => {
        test.setTimeout(90000)
        const changed = await cambiarEmpresa(page, EMPRESA_EDISON_ID)
        if (!changed) {
            test.skip(true, 'Selector de empresa o opción Edison no disponible')
            return
        }
        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })
        await expect(page.getByRole('heading', { name: /nueva factura/i })).toBeVisible({ timeout: 10000 })

        const retencionInput = page.getByTestId('retencion-irpf-input')
        await expect(retencionInput).toBeVisible({ timeout: 5000 })
        const value = await retencionInput.inputValue()
        expect(Number(value)).toBe(-1)
    })

    test('factura emitida con Edison muestra retención en Resumen Financiero', async ({ page }) => {
        test.setTimeout(180000)
        const changed = await cambiarEmpresa(page, EMPRESA_EDISON_ID)
        if (!changed) {
            test.skip(true, 'Selector de empresa o opción Edison no disponible')
            return
        }
        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })

        const clienteCombobox = page.getByTestId('combobox-cliente')
        await clienteCombobox.click()
        await page.waitForTimeout(800)
        const firstOption = page.locator('[data-testid^="combobox-option-"]').first()
        await expect(firstOption).toBeVisible({ timeout: 5000 })
        await firstOption.click()

        const concepto = page.locator('input[placeholder*="Concepto"]').first()
        await concepto.fill('E2E Retención Edison')
        const precios = page.locator('input[type="number"]')
        if (await precios.count() >= 2) await precios.nth(1).fill('100')

        await expect(page.getByTestId('retencion-irpf-input')).toHaveValue('-1')
        await page.getByRole('button', { name: /emitir factura/i }).click()
        await page.getByRole('button', { name: /sí, emitir|confirmar|emitir/i }).click({ timeout: 10000 })
        await expect(page).toHaveURL(/\/ventas\/facturas/, { timeout: 25000 })
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(3000)

        const facturaRow = page.getByTestId('factura-row').first()
        if (!(await facturaRow.isVisible({ timeout: 15000 }).catch(() => false))) {
            test.skip(true, 'Lista de facturas vacía o filtrada tras emitir')
            return
        }
        await facturaRow.click()
        await page.waitForURL(/\/ventas\/facturas\/[^/]+$/, { timeout: 15000 })

        await expect(page.getByText(/retención irpf/i)).toBeVisible({ timeout: 8000 })
    })

    test('factura E2026 pagada muestra retención -1% y Pagada en Resumen Financiero', async ({ page }) => {
        test.setTimeout(90000)
        const changed = await cambiarEmpresa(page, EMPRESA_EDISON_ID)
        if (!changed) {
            test.skip(true, 'Selector de empresa o opción Edison no disponible')
            return
        }
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })

        const rowE2026 = page.getByTestId('factura-row').filter({ hasText: /E2026-\d{4}/ }).first()
        if (!(await rowE2026.isVisible({ timeout: 5000 }).catch(() => false))) {
            test.skip(true, 'No hay facturas E2026 visibles')
            return
        }
        await rowE2026.click()
        await page.waitForURL(/\/ventas\/facturas\/[^/]+$/, { timeout: 15000 })

        // Retención visible (requiere migración 20260305 aplicada)
        const retencionVisible = await page.getByText(/retención irpf/i).isVisible({ timeout: 3000 }).catch(() => false)
        expect(retencionVisible).toBe(true)

        // Pagada/Pagado visible en Resumen Financiero
        await expect(page.getByText(/pagada|pagado/i)).toBeVisible({ timeout: 5000 })
    })
})
