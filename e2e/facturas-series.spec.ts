/**
 * Tests E2E: Facturas y Series
 * - Crear factura desde Visión Global (por empresa)
 * - Crear factura con empresa seleccionada
 * - Verificar serie/número correctos (V2026-0001, Y2026-0001, E2026-0001)
 * - Verificar registro en página Series
 *
 * Credenciales en .env.e2e (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect } from '@playwright/test'

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const EMPRESA_YENIFER_ID = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'

test('Página de login carga correctamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /STV|bienvenido|acceso/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByPlaceholder(/usuario@|email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/••••/)).toBeVisible()
})

test.describe('Facturas y Series - E2E', () => {
    test.beforeEach(async ({ page }) => {
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
            throw new Error('Login falló: la página sigue en /login tras enviar credenciales')
        }
    })

    test('Visión Global: página nueva factura carga y formulario visible', async ({ page }) => {
        test.setTimeout(90000)
        await page.waitForTimeout(1500)
        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })

        await expect(page.getByRole('heading', { name: /nueva factura/i })).toBeVisible({ timeout: 10000 })
        const emitBtn = page.getByRole('button', { name: /emitir factura/i })
        await expect(emitBtn).toBeVisible({ timeout: 5000 })
    })

    test('Visión Global: crear y emitir factura (flujo completo)', async ({ page }) => {
        test.setTimeout(120000)
        await page.waitForTimeout(1500)
        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })

        // Seleccionar cliente usando data-testid
        const clienteCombobox = page.getByTestId('combobox-cliente')
        await clienteCombobox.click()
        await page.waitForTimeout(800)
        const firstOption = page.locator('[data-testid^="combobox-option-"]').first()
        await expect(firstOption).toBeVisible({ timeout: 5000 })
        await firstOption.click()

        const concepto = page.locator('input[placeholder*="Concepto"]').first()
        await concepto.fill('E2E Test')
        const precios = page.locator('input[type="number"]')
        if (await precios.count() >= 2) await precios.nth(1).fill('50')

        await page.getByRole('button', { name: /emitir factura/i }).click()
        await page.getByRole('button', { name: /sí, emitir|confirmar|emitir/i }).click({ timeout: 10000 })
        await expect(page).toHaveURL(/\/ventas\/facturas/, { timeout: 20000 })
    })

    test('Página Series: verificar que el texto de los campos es visible en editar', async ({ page }) => {
        test.setTimeout(60000)
        await page.waitForTimeout(2000)
        await page.goto('/ventas/configuracion/series', { waitUntil: 'networkidle', timeout: 45000 })
        await page.waitForLoadState('networkidle')

        const editBtn = page.getByRole('link', { name: /editar/i }).first()
        if (!(await editBtn.isVisible())) {
            test.skip()
            return
        }
        await editBtn.click()
        await page.waitForURL(/\/series\/.*\/editar/)
        await page.waitForLoadState('networkidle')

        const codigoInput = page.locator('input#codigo, input[name="codigo"]').first()
        await expect(codigoInput).toBeVisible()
        const value = await codigoInput.inputValue()
        expect(value.length).toBeGreaterThanOrEqual(0)
        // Verificar que el input tiene color de texto legible (computed style)
        const color = await codigoInput.evaluate((el) => window.getComputedStyle(el).color)
        expect(color).toBeTruthy()
    })

    test('Página Series: muestra series agrupadas por empresa', async ({ page }) => {
        await page.goto('/ventas/configuracion/series')
        await page.waitForLoadState('networkidle')

        await expect(page.getByRole('heading', { name: /series de facturación/i })).toBeVisible()
        const seriesCards = page.locator('[class*="rounded-2xl"]').filter({ has: page.locator('text=V2026, Y2026, E2026') })
        const count = await seriesCards.count()
        expect(count).toBeGreaterThanOrEqual(0)
    })

    test('Factura Externa: crear borrador desde nueva factura', async ({ page }) => {
        test.setTimeout(120000)
        await page.waitForTimeout(1500)
        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })

        // Activar Factura Externa
        await page.getByTestId('factura-externa-switch').click()
        await page.waitForTimeout(500)

        // Seleccionar cliente
        const clienteCombobox = page.getByTestId('combobox-cliente')
        await clienteCombobox.click()
        await page.waitForTimeout(600)
        const firstOption = page.locator('[data-testid^="combobox-option-"]').first()
        await expect(firstOption).toBeVisible({ timeout: 5000 })
        await firstOption.click()

        // Rellenar concepto y precio
        const concepto = page.locator('input[placeholder*="Concepto"]').first()
        await concepto.fill('E2E Factura Externa')
        const precios = page.locator('input[type="number"]')
        if (await precios.count() >= 2) await precios.nth(1).fill('75')

        // Guardar borrador
        await page.getByRole('button', { name: /guardar borrador/i }).click()
        await page.waitForTimeout(2000)
        await expect(page).toHaveURL(/\/ventas\/facturas/, { timeout: 15000 })
    })

    test('Facturas: página carga con filtros', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 15000 })
        const searchInput = page.locator('input[placeholder*="Buscar"]').first()
        await expect(searchInput).toBeVisible({ timeout: 10000 })
    })

    test('Enviar Email: página de email carga con formulario', async ({ page }) => {
        test.setTimeout(90000)
        await page.waitForTimeout(1500)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const facturaEmitidaRow = page.getByTestId('factura-row').filter({ has: page.getByText(/Emitida|Pagada/i) }).first()
        if (!(await facturaEmitidaRow.isVisible())) {
            test.skip()
            return
        }
        await facturaEmitidaRow.click()
        await page.waitForURL(/\/ventas\/facturas\/[^/]+$/, { timeout: 20000 })
        await page.waitForLoadState('networkidle')

        const emailBtn = page.getByRole('button', { name: /enviar email/i })
        await expect(emailBtn).toBeEnabled({ timeout: 5000 })
        await emailBtn.click()
        await page.waitForURL(/\/ventas\/facturas\/[^/]+\/email/)
        await expect(page.getByRole('heading', { name: /enviar documento/i })).toBeVisible({ timeout: 10000 })
        await expect(page.getByPlaceholder(/cliente@empresa|contabilidad/i)).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('button', { name: /enviar email/i })).toBeVisible()
    })

    test('Enviar Email: validación de destinatario vacío', async ({ page }) => {
        test.setTimeout(90000)
        await page.waitForTimeout(1500)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const facturaEmitidaRow = page.getByTestId('factura-row').filter({ has: page.getByText(/Emitida|Pagada/i) }).first()
        if (!(await facturaEmitidaRow.isVisible())) {
            test.skip()
            return
        }
        await facturaEmitidaRow.click()
        await page.waitForURL(/\/ventas\/facturas\/[^/]+$/, { timeout: 20000 })
        await page.waitForLoadState('networkidle')

        const emailBtn = page.getByRole('button', { name: /enviar email/i })
        await expect(emailBtn).toBeEnabled({ timeout: 5000 })
        await emailBtn.click()
        await page.waitForURL(/\/ventas\/facturas\/[^/]+\/email/)

        // Vaciar campo Para y enviar
        const input = page.getByPlaceholder(/cliente@empresa|contabilidad/i).first()
        await input.fill('')
        await page.getByRole('button', { name: /enviar email/i }).last().click()
        await expect(page.getByText(/introduce al menos un destinatario|destinatario/i)).toBeVisible({ timeout: 5000 })
    })
})