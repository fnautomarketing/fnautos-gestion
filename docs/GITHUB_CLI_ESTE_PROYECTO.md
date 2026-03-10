# GitHub CLI y push solo en este proyecto

Para que **solo en este repositorio** uses la cuenta/token de GitHub de STVLS (y no mezcles con otros proyectos en otras carpetas), hay dos opciones.

## Opción 1: Token en archivo del proyecto (recomendada)

1. **Crea un token de GitHub** (cuenta con acceso a `stvlsmarketing-spec/stvls-erp`):
   - GitHub → Settings → Developer settings → Personal access tokens (o Fine-grained).
   - Permisos: al menos `repo` (o “Contents: Read and write” en fine-grained).

2. **En la raíz de este proyecto** crea el archivo `.github-token` y pega solo el token (una línea, sin comillas).  
   Ese archivo está en `.gitignore` y no se sube al repo.

3. **Configura Git para usar ese token solo aquí** (una vez por clon):

   ```powershell
   cd c:\stvls-erp-git
   git config --local credential.helper "!powershell -NoProfile -File scripts/git-credential-stvls.ps1"
   ```

4. A partir de ahí, **en este proyecto** `git push` usará el token de `.github-token`. En otros proyectos seguirás usando tu configuración normal (Credential Manager, etc.).

## Opción 2: Usar el token de `.env.local`

Si ya tienes `GITHUB_TOKEN=...` en `.env.local`, el script `scripts/git-credential-stvls.ps1` lo usa igual. Solo hace falta el paso 3 (configurar el credential helper local).

## Comprobar

- Desde este repo: `git push origin feature/working` (o la rama que uses) debería funcionar sin 403.
- Desde otra carpeta/repo: no se ve afectada; sigue usando tu configuración global.

## GitHub CLI (`gh`)

- **Autenticación:** Si quieres usar `gh` (issues, PRs, etc.) con la misma cuenta solo en este proyecto, en una terminal donde vayas a usar `gh`:

  ```powershell
  cd c:\stvls-erp-git
  $env:GITHUB_TOKEN = (Get-Content .github-token -Raw).Trim()
  gh repo view
  ```

  Así `gh` usa ese token solo en esa sesión y no cambia tu `gh auth` global.

- **Push:** El “push” sigue siendo con Git. Con el credential helper de arriba, `git push` en este repo ya usa el token de este proyecto. Las reglas del proyecto exigen **siempre** Git CLI para push, nunca el MCP de GitHub (ver `.cursor/rules/git-push-remoto.mdc`).

## Resumen

| Qué                | Solo este proyecto |
|--------------------|--------------------|
| `git push`         | Sí, con credential helper local (token en `.github-token` o `GITHUB_TOKEN` en `.env.local`) |
| `gh` en esta sesión| Sí, si defines `GITHUB_TOKEN` en la terminal antes de usar `gh` |

No hace falta tocar la configuración global de Git ni de `gh` en el resto de tus proyectos.
