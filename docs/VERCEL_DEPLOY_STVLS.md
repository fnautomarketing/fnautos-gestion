# Deploy Vercel – Solo STVLS (este proyecto)

> **Nota:** La producción está en **Hostinger**. Esta guía es solo para previews o entornos alternativos. Ver `docs/DEPLOY_HOSTINGER.md` para producción.

Este proyecto debe desplegarse **solo** en el equipo y dominio de STVLS.

**Estado:** `.vercel/project.json` está configurado con el equipo **stvls-gestions-projects** y el proyecto **stvls-erp**. El MCP de Vercel en este proyecto usa esa configuración para listar deployments, ver el proyecto y desplegar.

## Objetivo

| Concepto | Valor |
|----------|--------|
| **Equipo Vercel** | `stvls-gestions-projects` |
| **Proyecto** | `stvls-erp` |
| **Dominio** | `stvls-erp.vercel.app` |
| **URL de deployment** | `https://stvls-XXXX-stvls-gestions-projects.vercel.app` |

## Primera vez (o si cambias de cuenta)

1. Iniciar sesión en la cuenta de Vercel que tenga el equipo **stvls-gestions-projects**:
   ```bash
   npx vercel login
   ```
   Si al enlazar ves **"The specified scope does not exist"**, es que la CLI está usando otra cuenta (por ejemplo fnautomarketings-projects). Cierra sesión si hace falta (`vercel logout`) y vuelve a hacer `vercel login` con la cuenta de STVLS.

2. Enlazar este repo al proyecto correcto (solo hace falta una vez):
   ```bash
   npm run vercel:link
   ```
   o:
   ```bash
   npx vercel link --yes --scope stvls-gestions-projects --project stvls-erp
   ```

3. Desplegar:
   ```bash
   npx vercel deploy --prod
   ```
   o solo preview:
   ```bash
   npx vercel deploy
   ```

## Comprobar enlace

- Debe existir `.vercel/project.json` con `orgId` del equipo **stvls-gestions-projects**.
- Tras un deploy correcto, la app debe estar en **https://stvls-erp.vercel.app**.

## Git author (permisos Vercel)

Vercel exige que el **autor del commit** tenga acceso al equipo. Si el deploy falla con:

```
Error: Git author tu@email.com must have access to the team STVLS-GESTION's projects on Vercel to create deployments.
```

Configurar un autor con acceso al equipo (ej. administracion@stvls.com):

```bash
git config --local user.email "administracion@stvls.com"
git config --local user.name "STVLS"
```

Luego hacer un nuevo commit y volver a desplegar.

## Variables de entorno en Vercel

En el proyecto de Vercel (stvls-erp, equipo stvls-gestions-projects) configurar al menos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `RESEND_FROM` (si se usan emails)
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (recomendado): evita "Server Action was not found" tras deploys. Generar con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
  Añadir el valor en Vercel → Project Settings → Environment Variables (Production, Preview, Development).
