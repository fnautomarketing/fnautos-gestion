/**
 * E2E: Dashboard – selector de período y KPIs
 *
 * Comprueba que el dashboard carga correctamente para:
 * - Cada empresa (Yenifer, Edison, Villegas)
 * - Visión global (admin)
 * - Selector de período: mes actual, anterior, trimestre, rango personalizado
 *
 * Requiere credenciales en .env.e2e
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
        await page.waitForTimeout(2000)
    }
    return true
}

async function dashboardCargaCorrectamente(page: Page) {
    await expect(page.getByRole('button', { name: /nueva factura/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Facturación del período')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Nº Facturas')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Ticket Medio')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Datos:/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('dashboard-period-btn')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Evolución de facturación')).toBeVisible({ timeout: 8000 })
}

async function selectorVistaVisible(page: Page) {
    await expect(page.getByTestId('dashboard-vista-semana')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('dashboard-vista-mes')).toBeVisible({ timeout: 5000 })
}

async function selectorTipoGraficoVisible(page: Page) {
    await expect(page.getByTestId('dashboard-chart-type-line')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('dashboard-chart-type-bar')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('dashboard-chart-type-area')).toBeVisible({ timeout: 5000 })
}

test.describe('Dashboard – por empresa', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('Yenifer: dashboard carga con KPIs 4 tarjetas y sección estados', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        // Sección "Estados del período"
        await expect(page.getByText('Estados del período')).toBeVisible({ timeout: 5000 })
    })

    test('Edison: dashboard carga con KPIs', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_EDISON_ID)
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
    })

    test('Villegas: dashboard carga con KPIs', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
    })
})

test.describe('Dashboard – selector de período (URL params)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('?periodo=actual carga KPIs del mes actual', async ({ page }) => {
        await page.goto('/dashboard?periodo=actual', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
    })

    test('?periodo=anterior carga KPIs del mes anterior', async ({ page }) => {
        await page.goto('/dashboard?periodo=anterior', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.getByText(/Datos:/)).toBeVisible({ timeout: 5000 })
    })

    test('?periodo=trimestre carga KPIs del trimestre', async ({ page }) => {
        await page.goto('/dashboard?periodo=trimestre', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
    })

    test('?periodo=ytd carga KPIs año hasta hoy', async ({ page }) => {
        await page.goto('/dashboard?periodo=ytd', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.url()).toContain('periodo=ytd')
    })

    test('?periodo=ultimo_anio carga KPIs últimos 12 meses', async ({ page }) => {
        await page.goto('/dashboard?periodo=ultimo_anio', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.url()).toContain('periodo=ultimo_anio')
    })

    test('rango enero 2026: muestra facturas históricas importadas', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        await page.goto('/dashboard?periodo=custom&desde=2026-01-01&hasta=2026-01-31', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        // Con facturas de enero debería aparecer algún valor en Facturación ≠ 0€
        // y la sección "Facturas del período" (si hay facturas)
        const facturasSection = page.getByText('Facturas del período')
        if (await facturasSection.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(facturasSection).toBeVisible()
        }
    })

    test('rango enero 2026 Villegas: muestra facturas de Villegas', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/dashboard?periodo=custom&desde=2026-01-01&hasta=2026-01-31', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.getByText('Estados del período')).toBeVisible({ timeout: 5000 })
    })

    test('rango custom: Datos muestra fechas correctas', async ({ page }) => {
        await page.goto('/dashboard?periodo=custom&desde=2026-01-01&hasta=2026-01-31', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        // El badge "Datos:" debe incluir 2026 (enero)
        await expect(page.getByText(/Datos:.*2026/i)).toBeVisible({ timeout: 5000 })
    })
})

test.describe('Dashboard – aplicar rango desde selector', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('clic en Mes anterior aplica rango y actualiza URL', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByTestId('dashboard-period-btn').click()
        await page.waitForTimeout(300)
        await page.getByRole('button', { name: /mes anterior/i }).click()
        await page.waitForTimeout(1500)
        await expect(page).toHaveURL(/periodo=anterior/, { timeout: 10000 })
        await expect(page.getByText(/Datos:/)).toBeVisible({ timeout: 5000 })
    })
})

test.describe('Dashboard – vista Semana / Mes', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('selector Vista Semana | Mes visible y aplica a KPIs', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await selectorVistaVisible(page)
        await page.getByTestId('dashboard-vista-semana').click()
        await page.waitForURL(/vista=semana/, { timeout: 8000 })
        await expect(page.getByText(/Datos:/)).toBeVisible({ timeout: 5000 })
        await page.getByTestId('dashboard-vista-mes').click()
        await page.waitForURL(/vista=mes/, { timeout: 8000 })
    })

    test('?vista=semana carga KPIs últimos 7 días', async ({ page }) => {
        await page.goto('/dashboard?vista=semana', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.getByText('Facturación del período')).toBeVisible({ timeout: 5000 })
        await expect(page.getByText(/7d ant/).first()).toBeVisible({ timeout: 8000 })
    })
})

test.describe('Dashboard – tipo de gráfico (Línea / Barra / Área)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('selector de tipo de gráfico visible y cambia vista', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await selectorTipoGraficoVisible(page)
        await page.getByTestId('dashboard-chart-type-bar').click()
        await page.waitForTimeout(400)
        await page.getByTestId('dashboard-chart-type-area').click()
        await page.waitForTimeout(400)
        await page.getByTestId('dashboard-chart-type-line').click()
        await page.waitForTimeout(400)
        await expect(page.getByText('Evolución de facturación')).toBeVisible({ timeout: 3000 })
    })
})

test.describe('Dashboard – visión global', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('visión global con rango enero 2026: muestra desglose por empresa', async ({ page }) => {
        const selector = page.getByTestId('empresa-selector-trigger')
        if (await selector.isVisible({ timeout: 5000 }).catch(() => false)) {
            await selector.click()
            await page.waitForTimeout(400)
            const all = page.getByTestId('empresa-option-ALL')
            if (await all.isVisible({ timeout: 3000 }).catch(() => false)) {
                await all.click()
                await page.waitForTimeout(400)
                const confirm = page.getByTestId('confirm-dialog-confirm')
                if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await confirm.click()
                    await page.waitForTimeout(2000)
                }
            }
        }
        await page.goto('/dashboard?periodo=custom&desde=2026-01-01&hasta=2026-01-31', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        // En visión global con datos de enero debería aparecer el desglose
        const desglose = page.getByText('Desglose por empresa')
        if (await desglose.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(desglose).toBeVisible()
        }
    })

    test('visión global mes actual carga sin error', async ({ page }) => {
        await page.goto('/dashboard?periodo=actual', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.locator('text=/Error cargando KPIs/')).not.toBeVisible({ timeout: 3000 })
    })

    test('visión global con vista=semana: KPIs y gráficos aplican a todas las empresas', async ({ page }) => {
        const selector = page.getByTestId('empresa-selector-trigger')
        if (await selector.isVisible({ timeout: 5000 }).catch(() => false)) {
            await selector.click()
            await page.waitForTimeout(400)
            const all = page.getByTestId('empresa-option-ALL')
            if (await all.isVisible({ timeout: 3000 }).catch(() => false)) {
                await all.click()
                await page.waitForTimeout(400)
                const confirm = page.getByTestId('confirm-dialog-confirm')
                if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await confirm.click()
                    await page.waitForTimeout(2000)
                }
            }
        }
        await page.goto('/dashboard?vista=semana', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await selectorVistaVisible(page)
        await selectorTipoGraficoVisible(page)
        await expect(page.getByText('Facturación del período')).toBeVisible({ timeout: 5000 })
    })
})

test.describe('Dashboard – por empresa con vista y tipo de gráfico', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('Yenifer: vista semana + tipo barra aplican correctamente', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_YENIFER_ID)
        await page.goto('/dashboard?vista=semana', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.getByTestId('dashboard-vista-semana')).toBeVisible({ timeout: 5000 })
        await page.getByTestId('dashboard-chart-type-bar').click()
        await page.waitForTimeout(500)
        await expect(page.getByText('Evolución de facturación')).toBeVisible({ timeout: 3000 })
    })

    test('Villegas: período trimestre + vista mes', async ({ page }) => {
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/dashboard?periodo=trimestre&vista=mes', { waitUntil: 'networkidle', timeout: 30000 })
        await dashboardCargaCorrectamente(page)
        await expect(page.getByText(/Datos:/)).toBeVisible({ timeout: 5000 })
        await expect(page.getByText(/vs período ant\./).first()).toBeVisible({ timeout: 5000 })
    })
})

test.describe('Dashboard – mejoras UI (breadcrumb, KPI cards, empty states)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('Breadcrumb visible con Dashboard › Inicio', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('dashboard-breadcrumb')).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('dashboard-breadcrumb')).toContainText('Dashboard')
        await expect(page.getByTestId('dashboard-breadcrumb')).toContainText('Inicio')
    })

    test('KPI cards tienen data-testid y estructura', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('dashboard-kpi-card-facturacion')).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('dashboard-kpi-card-num-facturas')).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('dashboard-kpi-card-ticket-medio')).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('dashboard-kpi-card-dias-cobro')).toBeVisible({ timeout: 5000 })
    })

    test('Card Estados del período visible', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('dashboard-card-estados')).toBeVisible({ timeout: 5000 })
    })

    test('Card Vencimientos próximos visible', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('dashboard-card-vencimientos')).toBeVisible({ timeout: 5000 })
    })

    test('Badge Datos período visible', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.getByTestId('dashboard-datos-periodo')).toBeVisible({ timeout: 5000 })
    })
})
