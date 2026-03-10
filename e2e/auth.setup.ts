import { test as setup } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.auth/user.json')

setup('authenticate', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL
    const password = process.env.E2E_TEST_PASSWORD

    if (!email || !password) {
        console.warn('E2E_TEST_EMAIL y E2E_TEST_PASSWORD no definidos. Saltando autenticación.')
        return
    }

    await page.goto('/login')
    await page.getByPlaceholder(/usuario@|email/i).fill(email)
    await page.getByPlaceholder(/••••/).fill(password)
    await page.getByRole('button', { name: /acceder al portal|iniciar|entrar/i }).click()
    await page.waitForURL(/dashboard|ventas/, { timeout: 15000 })
    await page.context().storageState({ path: authFile })
})
