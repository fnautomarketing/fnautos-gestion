/**
 * E2E: Seguridad – auth y acceso no autorizado
 * VER-001: Acceso sin login → redirección a /login
 * VER-002: Usuario A no accede a datos de empresa B
 * VER-003: API sin sesión → 401 o redirección
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') })

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.describe('Seguridad: Auth', () => {
    test('VER-001: Acceso a /dashboard sin login redirige a /login', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 })
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })

    test('VER-001: Acceso a /perfil sin login redirige a /login', async ({ page }) => {
        await page.goto('/perfil', { waitUntil: 'networkidle', timeout: 15000 })
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })

    test('VER-002: Usuario A no accede a datos de empresa B (API clientes/search)', async ({
        request,
        page,
    }) => {
        const nonAdminEmail = process.env.E2E_NON_ADMIN_EMAIL
        const nonAdminPassword = process.env.E2E_NON_ADMIN_PASSWORD
        if (!nonAdminEmail || !nonAdminPassword) {
            test.skip(true, 'E2E_NON_ADMIN_EMAIL y E2E_NON_ADMIN_PASSWORD no configurados')
        }
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
        await page.fill('input[name="email"]', nonAdminEmail!)
        await page.fill('input[name="password"]', nonAdminPassword!)
        await page.click('button[type="submit"]')
        await page.waitForURL(/dashboard|ventas/, { timeout: 10000 })
        const cookies = await page.context().cookies()
        const res = await request.get(
            `${BASE_URL}/api/clientes/search?empresa_id=00000000-0000-0000-0000-000000000001`,
            {
                headers: { Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; ') },
                failOnStatusCode: false,
            }
        )
        expect(res.status()).toBe(403)
    })

    test('VER-003: API export clientes sin sesión devuelve error o redirección', async ({
        request,
    }) => {
        const res = await request.get(
            `${BASE_URL}/api/ventas/clientes/export?format=xlsx`,
            { failOnStatusCode: false }
        )
        expect([301, 302, 307, 401, 403, 500]).toContain(res.status())
    })

    test('VER-003: API dev en producción devuelve 403', async ({ request }) => {
        const res = await request.get(`${BASE_URL}/api/dev/save-pdf-factura`, {
            failOnStatusCode: false,
        })
        if (process.env.NODE_ENV === 'production') {
            expect(res.status()).toBe(403)
        } else {
            expect([200, 302, 307, 401, 403, 404]).toContain(res.status())
        }
    })
})
