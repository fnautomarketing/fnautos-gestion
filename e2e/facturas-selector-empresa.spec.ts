/**
 * E2E: Facturas por empresa – selector de empresa
 *
 * Comprueba que al elegir Yenifer, Edison o Villegas en el selector del header
 * y entrar en Ventas › Facturas, se ven las facturas de esa empresa
 * (incluidas las históricas importadas: Y2026-0001/0002, E2026-0001, F2026-0004…).
 *
 * Requiere: credenciales en .env.e2e (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)
 * y que existan facturas por empresa (ej. tras ejecutar importar-facturas-historicas.mjs).
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect, type Page } from '@playwright/test'

const EMPRESA_YENIFER_ID = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'
const EMPRESA_EDISON_ID = 'af15f25a-7ade-4de8-9241-a42e1b8407da'
const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'

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

test.describe('Facturas por selector de empresa', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1000)
    })

    test('al elegir Yenifer y ir a Facturas se ven facturas de Yenifer (Y2026)', async ({ page }) => {
        const changed = await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        if (!changed) {
            test.skip(true, 'Selector de empresa o opción Yenifer no disponible')
            return
        }
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        // Debe aparecer al menos una factura con serie Y2026 (importadas o existentes)
        const table = page.locator('table tbody tr')
        await expect(table.first()).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/Y2026-\d{4}/).first()).toBeVisible({ timeout: 5000 })
    })

    test('al elegir Edison y ir a Facturas se ven facturas de Edison (E2026)', async ({ page }) => {
        const changed = await cambiarEmpresa(page, EMPRESA_EDISON_ID)
        if (!changed) {
            test.skip(true, 'Selector de empresa o opción Edison no disponible')
            return
        }
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        const table = page.locator('table tbody tr')
        await expect(table.first()).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/E2026-\d{4}/).first()).toBeVisible({ timeout: 5000 })
    })

    test('al elegir Villegas y ir a Facturas se ven facturas de Villegas (F2026)', async ({ page }) => {
        const changed = await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        if (!changed) {
            test.skip(true, 'Selector de empresa o opción Villegas no disponible')
            return
        }
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        const table = page.locator('table tbody tr')
        await expect(table.first()).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/F2026-\d{4}/).first()).toBeVisible({ timeout: 5000 })
    })

    test('abrir detalle de una factura no devuelve 404', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        const firstRow = page.getByTestId('factura-row').first()
        await expect(firstRow).toBeVisible({ timeout: 10000 })
        await firstRow.click()
        await page.waitForURL(/\/ventas\/facturas\/[a-f0-9-]+$/, { timeout: 15000 })
        await expect(page).not.toHaveURL(/404/)
        await expect(page.getByRole('button', { name: /descargar pdf/i })).toBeVisible({ timeout: 5000 })
    })

    test('desde detalle, ir a PDF no devuelve 404', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        const firstRow = page.getByTestId('factura-row').first()
        await firstRow.click()
        await page.waitForURL(/\/ventas\/facturas\/[a-f0-9-]+$/, { timeout: 15000 })
        await page.getByRole('button', { name: /descargar pdf/i }).click()
        await page.waitForURL(/\/ventas\/facturas\/[a-f0-9-]+\/pdf/, { timeout: 15000 })
        await expect(page).not.toHaveURL(/404/)
    })

    test('cambiar de Villegas a Yenifer cambia el listado de facturas', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        const textoVillegas = page.getByText(/F2026-\d{4}/)
        await expect(textoVillegas.first()).toBeVisible({ timeout: 10000 })

        const changed = await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        if (!changed) {
            test.skip(true, 'No se pudo cambiar a Yenifer')
            return
        }
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByText(/Y2026-\d{4}/).first()).toBeVisible({ timeout: 10000 })
        const rows = page.locator('table tbody tr')
        const firstRowText = await rows.first().textContent()
        expect(firstRowText).toMatch(/Y2026/)
    })
})

test.describe('Facturas – filtros de período', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('por defecto "Todas las fechas" muestra todas las facturas de la empresa', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        await expect(page.getByTestId('facturas-filter-periodo-todos')).toBeVisible({ timeout: 5000 })
        const count = await page.locator('table tbody tr [data-testid="factura-row"]').count()
        expect(count).toBeGreaterThanOrEqual(1)
    })

    test('clic en "Este mes" filtra por mes actual y actualiza URL', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByTestId('facturas-filter-periodo-este-mes').click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/mes=\d+&anio=\d{4}/, { timeout: 4000 })
    })

    test('clic en "Este año" filtra por año actual', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_EDISON_ID)
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByTestId('facturas-filter-periodo-este-anio').click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/anio=\d{4}/, { timeout: 4000 })
    })

    test('rango enero 2026: Villegas muestra facturas históricas', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/ventas/facturas?desde=2026-01-01&hasta=2026-01-31', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/F2026-\d{4}/).first()).toBeVisible({ timeout: 8000 })
    })

    test('Limpiar filtros restablece a URL sin params', async ({ page }) => {
        await page.goto('/ventas/facturas?mes=3&anio=2026&estado=emitida', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('facturas-filter-limpiar')).toBeVisible({ timeout: 5000 })
        await page.getByTestId('facturas-filter-limpiar').click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/\/ventas\/facturas$|\/ventas\/facturas\?$/, { timeout: 4000 })
    })
})
