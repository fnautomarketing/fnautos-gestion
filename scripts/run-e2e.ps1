# Ejecutar tests E2E con credenciales
# Uso: .\scripts\run-e2e.ps1
# Nota: La contraseña con $ debe pasarse por variable (no .env)
$env:E2E_TEST_EMAIL = 'administracion@stvls.com'
$env:E2E_TEST_PASSWORD = 'TecM@s.$4'
npx playwright test e2e/facturas-series.spec.ts --reporter=list --timeout=60000
