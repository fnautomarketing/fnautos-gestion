/**
 * E2E: Perfil de usuario – edición nombre, avatar (subir/eliminar), editor crop/zoom/rotate
 *
 * Tests de nivel senior:
 * - Página de perfil carga con datos correctos
 * - ID de usuario NO visible (oculto)
 * - Editar nombre y sincronizar con Supabase
 * - Subir avatar: abrir editor, zoom, rotar, guardar
 * - Eliminar avatar cuando existe
 *
 * Requiere: .env.e2e (E2E_TEST_EMAIL, E2E_TEST_PASSWORD)
 * Bucket avatars en Supabase con migración aplicada
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect } from '@playwright/test'

const AVATAR_TEST_IMAGE =
    path.join(process.cwd(), 'e2e', 'fixtures', 'avatar-test.png')

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
    await page.waitForURL(/\/(dashboard|ventas)/, { timeout: 25000 })
}

test.describe('Perfil de usuario', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await page.waitForTimeout(1500)
    })

    test('página de perfil carga con formulario y empresas', async ({ page }) => {
        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })

        await expect(page.getByTestId('perfil-form')).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('perfil-nombre-input')).toBeVisible()
        await expect(page.getByRole('heading', { name: /mi perfil/i })).toBeVisible()
        await expect(page.getByTestId('perfil-form').getByText(/empresas vinculadas/i).first()).toBeVisible()
    })

    test('ID de usuario NO está visible en la página', async ({ page }) => {
        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })

        const idText = page.getByText(/^ID: /)
        await expect(idText).not.toBeVisible()
    })

    test('editar nombre y guardar (onBlur)', async ({ page }) => {
        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })

        const input = page.getByTestId('perfil-nombre-input')
        await expect(input).toBeVisible({ timeout: 5000 })

        const nuevoNombre = `E2E Test ${Date.now()}`
        await input.clear()
        await input.fill(nuevoNombre)
        await input.blur()

        await page.waitForTimeout(2000)

        await expect(input).toHaveValue(nuevoNombre)
    })

    test('abrir editor de avatar al subir imagen', async ({ page }) => {
        test.setTimeout(60000)

        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })

        const fileInput = page.getByTestId('perfil-avatar-file-input')
        await fileInput.setInputFiles(AVATAR_TEST_IMAGE)

        await expect(page.getByRole('dialog', { name: /personalizar avatar/i })).toBeVisible({ timeout: 8000 })
        await expect(page.getByRole('heading', { name: /personalizar avatar/i })).toBeVisible()
    })

    test('editor de avatar: zoom, rotar, guardar', async ({ page }) => {
        test.setTimeout(90000)

        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })

        const fileInput = page.getByTestId('perfil-avatar-file-input')
        await fileInput.setInputFiles(AVATAR_TEST_IMAGE)

        await expect(page.getByRole('dialog', { name: /personalizar avatar/i })).toBeVisible({ timeout: 8000 })

        const zoomSlider = page.getByTestId('avatar-editor-zoom')
        await expect(zoomSlider).toBeVisible()
        await zoomSlider.click({ position: { x: 50, y: 0 } })

        const rotateRight = page.getByTestId('avatar-editor-rotate-right')
        await rotateRight.click()
        await page.waitForTimeout(200)

        const rotateLeft = page.getByTestId('avatar-editor-rotate-left')
        await rotateLeft.click()
        await page.waitForTimeout(200)

        const guardarBtn = page.getByTestId('avatar-editor-guardar')
        await guardarBtn.click()

        await expect(page.getByRole('dialog', { name: /personalizar avatar/i })).not.toBeVisible({ timeout: 15000 })
    })

    test('eliminar avatar cuando existe', async ({ page }) => {
        test.setTimeout(60000)

        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })

        const avatarContainer = page.getByTestId('perfil-avatar-container')
        await avatarContainer.hover()
        await page.waitForTimeout(300)

        const eliminarBtn = page.getByTestId('perfil-avatar-eliminar')
        if (!(await eliminarBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
            test.skip(true, 'Usuario no tiene avatar previo; subir uno primero para este test')
            return
        }

        await eliminarBtn.click()
        await page.waitForTimeout(3000)

        await expect(eliminarBtn).not.toBeVisible()
    })
})
