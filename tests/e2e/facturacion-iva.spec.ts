import { test, expect } from '@playwright/test'

test.describe('Pruebas Senior: Facturación sin IVA', () => {
  
  test('Debería crear una factura correctamente al desactivar el IVA (Bugfix: fecha_vencimiento)', async ({ page }) => {
    // 1. Login
    await page.goto('/login')
    
    // Usar locators más robustos basados en lo visto en snapshots
    const emailInput = page.locator('input[placeholder*="usuario@stvlogistics.com"]').or(page.locator('input[type="email"]')).first()
    await emailInput.fill('info@fnautos.es')
    
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('FNAutos2026!Admin')
    
    await page.click('button:has-text("ACCEDER AL PORTAL")')

    // Esperar al dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 })

    // 2. Navegar a creación de factura
    await page.goto('/ventas/facturas/nueva')
    await expect(page.locator('h1:has-text("Nueva Factura")')).toBeVisible()

    // 3. Seleccionar cliente
    const clienteSelectBtn = page.locator('button:has-text("Seleccionar cliente...")')
    await clienteSelectBtn.click()
    
    // Esperar al diálogo y seleccionar el primero
    await page.waitForSelector('input[placeholder*="Buscar cliente"]')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    
    // 4. Añadir línea de factura
    await page.fill('input[placeholder*="Descripción del servicio"]', 'Servicio Técnico Senior E2E')
    
    // El precio suele ser un input numérico. Buscamos por el valor '0' inicial o por tipo
    const precioInput = page.locator('input[type="number"]').or(page.locator('input[value="0"]')).first()
    await precioInput.fill('500')

    // 5. Desactivar IVA
    const ivaToggle = page.locator('button[role="switch"]:has-text("Aplicar IVA")')
    const isChecked = await ivaToggle.getAttribute('aria-checked') === 'true'
    if (isChecked) {
        await ivaToggle.click()
    }
    
    // 6. Emitir factura
    await page.click('button:has-text("Emitir Factura")')
    
    // 7. Confirmar en el diálogo
    const confirmBtn = page.locator('button:has-text("Sí, emitir factura")')
    await confirmBtn.click()

    // 8. Verificar éxito y redirección
    await page.waitForURL(/\/ventas\/facturas\/.+/, { timeout: 15000 })
    
    // Validar resultado
    await expect(page.locator('text=Emitida')).toBeVisible()
    await expect(page.locator('text=Servicio Técnico Senior E2E')).toBeVisible()
    await expect(page.locator('text=500,00')).toBeVisible()
  })
})
