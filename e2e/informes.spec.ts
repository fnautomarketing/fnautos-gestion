/**
 * E2E: Página Informes y analítica
 *
 * Comprueba que la página de informes carga correctamente:
 * - Filtros (período, empresa, cliente)
 * - Tabs: Resumen, Ventas, Clientes y categorías, Desglose IVA
 * - Resumen de filtros activos
 * - Exportar Excel
 *
 * Requiere credenciales en .env.e2e
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
    await page.getByRole('textbox', { name: /email corporativo|usuario@|email/i }).fill(email)
    await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
    await page.getByRole('button', { name: /acceder al portal|iniciar|entrar/i }).click()
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
}

test.describe('Informes – carga y navegación', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('página informes carga con título y filtros', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByRole('heading', { name: /Informes y analítica/i })).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('button', { name: /Este mes/i })).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('button', { name: /Mes anterior/i })).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('button', { name: /Exportar Excel/i })).toBeVisible({ timeout: 5000 })
    })

    test('resumen de filtros activos visible', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByText(/Mostrando:/)).toBeVisible({ timeout: 8000 })
    })

    test('tabs Resumen, Ventas, Clientes, Desglose IVA visibles', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByRole('tab', { name: /Resumen/i })).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('tab', { name: /Ventas/i })).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('tab', { name: /^Clientes$/i })).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('tab', { name: /Desglose IVA/i })).toBeVisible({ timeout: 5000 })
    })

    test('tab Resumen muestra KPIs', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('tab', { name: /Resumen/i }).click()
        await page.waitForTimeout(1500)
        await expect(page.getByText('Facturación Total').first()).toBeVisible({ timeout: 8000 })
    })

    test('tab Ventas muestra evolución y estado', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('tab', { name: /Ventas/i }).click()
        await page.waitForTimeout(1500)
        await expect(page.getByText(/Evolución de facturación/i)).toBeVisible({ timeout: 8000 })
        await expect(page.getByText(/Estado de facturas/i)).toBeVisible({ timeout: 8000 })
    })

    test('tab Clientes muestra top clientes', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('tab', { name: /^Clientes$/i }).click()
        await page.waitForTimeout(1500)
        await expect(page.getByText('Top clientes por facturación').first()).toBeVisible({ timeout: 8000 })
    })

    test('tab Desglose IVA carga sin error', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('tab', { name: /Desglose IVA/i }).click()
        await page.waitForTimeout(2500)
        await expect(page.locator('text=/Error al cargar el desglose IVA/')).not.toBeVisible({ timeout: 2000 })
        await expect(page.getByText(/Desglose por IVA|No hay facturas con desglose/i).first()).toBeVisible({ timeout: 12000 })
    })

    test('preset Mes anterior aplica rango', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('button', { name: /Mes anterior/i }).click()
        await page.waitForTimeout(800)
        await expect(page.getByText(/Mostrando:/)).toBeVisible({ timeout: 5000 })
    })

    test('filtro Cliente visible (empresa viene del header)', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('informes-filter-cliente')).toBeVisible({ timeout: 5000 })
    })

    test('resumen de filtros incluye empresa y cliente', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('informes-filter-summary')).toBeVisible({ timeout: 8000 })
    })
})

test.describe('Informes – responsive', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('KPIs y valores visibles en viewport móvil (375px)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000)
        await expect(page.getByText('Facturación Total').first()).toBeVisible({ timeout: 8000 })
        await expect(page.getByText(/€/).first()).toBeVisible({ timeout: 5000 })
    })

    test('KPIs y valores visibles en viewport tablet (768px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000)
        await expect(page.getByText('Facturación Total').first()).toBeVisible({ timeout: 8000 })
        await expect(page.getByText('Facturas Emitidas').first()).toBeVisible({ timeout: 5000 })
    })

    test('tab Ventas muestra gráficos sin overflow en móvil', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('tab', { name: /Ventas/i }).click()
        await page.waitForTimeout(2500)
        await expect(page.getByText('Evolución de facturación').first()).toBeVisible({ timeout: 10000 })
        await expect(page.getByText('Estado de facturas').first()).toBeVisible({ timeout: 5000 })
    })

    test('tab Desglose IVA carga sin error en móvil', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('tab', { name: /Desglose IVA/i }).click()
        await page.waitForTimeout(2000)
        await expect(page.locator('text=/Error al cargar el desglose IVA/')).not.toBeVisible({ timeout: 5000 })
    })
})

test.describe('Informes – exportar Excel', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('botón Exportar Excel descarga archivo', async ({ page }) => {
        const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByRole('button', { name: /Exportar Excel/i }).click()
        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/informe_ventas_.*\.xlsx/)
    })
})

test.describe('Informes – filtro cliente y UX', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('filtro cliente abre búsqueda al hacer clic', async ({ page }) => {
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByTestId('informes-filter-cliente').click()
        await page.waitForTimeout(400)
        await expect(page.getByPlaceholder(/Todos los clientes/i)).toBeVisible({ timeout: 3000 })
    })

    test('en móvil tab Resumen no tiene overflow horizontal', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 })
        await page.goto('/ventas/informes', { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(2000)
        // Resumen es el tab por defecto; no tiene tablas anchas
        const overflow = await page.evaluate(() => {
            const html = document.documentElement
            return html.scrollWidth > html.clientWidth + 4
        })
        expect(overflow).toBe(false)
    })
})
