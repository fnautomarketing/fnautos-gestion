# Guía de Pruebas Manuales - Paso 1: Autenticación

Este es el primer paso para probar la plataforma STVLS ERP. Sigue estas instrucciones para verificar el flujo de inicio y cierre de sesión.

## Prerrequisitos
- Tener el servidor de desarrollo corriendo (`npm run dev`).
- Acceder a `http://localhost:3000`.

## Pasos de la Prueba

### 1. Inicio de Sesión (Login)
1. Abre tu navegador y navega a `http://localhost:3000/login`.
2. Introduce tus credenciales corporativas:
   - **Email**: `[TU_EMAIL]`
   - **Contraseña**: `[TU_CONTRASEÑA]`
3. Haz clic en el botón **"Acceder al Portal"**.
4. **Verificación**: 
   - Deberías ver un mensaje de éxito ("¡Bienvenido!").
   - Deberías ser redirigido automáticamente al dashboard (`/dashboard`).
   - La barra lateral (Sidebar) y la barra superior (Navbar) deben ser visibles.

### 2. Navegación Post-Login
1. Abre una nueva pestaña en el navegador y navega a `http://localhost:3000/login`.
2. **Verificación**: El sistema debería redirigirte automáticamente al `/dashboard` (o mantenerte en él), ya que la sesión ya está activa (manejado por el middleware).

### 3. Cierre de Sesión (Logout)
1. En el dashboard, haz clic en tu perfil/nombre de usuario en la esquina superior derecha (Navbar).
2. Se abrirá un menú desplegable. Haz clic en **"Cerrar Sesión"**.
3. **Verificación**:
   - Deberías ver un mensaje confirmando el cierre de sesión ("Sesión cerrada correctamente").
   - Deberías ser redirigido automáticamente a la página de inicio de sesión (`/login`).

### 4. Verificación de Protección de Rutas
1. Con la sesión cerrada, intenta navegar directamente a `http://localhost:3000/dashboard`.
2. **Verificación**: El sistema debe redirigirte automáticamente a `/login`, impidiendo el acceso a áreas protegidas sin autenticación.

---
**Siguiente paso sugerido**: Una vez verificado el login, seguiremos con la prueba de visualización de datos en el Dashboard.
