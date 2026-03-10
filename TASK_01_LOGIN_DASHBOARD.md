# Task 01: Verificación Visual y UX - Login y Dashboard

## Objetivo
Verificar que la experiencia de entrada sea premium, fluida y sin errores visuales.

## Checklist

### 1. Login (`/login`)
- [ ] Hero image carga correctamente con animaciones suaves.
- [ ] Formulario centrado verticalmente en desktop.
- [ ] Responsive en móvil: el hero debe ocultarse y el formulario ocupar el ancho.
- [ ] Validación de campos (Zod) muestra mensajes de error estilizados.
- [ ] Botón "Acceder al Portal" tiene el estilo premium (degradados/micro-animaciones).
- [ ] Redirección automática al Dashboard tras login exitoso.

### 2. Dashboard (`/dashboard`)
- [ ] Los 4 KPI cards (Ventas Mensuales, Clientes, Facturas, Pagos) se ven sin superposición.
- [ ] El selector de "Todas las Empresas" funciona y agrega los datos correctamente.
- [ ] Scroll suave en toda la página.
- [ ] Botón "Nueva Factura" accesible en la parte superior derecha.
- [ ] Sidebar no tapa contenido al estar expandido.
- [ ] Header se mantiene fijo o no interfiere con los KPI cards.
- [ ] Verificación de temas: Correcta visualización en modo claro y modo oscuro.

## Instrucciones para el Agente
1. Abrir navegador en `localhost:3000/login`.
2. Capturar screenshots del login (desktop y móvil).
3. Realizar login y navegar al dashboard.
4. Capturar screenshot del dashboard completo (viewport y scroll).
5. Documentar cualquier hallazgo en `TASK_V01_REPORT.md` o actualizar el estado en este archivo.
