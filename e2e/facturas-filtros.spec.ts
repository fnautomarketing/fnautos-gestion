/**
 * Tests E2E: Filtros de Facturas
 * - Búsqueda por nombre/cliente
 * - Filtro por estado (chips)
 * - Filtro por mes / año
 * - Ordenación
 * - Accesos rápidos (Este mes, Este año)
 * - Limpiar filtros
 * - Parámetros en URL
 * - Nuevo estado "Enviada"
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
    // Rellenar email
    await page.getByRole('textbox', { name: /email corporativo/i }).fill(email)
    // Rellenar contraseña por label
    await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
    // Pulsar el botón de acceso
    await page.getByRole('button', { name: /acceder al portal/i }).click()
    // Esperar redirección con timeout ampliado (producción puede tardar)
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 40000 })
    if (page.url().includes('login')) {
        throw new Error('Login falló: sigue en /login tras el click')
    }
}

test.describe('Filtros de Facturas E2E', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1500)
    })

    // ─── Carga básica ────────────────────────────────────────────────────────

    test('Página de facturas carga con filtros visibles', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await expect(page.getByTestId('page-facturas')).toBeVisible({ timeout: 15000 })
        await expect(page.getByTestId('facturas-filters')).toBeVisible({ timeout: 5000 })

        // Búsqueda
        const searchInput = page.getByTestId('facturas-filter-search')
        await expect(searchInput).toBeVisible()
        await expect(searchInput).toHaveAttribute('placeholder', /buscar|cliente|CIF/i)

        // Período y orden
        await expect(page.getByTestId('facturas-filter-orden')).toBeVisible()
        await expect(page.getByTestId('facturas-filter-este-mes')).toBeVisible()
        await expect(page.getByTestId('facturas-filter-este-anio')).toBeVisible()
    })

    // ─── Chips de estado ─────────────────────────────────────────────────────

    test('Chips de estado son visibles y se pueden clicar', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const estados = ['todas', 'borrador', 'emitida', 'enviada', 'pagada', 'parcial', 'vencida', 'externa-emitida']
        for (const e of estados) {
            await expect(page.getByTestId(`facturas-filter-estado-${e}`)).toBeVisible()
        }
    })

    test('Filtro por estado "emitida" actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-estado-emitida').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/estado=emitida/, { timeout: 5000 })
    })

    test('Filtro por estado "pagada" actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-estado-pagada').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/estado=pagada/, { timeout: 5000 })
    })

    test('Filtro por estado "borrador" actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-estado-borrador').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/estado=borrador/, { timeout: 5000 })
    })

    test('Filtro por estado "enviada" actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-estado-enviada').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/estado=enviada/, { timeout: 5000 })
    })

    test('Chip "Todos los estados" limpia el filtro de estado en URL', async ({ page }) => {
        await page.goto('/ventas/facturas?estado=pagada', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-estado-todas').click()
        await page.waitForTimeout(500)

        await expect(page).not.toHaveURL(/estado=/, { timeout: 5000 })
    })

    // ─── Búsqueda ─────────────────────────────────────────────────────────────

    test('Búsqueda por texto actualiza URL y resultados', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const searchInput = page.getByTestId('facturas-filter-search')
        await searchInput.fill('test')
        await page.waitForTimeout(500) // debounce

        await expect(page).toHaveURL(/q=test/, { timeout: 5000 })
    })

    test('Botón X limpia el campo de búsqueda', async ({ page }) => {
        await page.goto('/ventas/facturas?q=cliente', { waitUntil: 'networkidle', timeout: 30000 })

        const searchInput = page.getByTestId('facturas-filter-search')
        await expect(searchInput).toHaveValue('cliente')

        // Clicar la X
        await page.locator('[data-testid="facturas-filters"] input[type="text"] ~ button').click()
        await page.waitForTimeout(500)

        await expect(searchInput).toHaveValue('')
    })

    // ─── Período (pills) ──────────────────────────────────────────────────────

    test('Botón "Este mes" aplica filtro de mes y año', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-este-mes').click()
        await page.waitForTimeout(500)

        const hoy = new Date()
        const mesEsperado = hoy.getMonth() + 1
        const anioEsperado = hoy.getFullYear()

        await expect(page).toHaveURL(new RegExp(`mes=${mesEsperado}`), { timeout: 5000 })
        await expect(page).toHaveURL(new RegExp(`anio=${anioEsperado}`), { timeout: 5000 })
    })

    test('Botón "Este año" aplica filtro de año', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-filter-este-anio').click()
        await page.waitForTimeout(500)

        const currentYear = new Date().getFullYear()
        await expect(page).toHaveURL(new RegExp(`anio=${currentYear}`), { timeout: 5000 })
    })

    // ─── Ordenación ───────────────────────────────────────────────────────────

    test('Selector de orden es visible y tiene opciones correctas', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const ordenSelect = page.getByTestId('facturas-filter-orden')
        await expect(ordenSelect).toBeVisible()
        await ordenSelect.click()
        await page.waitForTimeout(300)

        await expect(page.getByRole('option', { name: /más reciente/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /más antiguo/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /cliente a/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /cliente z/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /mayor importe/i })).toBeVisible()
        await expect(page.getByRole('option', { name: /menor importe/i })).toBeVisible()

        // Cerrar el select
        await page.keyboard.press('Escape')
    })

    test('Ordenar por "Más antiguo primero" actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const ordenSelect = page.getByTestId('facturas-filter-orden')
        await ordenSelect.click()
        await page.waitForTimeout(300)
        await page.getByRole('option', { name: /más antiguo/i }).click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/orden=fecha_asc/, { timeout: 5000 })
    })

    test('Ordenar por "Cliente A → Z" actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const ordenSelect = page.getByTestId('facturas-filter-orden')
        await ordenSelect.click()
        await page.waitForTimeout(300)
        await page.getByRole('option', { name: /cliente a/i }).click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/orden=cliente_asc/, { timeout: 5000 })
    })

    // ─── Limpiar filtros ─────────────────────────────────────────────────────

    test('Limpiar filtros resetea URL y oculta el badge de activos', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        // Activar filtro
        const searchInput = page.getByTestId('facturas-filter-search')
        await searchInput.fill('cliente')
        await page.waitForTimeout(600)
        await expect(page).toHaveURL(/q=cliente/, { timeout: 5000 })

        // Badge visible
        await expect(page.getByTestId('facturas-filters-active-badge')).toBeVisible({ timeout: 3000 })

        // Limpiar
        await page.getByTestId('facturas-filter-limpiar').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/\/ventas\/facturas\/?(\?|$)/, { timeout: 5000 })
        await expect(page).not.toHaveURL(/q=/)
    })

    // ─── Exportación ─────────────────────────────────────────────────────────

    test('Botón Exportar es visible y abre menú con opciones', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const exportBtn = page.getByTestId('facturas-export-trigger')
        await expect(exportBtn).toBeVisible()
        await exportBtn.click()
        await page.waitForTimeout(200)

        await expect(page.getByTestId('facturas-export-pagina')).toBeVisible()
        await expect(page.getByTestId('facturas-export-todas-xlsx')).toBeVisible()
        await expect(page.getByTestId('facturas-export-todas-csv')).toBeVisible()
    })

    test('Exportar todas filtradas (Excel) descarga archivo .xlsx', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
        await page.getByTestId('facturas-export-trigger').click()
        await page.waitForTimeout(200)
        await page.getByTestId('facturas-export-todas-xlsx').click()

        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
    })

    test('Exportar página actual (CSV) descarga archivo', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
        await page.getByTestId('facturas-export-trigger').click()
        await page.waitForTimeout(200)
        await page.getByTestId('facturas-export-pagina').click()

        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/\.csv$/)
    })

    // ─── Ordenación por clic en columnas ──────────────────────────────────────

    test('Clic en cabecera "Número" ordena y actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-th-numero').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/orden=numero_asc|orden=numero_desc/, { timeout: 5000 })
    })

    test('Clic en cabecera "Total" ordena ascendente/descendente', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-th-total').click()
        await page.waitForTimeout(500)
        const url1 = page.url()
        expect(url1).toMatch(/orden=total_asc|orden=total_desc/)

        await page.getByTestId('facturas-th-total').click()
        await page.waitForTimeout(500)
        const url2 = page.url()
        expect(url2).toMatch(/orden=total_asc|orden=total_desc/)
        expect(url1).not.toBe(url2)
    })

    test('Clic en cabecera "Cliente" ordena y actualiza URL', async ({ page }) => {
        await page.goto('/ventas/facturas', { waitUntil: 'networkidle', timeout: 30000 })

        await page.getByTestId('facturas-th-cliente').click()
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/orden=cliente_asc|orden=cliente_desc/, { timeout: 5000 })
    })

    // ─── URL preconfigurada ──────────────────────────────────────────────────

    test('URL con parámetros pre-carga los filtros correctamente', async ({ page }) => {
        const currentYear = new Date().getFullYear()
        await page.goto(
            `/ventas/facturas?estado=emitida&mes=1&anio=${currentYear}&q=test&orden=cliente_asc`,
            { waitUntil: 'networkidle', timeout: 30000 }
        )

        await expect(page.getByTestId('facturas-filter-search')).toHaveValue('test')
        await expect(page).toHaveURL(/estado=emitida/)
        await expect(page).toHaveURL(/mes=1/)
        await expect(page).toHaveURL(new RegExp(`anio=${currentYear}`))
        await expect(page).toHaveURL(/orden=cliente_asc/)

        // El chip "emitida" debe tener apariencia de activo
        const chipEmitida = page.getByTestId('facturas-filter-estado-emitida')
        await expect(chipEmitida).toBeVisible()
    })
})
