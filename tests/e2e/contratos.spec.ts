import { test, expect } from '@playwright/test'

test.describe('Flujo E2E de Contratos de Compraventa y Firma Digital', () => {
  // Generar matrícula y bastidor aleatorios para evitar colisiones
  const matriculaTest = `1234${Math.random().toString(36).substring(2, 5).toUpperCase()}`
  const bastidorTest = `VSA${Math.random().toString(36).substring(2, 12).toUpperCase()}123`
  
  test('Debería crear un contrato, verificar el detalle y poder firmarlo (públicamente)', async ({ browser }) => {
    // 1. Usar un contexto para el concesionario (admin)
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()

    // Login
    await adminPage.goto('/login')
    await adminPage.fill('input[type="email"]', 'info@fnautos.es')
    await adminPage.fill('input[type="password"]', 'FNAutos2026!Admin')
    await adminPage.click('button[type="submit"]')

    // Esperar redirección al dashboard (ventas/estadisticas o inicio)
    await adminPage.waitForURL('**/dashboard**', { timeout: 15000 })
    await expect(adminPage).toHaveURL(/.*dashboard.*/)

    // 2. Navegar a creación de contrato
    await adminPage.goto('/ventas/contratos/nuevo')
    await expect(adminPage.locator('text=Detalles de la Operación')).toBeVisible()

    // 3. Rellenar formulario (Pestaña Operación)
    await adminPage.locator('button:has-text("Siguiente: Vendedor")').click()

    // Pestaña Vendedor (Al ser venta, somos nosotros, autocompleta el nombre)
    // Para simplificar el E2E, rellenamos manual al cliente (Vendedor = FN Autos, Comprador = Cliente)
    await adminPage.fill('input[name="vendedor_nombre"]', 'FN Autos E2E')
    await adminPage.fill('input[name="vendedor_nif"]', 'B12345678')
    await adminPage.locator('button:has-text("Siguiente: Comprador")').click()

    // Pestaña Comprador
    await adminPage.fill('input[name="comprador_nombre"]', 'Cliente E2E Comprador')
    await adminPage.fill('input[name="comprador_nif"]', '12345678Z')
    await adminPage.fill('input[name="comprador_email"]', 'cliente.e2e@fnautos.com')
    await adminPage.locator('button:has-text("Siguiente: Vehículo")').click()

    // Pestaña Vehículo
    await adminPage.fill('input[name="vehiculo_matricula"]', matriculaTest)
    await adminPage.fill('input[name="vehiculo_bastidor"]', bastidorTest)
    await adminPage.fill('input[name="vehiculo_marca"]', 'Test Automático E2E')
    await adminPage.fill('input[name="vehiculo_modelo"]', 'Modelo QA')
    await adminPage.locator('button:has-text("Siguiente: Datos Econ.")').click()

    // Pestaña Económica
    await adminPage.fill('input[name="precio_venta"]', '15500')
    await adminPage.locator('button:has-text("Siguiente: Cláusulas")').click()

    // Pestaña Cláusulas
    await adminPage.click('button:has-text("Generar Contrato (Borrador)")')

    // 4. Verificar redirección a Detalles del contrato
    await adminPage.waitForURL(/\/ventas\/contratos\/.+/)
    await expect(adminPage.locator('text=Borrador')).toBeVisible()
    
    // Validar que los datos creados aparecen
    await expect(adminPage.locator(`text=${matriculaTest}`)).toBeVisible()
    await expect(adminPage.locator('text=15.500')).toBeVisible()

    // 5. Enviar a firma (Cambia estado a Pendiente de firma y genera Link)
    await adminPage.click('button:has-text("Enviar para Firma")')
    
    // Esperar a que el estado cambie o aparezca el botón "Firma Presencial"
    await expect(adminPage.locator('text=Firma Presencial')).toBeVisible({ timeout: 10000 })
    await expect(adminPage.locator('text=Pendiente de Firma')).toBeVisible()

    // 6. Extraer el enlace de firma pública para el flujo del cliente
    // El enlace está en el href del botón "Firma Presencial"
    const firmaLink = await adminPage.locator('a:has-text("Firma Presencial")').getAttribute('href')
    expect(firmaLink).toBeTruthy()

    // 7. Usar un nuevo contexto (modo incógnito para el cliente)
    const clientContext = await browser.newContext()
    const clientPage = await clientContext.newPage()

    // El cliente abre el link de firma
    await clientPage.goto(firmaLink!)
    
    // Verificar UI pública de firma
    await expect(clientPage.locator('text=Firma de Documento Legal')).toBeVisible()
    await expect(clientPage.locator(`text=${matriculaTest}`)).toBeVisible()
    await expect(clientPage.locator(`text=15.500`)).toBeVisible()

    // Interacción con el lienzo de firma (SignatureCanvas)
    // Como el canvas de React es un bitmap, hacemos un drag&drop programático o mouse move
    const canvas = clientPage.locator('canvas.sigCanvas')
    await canvas.scrollIntoViewIfNeeded()
    
    const box = await canvas.boundingBox()
    if (box) {
      // Trazar una firma simulada
      await clientPage.mouse.move(box.x + 50, box.y + 50)
      await clientPage.mouse.down()
      await clientPage.mouse.move(box.x + 150, box.y + 80, { steps: 5 })
      await clientPage.mouse.move(box.x + 100, box.y + 120, { steps: 5 })
      await clientPage.mouse.up()
    }

    // Aceptar términos y condiciones
    await clientPage.click('button[role="checkbox"]')
    
    // Firmar y enviar
    await clientPage.click('button:has-text("Firmar Legalmente")')
    
    // 8. Verificar pantalla final de éxito para el cliente
    await expect(clientPage.locator('text=¡Contrato Firmado!')).toBeVisible({ timeout: 15000 })

    // Cerrar contextos
    await clientPage.close()
    
    // 9. Recargar la página del Admin y comprobar que el estado es "Firmado"
    await adminPage.reload()
    await expect(adminPage.locator('text=Firmado').first()).toBeVisible()
    await adminContext.close()
  })
})
