import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.e2e')
dotenv.config({ path: envPath })

/**
 * Configuración Playwright para tests E2E.
 * Ejecutar: npx playwright test
 * Con UI: npx playwright test --ui
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    timeout: 60000,
    reporter: [['html', { outputFolder: 'playwright-report' }]],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['iPhone 12'] } },
        { name: 'tablet', use: { ...devices['iPad Pro 11'] } },
    ],
    webServer: process.env.CI
        ? undefined
        : {
              command: 'npm run dev',
              url: 'http://localhost:3000',
              reuseExistingServer: !process.env.CI,
              timeout: 120000,
          },
})
