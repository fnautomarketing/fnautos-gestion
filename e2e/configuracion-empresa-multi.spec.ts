/**
 * Tests E2E: Configuración de empresa en contexto multi-empresa
 *
 * Verifica que al cambiar datos de una empresa secundaria (Edison) desde
 * Configuración › Empresa, el save actualiza esa empresa y NO la empresa
 * del perfil del usuario (Villegas), evitando el error:
 *   "duplicate key value violates unique constraint empresas_cif_key_active"
 *
 * Credenciales en .env.e2e (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect, type Page } from '@playwright/test'

const EMPRESA_VILLEGAS_ID = '4b77324c-a10e-4714-b0a4-df4b9c5f6ca5'
const LUGAR_TEST_TIMESTAMP = `Barcelona-E2E-${Date.now()}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Cambia la empresa activa en el header usando el selector */
async function cambiarEmpresa(page: Page, empresaId: string) {
    const selector = page.getByTestId('empresa-selector-trigger')
    if (!(await selector.isVisible({ timeout: 5000 }).catch(() => false))) return
    await selector.click()
    await page.waitForTimeout(400)
    const opcion = page.getByTestId(`empresa-option-${empresaId}`)
    if (await opcion.isVisible({ timeout: 3000 }).catch(() => false)) {
        await opcion.click()
        await page.waitForTimeout(400)
        // Confirmar diálogo de cambio si aparece
        const confirmBtn = page.getByTestId('confirm-dialog-confirm')
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.click()
            await page.waitForURL(/\/dashboard/, { timeout: 15000 })
            await page.waitForTimeout(1500)
        }
    }
}

/** Lee el lugar_expedicion actual del formulario de configuración */
async function getLugarExpedicion(page: Page): Promise<string> {
    return (await page.locator('#lugar_expedicion').inputValue()) ?? ''
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Configuración Empresa – multi-empresa', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1000)
    })

    test('la página Configuración Empresa muestra el formulario', async ({ page }) => {
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(
            page.getByRole('heading', { name: /configuraci[oó]n de empresa/i })
        ).toBeVisible({ timeout: 10000 })
        // Debe haber un campo CIF/NIF
        await expect(page.locator('#cif')).toBeVisible({ timeout: 5000 })
        // Botón de guardar
        await expect(
            page.getByRole('button', { name: /guardar cambios/i })
        ).toBeVisible({ timeout: 5000 })
    })

    test('el formulario muestra el botón Descargar datos fiscales', async ({ page }) => {
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(
            page.getByTestId('btn-descargar-datos-fiscales')
        ).toBeVisible({ timeout: 10000 })
    })

    test('guarda lugar_expedicion en la empresa activa (Villegas)', async ({ page }) => {
        // Asegurarse de estar en Villegas
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.locator('#lugar_expedicion')).toBeVisible({ timeout: 10000 })

        const lugarAnterior = await getLugarExpedicion(page)

        // Actualizar lugar_expedicion
        await page.locator('#lugar_expedicion').fill(LUGAR_TEST_TIMESTAMP)
        await page.getByRole('button', { name: /guardar cambios/i }).click()

        // Debe aparecer toast de éxito (sin error de duplicate key)
        const toast = page.locator('[data-sonner-toast], [role="status"], [role="alert"]')
        await expect(toast.first()).toBeVisible({ timeout: 15000 })
        const toastText = await toast.first().textContent()
        expect(toastText?.toLowerCase()).not.toMatch(/error|forbidden|duplicate/i)
        expect(toastText?.toLowerCase()).toMatch(/actualiz|guardad|correcto/i)

        // Verificar que persiste tras reload
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 })
        const lugarGuardado = await getLugarExpedicion(page)
        expect(lugarGuardado).toBe(LUGAR_TEST_TIMESTAMP)

        // Limpieza: restaurar valor anterior
        await page.locator('#lugar_expedicion').fill(lugarAnterior)
        await page.getByRole('button', { name: /guardar cambios/i }).click()
        await page.waitForTimeout(2000)
    })

    test('cambio de empresa en header se refleja en Configuración (datos distintos)', async ({ page }) => {
        // Ir a Configuración con la empresa por defecto (Villegas)
        await cambiarEmpresa(page, EMPRESA_VILLEGAS_ID)
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.locator('#cif')).toBeVisible({ timeout: 10000 })
        const cifVillegas = await page.locator('#cif').inputValue()

        // Seleccionar Edison mediante el selector del header (busca por nombre si no conocemos el ID)
        const selector = page.getByTestId('empresa-selector-trigger')
        if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
            await selector.click()
            await page.waitForTimeout(400)

            // Buscar la opción de Edison por texto
            const edisonOpt = page.getByRole('option', { name: /edison/i })
                .or(page.locator('[data-testid^="empresa-option-"]').filter({ hasText: /edison/i }))
            if (await edisonOpt.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                await edisonOpt.first().click()
                await page.waitForTimeout(400)
                const confirmBtn = page.getByTestId('confirm-dialog-confirm')
                if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await confirmBtn.click()
                    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
                    await page.waitForTimeout(1500)
                }

                // Volver a Configuración con Edison
                await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
                await expect(page.locator('#cif')).toBeVisible({ timeout: 10000 })
                const cifEdison = await page.locator('#cif').inputValue()

                // Los CIFs deben ser distintos (son empresas distintas)
                expect(cifEdison).not.toBe(cifVillegas)
            } else {
                // Si no hay selector de Edison disponible para este usuario, marcar como omitido
                test.skip(true, 'Empresa Edison no disponible en este contexto de usuario')
            }
        }
    })

    test('guardar en Edison no lanza error de duplicate key (regresión)', async ({ page }) => {
        // Intentar cambiar a Edison
        const selector = page.getByTestId('empresa-selector-trigger')
        if (!(await selector.isVisible({ timeout: 3000 }).catch(() => false))) {
            test.skip(true, 'Selector de empresa no visible')
            return
        }

        await selector.click()
        await page.waitForTimeout(400)
        const edisonOpt = page.locator('[data-testid^="empresa-option-"]').filter({ hasText: /edison/i })
        if (!(await edisonOpt.first().isVisible({ timeout: 3000 }).catch(() => false))) {
            test.skip(true, 'Empresa Edison no disponible para este usuario')
            return
        }
        await edisonOpt.first().click()
        await page.waitForTimeout(400)
        const confirmBtn = page.getByTestId('confirm-dialog-confirm')
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmBtn.click()
            await page.waitForURL(/\/dashboard/, { timeout: 15000 })
            await page.waitForTimeout(1500)
        }

        // Ir a Configuración
        await page.goto('/ventas/configuracion/empresa', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.locator('#lugar_expedicion')).toBeVisible({ timeout: 10000 })

        // Modificar lugar_expedicion y guardar
        const lugarAnterior = await getLugarExpedicion(page)
        await page.locator('#lugar_expedicion').fill('Barcelona')
        await page.getByRole('button', { name: /guardar cambios/i }).click()

        // Verificar que NO hay error de duplicate key
        const toast = page.locator('[data-sonner-toast], [role="status"], [role="alert"]')
        await expect(toast.first()).toBeVisible({ timeout: 15000 })
        const toastText = (await toast.first().textContent()) ?? ''
        expect(toastText.toLowerCase()).not.toMatch(/duplicate|forbidden|error/i)
        expect(toastText.toLowerCase()).toMatch(/actualiz|guardad|correcto/i)

        // Restaurar
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 })
        await page.locator('#lugar_expedicion').fill(lugarAnterior)
        await page.getByRole('button', { name: /guardar cambios/i }).click()
        await page.waitForTimeout(2000)
    })
})
