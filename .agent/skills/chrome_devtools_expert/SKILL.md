---
name: chrome_devtools_expert
description: Skill para utilizar las herramientas de Chrome DevTools para auditorías de performance, red y debugging avanzado.
---

# Chrome DevTools Expert Skill

Esta skill permite realizar análisis técnicos profundos del frontend del ERP utilizando el protocolo CDP a través de MCP.

## 1. Auditorías de Performance
- **Captura de Traces**: Usa `capture_performance_trace` para grabar interacciones lentas.
- **Análisis de Vitals**: Revisa `LCP`, `FID`, y `CLS` directamente desde la consola.
- **Inspección de Traces**: Analiza el resultado de las capturas para identificar cuellos de botella en la ejecución de JS o renderizado.

## 2. Red y API
- **Console Logs**: Inspecciona errores de consola que no llegan al servidor.
- **Network Tracing**: Analiza el tiempo de respuesta de las peticiones a Supabase desde la perspectiva del cliente.

## 3. Screenshots & Visual Testing
- **Capturas de alta resolución**: Genera capturas de pantalla para verificar el diseño premium (Glassmorphism, sombras) en diferentes Viewports.
- **Debugging Visual**: Usa la herramienta para ver exactamente qué ve el usuario en estados de error complejos.

## Flujo de Trabajo Recomendado

1.  **Navegación**: `navigate(url)` a la página a auditar.
2.  **Preparación**: `capture_performance_trace()` antes de realizar la acción crítica.
3.  **Acción**: Realiza clics o scrolls necesarios.
4.  **Finalización**: Detén la captura y analiza el JSON resultante.
