# Correcciones para la Creación de Clientes y Facturas

He resuelto los problemas que bloqueaban la creación de clientes y facturas. Aquí tienes un resumen de los cambios y la verificación.

## 1. Error "Empresa no encontrada" corregido
El error era causado por permisos insuficientes para el rol `authenticated` en la tabla `empresas` y el uso de un cliente de Supabase no autenticado en algunas páginas.
- **Cambio**: Se añadieron permisos de `SELECT` a la tabla `empresas` para el rol `authenticated`.
- **Cambio**: Se actualizó `DashboardPage` y otras vistas para usar el cliente autenticado en lugar del cliente de administración donde fuera necesario.

## 2. Error 500 en la Creación de Clientes
El error ocurría debido a que los errores de validación de Zod no se manejaban correctamente en el servidor.
- **Cambio**: Se mejoró el manejo de errores en `crearClienteAction` para capturar `ZodError` y devolver mensajes amigables al usuario.
- **Cambio**: Se consolidó el tipo `Cliente` en todo el proyecto para evitar errores de TypeScript.

## 3. Restricción de Número de Factura (Auto-numeración)
Las facturas fallaban al crearse porque el campo `numero` no podía ser nulo y no había una lógica técnica para generarlo automáticamente.
- **Cambio**: He implementado una función de Postgres `asignar_numero_factura()` y un Trigger en la base de datos.
- **Cambio**: Ahora, al insertar una factura, el sistema busca automáticamente la serie predeterminada de la empresa, genera el siguiente número formateado (ej. `FAC-000001`) e incrementa el contador en `series_facturacion`.

## 4. Interfaz Premium (Premium UI)
Para cumplir con los estándares de diseño de alta calidad:
- **Cambio**: He añadido una variante `premium` al componente `Button` que incluye degradados modernos, sombras suaves y micro-animaciones (escala y elevación).
- **Cambio**: Se han actualizado los botones principales de la aplicación para usar este nuevo estilo.

## Verificación Final
He verificado el flujo completo:
1.  **Creación de Cliente**: Creado con éxito "Cliente Exitoso SL".
2.  **Emisión de Factura**: Emitida factura por 5.000,00 € + IVA (Total: 6.050,00 €).
3.  **Numeración**: Se asignó correctamente el número `FAC-000001`.
4.  **Dashboard**: Se confirmó que los KPIs se actualizan en tiempo real:
    - **Ventas Mensuales**: 6.050,00 €
    - **Nº Facturas**: 1

### Evidencias:
- **Dashboard Actualizado**: `dashboard_new_button_1770647317605.png`
- **Lista de Clientes Premium**: `clients_list_new_button_1770647339627.png`
