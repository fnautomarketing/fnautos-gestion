# Seguridad – Mejoras Continuas (SEC-016 a SEC-020)

Documento de referencia para tareas de seguridad de bajo impacto y mejora continua.

---

## SEC-016: Integrar Snyk o similar en CI

**Estado:** Pendiente de configuración

**Pasos:**
1. Crear cuenta en [Snyk](https://snyk.io/)
2. Ejecutar `npx snyk test` localmente
3. Añadir workflow en `.github/workflows/` que ejecute Snyk en cada push/PR
4. Alternativa: usar `npm audit` (ya integrado en `npm run security:audit`)

**Scripts disponibles:**
- `npm run security:audit` – ejecuta `npm audit`
- `npm run security:check` – build + audit + tests unitarios

---

## SEC-017: Revisar dependencias con npm outdated

**Estado:** Script disponible

**Uso:**
```bash
npm run security:outdated
```

Revisar periódicamente (mensual) y actualizar dependencias con `npm update` o actualizaciones manuales de majors.

---

## SEC-018: Considerar MFA para usuarios admin

**Estado:** Recomendación

Supabase Auth soporta MFA. Para habilitar:
1. Dashboard Supabase → Authentication → Providers → habilitar MFA
2. Configurar TOTP (Google Authenticator, etc.)
3. Documentar proceso para admins

---

## SEC-019: Política de contraseñas (Supabase Auth)

**Estado:** Configurable en Supabase

En Dashboard → Authentication → Settings:
- Mínimo de caracteres
- Requerir mayúsculas, números, símbolos
- Expiración de contraseña (opcional)

---

## SEC-020: Backups y recuperación ante desastres

**Estado:** Responsabilidad de infraestructura

- **Supabase:** Backups automáticos según plan (ver dashboard)
- **Vercel:** Deployments versionados; rollback disponible
- **Recomendación:** Documentar procedimiento de recuperación y probarlo anualmente
