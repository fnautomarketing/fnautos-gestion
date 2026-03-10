/**
 * Tests E2E: Clientes por empresa y flujo de facturación
 * 1. Crear cliente solo para una empresa (Villegas) → crear factura y emitir
 * 2. Crear cliente común para todas las empresas
 * 3. Desde Visión Global: crear factura para el cliente común
 *
 * Credenciales en .env.e2e o E2E_TEST_EMAIL, E2E_TEST_PASSWORD
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect } from '@playwright/test'

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const EMPRESA_YENIFER_ID = 'e9a30c7d-eb2a-4c7a-91a6-a8bfe8f2278a'

const CLIENTE_SOLO_VILLEGAS = {
    cif: 'B12345678',
    nombre_fiscal: 'E2E Cliente Solo Villegas S.L.',
    email: 'cliente1@e2e.test',
    telefono: '612345678',
    direccion: 'Calle Test 1',
    codigo_postal: '28001',
    ciudad: 'Madrid',
}

const CLIENTE_COMUN = {
    cif: 'B87654321',
    nombre_fiscal: 'E2E Cliente Comun Todas S.L.',
    email: 'cliente2@e2e.test',
    telefono: '698765432',
    direccion: 'Calle Test 2',
    codigo_postal: '28002',
    ciudad: 'Madrid',
}

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

test.describe('Clientes por empresa y facturación E2E', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1500)
    })

    test('1. Crear cliente solo para Villegas → factura y emitir', async ({ page }) => {
        test.setTimeout(120000)

        const nombreCliente = `E2E Cliente Solo Villegas ${Date.now()} S.L.`

        // Crear cliente solo para Villegas
        await page.goto('/ventas/clientes/nuevo', { waitUntil: 'networkidle', timeout: 45000 })
        await expect(page.getByRole('heading', { name: /nuevo cliente/i })).toBeVisible({ timeout: 10000 })

        await page.locator('#cif').fill(CLIENTE_SOLO_VILLEGAS.cif)
        await page.locator('#nombre_fiscal').fill(nombreCliente)
        await page.locator('#email_principal').fill(CLIENTE_SOLO_VILLEGAS.email)
        await page.locator('#telefono_principal').fill(CLIENTE_SOLO_VILLEGAS.telefono)
        await page.locator('#direccion').fill(CLIENTE_SOLO_VILLEGAS.direccion)
        await page.locator('#codigo_postal').fill(CLIENTE_SOLO_VILLEGAS.codigo_postal)
        await page.locator('#ciudad').fill(CLIENTE_SOLO_VILLEGAS.ciudad)

        await page.getByTestId('cliente-empresas-seleccion').click()
        await page.waitForTimeout(300)
        // Por defecto todas están marcadas; desmarcar Yenifer y Edison para dejar solo Villegas
        await page.getByRole('checkbox', { name: /YENIFER/i }).click()
        await page.waitForTimeout(200)
        await page.getByRole('checkbox', { name: /EDISON/i }).click()

        await page.getByRole('button', { name: /guardar cliente/i }).click()
        await page.waitForTimeout(3000)
        const toast = page.locator('[data-sonner-toast], [role="status"], [role="alert"]')
        const toastText = await toast.first().textContent().catch(() => '')
        if (toastText?.toLowerCase().includes('error') || (page.url().includes('nuevo') && !toastText?.toLowerCase().includes('creado'))) {
            throw new Error(`Cliente no creado. Toast: ${toastText || 'ninguno'}`)
        }
        if (page.url().includes('nuevo')) {
            await page.goto('/ventas/clientes', { waitUntil: 'networkidle', timeout: 15000 })
            await page.waitForTimeout(1500)
        }

        // Cambiar a empresa Villegas PRIMERO (el cliente solo existe para Villegas)
        const selector = page.getByTestId('empresa-selector-trigger')
        if (await selector.isVisible()) {
            const triggerText = await selector.textContent()
            const yaEnVillegas = triggerText?.toLowerCase().includes('villegas')
            if (!yaEnVillegas) {
                await selector.click()
                await page.waitForTimeout(500)
                const villegasOpt = page.getByTestId(`empresa-option-${EMPRESA_VILLEGAS_ID}`)
                if (await villegasOpt.isVisible()) {
                    await villegasOpt.click()
                    await page.waitForTimeout(500)
                    const confirmBtn = page.getByTestId('confirm-dialog-confirm')
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click()
                        await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 15000 })
                        await page.waitForTimeout(1500)
                    }
                }
                await page.goto('/ventas/clientes', { waitUntil: 'networkidle', timeout: 15000 })
                await page.waitForTimeout(1500)
            }
        }

        await expect(page.getByText(nombreCliente).first()).toBeVisible({ timeout: 15000 })

        const row = page.locator('[data-client-id]').filter({ hasText: nombreCliente }).first()
        await expect(row).toBeVisible({ timeout: 5000 })
        const clientId = await row.getAttribute('data-client-id')
        if (!clientId) throw new Error('No se pudo obtener data-client-id del cliente creado')

        // Crear factura con ese cliente
        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })
        await expect(page.getByRole('heading', { name: /nueva factura/i })).toBeVisible({ timeout: 10000 })

        const clienteCombobox = page.getByTestId('combobox-cliente')
        await clienteCombobox.click()
        await page.waitForTimeout(600)
        await page.getByText(nombreCliente).first().click()

        const concepto = page.locator('input[placeholder*="Concepto"]').first()
        await concepto.fill('E2E Test Cliente Solo Villegas')
        const precios = page.locator('input[type="number"]')
        if (await precios.count() >= 2) await precios.nth(1).fill('100')

        await page.getByRole('button', { name: /emitir factura/i }).click()
        await page.getByRole('button', { name: /sí, emitir|confirmar|emitir/i }).click({ timeout: 10000 })
        await expect(page).toHaveURL(/\/ventas\/facturas/, { timeout: 20000 })
        await expect(page.getByText(nombreCliente)).toBeVisible({ timeout: 5000 })

        // Dar tiempo a que la factura quede persistida antes de cargar el detalle del cliente
        await page.waitForTimeout(2000)
        // Verificar coherencia en detalle del cliente: KPIs = datos reales de facturas (usar el ID capturado)
        await page.goto(`/ventas/clientes/${clientId}`, { waitUntil: 'networkidle', timeout: 15000 })
        await expect(page.getByTestId('page-cliente-detalle')).toBeVisible({ timeout: 5000 })
        const kpiEmitidas = page.getByTestId('cliente-facturas-emitidas')
        const list = page.getByTestId('cliente-ultimas-facturas-list')
        const kpiValue = await kpiEmitidas.textContent()
        const listCount = await list.locator('li').count()
        expect(Number(kpiValue?.trim() ?? 0), 'KPI Facturas emitidas debe coincidir con el número de filas en Últimas facturas').toBe(listCount)
    })

    test('2. Crear cliente común para todas las empresas', async ({ page }) => {
        test.setTimeout(90000)

        await page.goto('/ventas/clientes/nuevo', { waitUntil: 'networkidle', timeout: 45000 })
        await expect(page.getByRole('heading', { name: /nuevo cliente/i })).toBeVisible({ timeout: 10000 })

        await page.locator('#cif').fill(CLIENTE_COMUN.cif)
        await page.locator('#nombre_fiscal').fill(CLIENTE_COMUN.nombre_fiscal)
        await page.locator('#email_principal').fill(CLIENTE_COMUN.email)
        await page.locator('#telefono_principal').fill(CLIENTE_COMUN.telefono)
        await page.locator('#direccion').fill(CLIENTE_COMUN.direccion)
        await page.locator('#codigo_postal').fill(CLIENTE_COMUN.codigo_postal)
        await page.locator('#ciudad').fill(CLIENTE_COMUN.ciudad)

        await page.getByTestId('cliente-empresas-comun').click()

        await page.getByRole('button', { name: /guardar cliente/i }).click()
        await page.waitForTimeout(3000)
        const toast2 = page.locator('[data-sonner-toast], [role="status"], [role="alert"]')
        const toastText2 = await toast2.first().textContent().catch(() => '')
        if (toastText2?.toLowerCase().includes('error') || (page.url().includes('nuevo') && !toastText2?.toLowerCase().includes('creado'))) {
            throw new Error(`Cliente no creado. Toast: ${toastText2 || 'ninguno'}`)
        }
        if (page.url().includes('nuevo')) {
            await page.goto('/ventas/clientes', { waitUntil: 'networkidle', timeout: 15000 })
            await page.waitForTimeout(2000)
        }
        await expect(page.getByText(CLIENTE_COMUN.nombre_fiscal).first()).toBeVisible({ timeout: 15000 })
    })

    test('3. Visión Global: crear factura para cliente común', async ({ page }) => {
        test.setTimeout(120000)

        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(2000)

        // Cambiar a Visión Global (requiere usuario admin)
        const selector = page.getByTestId('empresa-selector-trigger')
        await expect(selector).toBeVisible({ timeout: 10000 })
        await selector.click()
        await page.waitForTimeout(1500)

        const globalOpt = page.getByRole('menuitem', { name: /todas las empresas/i })
        try {
            await globalOpt.waitFor({ state: 'visible', timeout: 8000 })
        } catch {
            test.skip(true, 'Usuario sin Visión Global (rol admin en perfiles requerido)')
            return
        }
        const triggerText = await selector.textContent()
        const yaEnGlobal = triggerText?.toLowerCase().includes('todas') || triggerText?.toLowerCase().includes('global')
        if (!yaEnGlobal) {
            await globalOpt.click()
            await page.waitForTimeout(500)
            const confirmBtn = page.getByTestId('confirm-dialog-confirm')
            await expect(confirmBtn).toBeVisible({ timeout: 5000 })
            await confirmBtn.click()
            await page.waitForURL(/\/dashboard/, { timeout: 15000 })
            await page.waitForTimeout(2000)
        }

        await page.goto('/ventas/facturas/nueva', { waitUntil: 'networkidle', timeout: 45000 })
        await expect(page.getByRole('heading', { name: /nueva factura/i })).toBeVisible({ timeout: 10000 })

        // Seleccionar empresa (Yenifer) en el formulario
        const empresaTrigger = page.getByTestId('factura-empresa-select')
        if (await empresaTrigger.isVisible()) {
            await empresaTrigger.click()
            await page.waitForTimeout(400)
            await page.getByRole('option').filter({ hasText: /Yenifer/i }).first().click()
            await page.waitForTimeout(400)
        }

        // Seleccionar cliente común
        const clienteCombobox = page.getByTestId('combobox-cliente')
        await clienteCombobox.click()
        await page.waitForTimeout(600)
        await page.getByText(CLIENTE_COMUN.nombre_fiscal).first().click()

        const concepto = page.locator('input[placeholder*="Concepto"]').first()
        await concepto.fill('E2E Vision Global - Cliente Comun')
        const precios = page.locator('input[type="number"]')
        if (await precios.count() >= 2) await precios.nth(1).fill('75')

        await page.getByRole('button', { name: /emitir factura/i }).click()
        await page.getByRole('button', { name: /sí, emitir|confirmar|emitir/i }).click({ timeout: 10000 })
        await expect(page).toHaveURL(/\/ventas\/facturas/, { timeout: 20000 })
    })
})