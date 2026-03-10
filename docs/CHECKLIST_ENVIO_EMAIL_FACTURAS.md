# Checklist: Envío de Facturas por Email

## Configuración Resend

- [x] Cuenta Resend creada
- [x] API Key configurada en `.env.local`
- [x] Dominio `stvls.com` verificado en Resend
- [x] Registros DNS (DKIM, SPF, MX) añadidos en Hostinger
- [x] `RESEND_FROM=Facturación <administracion@stvls.com>` configurado

## Funcionalidad App

- [x] Botón "Enviar Email" en detalle de factura
- [x] Página `/ventas/facturas/[id]/email` con formulario
- [x] Campo "Para" con email_principal y email_secundario del cliente
- [x] Badges clicables para rellenar destinatario
- [x] Validación de emails (cliente + servidor)
- [x] PDF adjunto generado automáticamente
- [x] Empresa real cargada (no MOCK)
- [x] Soporte Vision Global (multiempresa)
- [x] Botón deshabilitado para borradores y anuladas
- [x] Botón Email en panel PDF enlazado a página de envío
- [x] Historial de envíos en `emails_factura`

## Pruebas

- [x] Correo de prueba enviado a administracion@stvls.com
- [x] Factura Villegas (F2026-F2026000001) enviada a j.e.bolanos@hotmail.com con PDF adjunto
- [x] Factura YENIFER (Y2026-0001) enviada a j.e.bolanos@hotmail.com con PDF adjunto
- [x] Factura EDISON (E2026-000001) enviada a j.e.bolanos@hotmail.com con PDF adjunto

## Notas

- API seed + envío: `POST /api/dev/seed-facturas-y-enviar` crea facturas si faltan y envía las 3.
- API solo envío: `POST /api/dev/send-3-facturas-email` con body `{"to":"email@ejemplo.com"}`
