# Task 08: Envío de Facturas por Email (Fase Final)

## Objetivo
Implementar el envío de facturas por correo electrónico directamente desde el ERP, adjuntando el PDF generado automáticamente.

## Requisitos Funcionales
1. **Acción de Envío**:
   - En el detalle de la factura, añadir botón "Enviar por Email".
   - Abrir un modal con los campos pre-rellenados.

2. **Modal de Envío**:
   - **Para**: Email del cliente (si existe). Editable.
   - **CC**: Opcional.
   - **Asunto**: "Factura {serie}-{numero} - {nombre_empresa}".
   - **Mensaje**: Plantilla por defecto ("Adjunto le remitimos la factura...").
   - **Adjunto**: Mostrar que se adjuntará el PDF (icono visual).
   - **Validación**: No permitir enviar si no hay API Key configurada.

3. **Backend (Resend)**:
   - Configurar API Key de Resend en `.env.local` (Pendiente de recibir key del cliente).
   - Utilizar el servidor de correo configurado.
   - Registrar el evento de envío en `eventos_factura` y `emails_factura` (auditoría).

## Checklist de Implementación
- [ ] Configurar `RESEND_API_KEY` en Vercel/Local (Cuando se reciba).
- [ ] Revisar `src/app/actions/email.tsx` y adaptar para usar datos reales de la factura.
- [ ] Crear componente `EnviarFacturaModal`.
- [ ] Integrar botón en `facturas/[id]/page.tsx`.
- [ ] Verificación: Enviar factura a un correo de prueba (ej: el del desarrollador) y confirmar recepción con PDF adjunto.

## Plan de Pruebas (Chrome DevTools Expert)
- [ ] **Network**: Analizar la petición XHR al enviar el email (tiempo de respuesta del server action).
- [ ] **Console**: Verificar manejo de errores si falla el envío (ej: API Key inválida).
- [ ] **Performance**: Asegurar que la apertura del modal no bloquea el hilo principal.
