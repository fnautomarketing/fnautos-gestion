# Especificación de Autenticación y Gestión de Usuarios

## Resumen
Este documento detalla los flujos de autenticación y gestión de sesiones para el ERP STVLS. Define los requisitos para el inicio de sesión, el cierre de sesión, la persistencia de la sesión y la seguridad general del acceso.

## 1. Inicio de Sesión (Login)

### Flujo de Usuario
1.  El usuario navega a la ruta `/login`.
2.  Se presenta un formulario de inicio de sesión centrado con campos para "Email" y "Contraseña".
3.  El usuario introduce sus credenciales.
4.  Al enviar el formulario, el sistema valida las credenciales contra Supabase Auth.
5.  **Éxito:** El usuario es redirigido al Dashboard principal (`/dashboard`). Se muestra una notificación de éxito.
6.  **Fallo:** Se muestra un mensaje de error claro (e.g., "Credenciales inválidas", "Usuario no encontrado") sin revelar detalles sensibles de seguridad.

### Requisitos Técnicos
-   **Validación de Formulario:** Validación en cliente para formato de email y campos requeridos.
-   **Seguridad:** Uso de HTTPS. Las contraseñas nunca se almacenan en texto plano.
-   **Persistencia:** La sesión debe persistir entre recargas del navegador (uso de cookies/local storage gestionado por Supabase).
-   **Diseño:** Debe seguir el estándar de diseño "Premium" definido en el proyecto (colores corporativos, espaciado adecuado, feedback visual al interactuar).

## 2. Cierre de Sesión (Logout)

### Flujo de Usuario
1.  El usuario hace clic en su avatar/perfil en la barra lateral o menú de navegación.
2.  Selecciona la opción "Cerrar sesión".
3.  El sistema invalida la sesión actual.
4.  El usuario es redirigido inmediatamente a la página de `/login`.
5.  Se limpia cualquier estado local sensible.

## 3. Protección de Rutas

### Reglas
-   Todas las rutas bajo `/dashboard` y sus subrutas (e.g., `/ventas`, `/rrhh`) están protegidas.
-   Si un usuario no autenticado intenta acceder a una ruta protegida, debe ser redirigido a `/login`.
-   **Middleware:** Un middleware de Next.js debe interceptar las solicitudes y verificar la existencia de una sesión de Supabase válida antes de renderizar la página.

## 4. Recuperación de Contraseña (Futuro)
-   [ ] Implementar flujo de "Olvidé mi contraseña" mediante envío de correo electrónico con enlace de restablecimiento.

## Verificación

### Pruebas Manuales
-   [ ] Intentar acceder a `/dashboard` sin loguearse -> Redirección a `/login`.
-   [ ] Loguearse con credenciales correctas -> Redirección a `/dashboard`.
-   [ ] Loguearse con credenciales incorrectas -> Mensaje de error visible.
-   [ ] Cerrar sesión -> Redirección a `/login` y no poder volver atrás con el botón del navegador.
