# TASK 04: Entorno y Deploy

## Objetivo
Controlar los secretos de Vercel/Local y generar una huella `.env.example` limpia para no enviar tokens de STVLS accidentalmente a la plantilla de un cliente.

## Checklist
- [x] Leer el `.env.local` actual provisto por el usuario.
- [x] Crear `/📁 .env.example` listando las claves.
- [x] Integrar variables globales base como `NEXT_PUBLIC_CLIENT_ID=fnautos`.
- [x] Actualizar README.md principal del repositorio sobre el flujo (Vercel + Supabase).
- [x] **QA Senior:** TypeScript compila sin errores (`npx tsc --noEmit` exit code 0). `@types/node` instalado. Variables de entorno documentadas con instrucciones claras.
