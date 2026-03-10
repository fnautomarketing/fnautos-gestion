# Desplegar stvls-erp en Hostinger

Guía para llevar este proyecto Next.js a una URL de Hostinger. Hay **dos caminos** según tu plan.

---

## Requisitos del proyecto

- **Next.js 16** (Node.js necesario en el servidor)
- **Variables de entorno**: Supabase, Resend (ver sección más abajo)
- **Puerto**: la app corre por defecto en el puerto `3000`

---

## Opción A: Node.js Web Apps (recomendado si tienes plan Business o Cloud)

Disponible en planes **Business** y **Cloud** (Cloud Startup, Professional, Enterprise).

### Pasos

1. **Entra al panel de Hostinger** → tu hosting → **Node.js** (o "Aplicaciones Node.js").
2. **Crear aplicación Node.js**:
   - Conecta tu **cuenta de GitHub** (autoriza a Hostinger).
   - Elige el repositorio: `stvlsmarketing-spec/stvls-erp` (o el que uses).
   - Rama: `main` o `feature/working` según tu flujo.
   - Hostinger detecta Next.js y suele configurar build/start automático.
3. **Configurar variables de entorno** en el panel de la app:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ACCESS_TOKEN`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `NEXT_PUBLIC_SITE_URL` (producción: `https://gestion.stvls.com`)
   - `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - (Opcional) `HOSTINGER_API_TOKEN` si usas la API de Hostinger.
4. **Build command** (si te lo pide): `npm run build`
5. **Start command** (si te lo pide): `npm run start`
6. **Deploy** y espera a que te asignen una URL (ej: `https://tu-app.hostinger.site` o tu dominio).

Si tu plan incluye Node.js Web Apps, con esto suele ser suficiente.

### Opción A con MCP de Hostinger (desde Cursor)

Si tienes el **MCP de Hostinger** configurado en este proyecto, puedes desplegar (y consultar estado/logs) desde aquí.

#### Requisitos previos

1. **Token de API** en `.env.local`:
   ```bash
   HOSTINGER_API_TOKEN=tu_token
   ```
   Obtenerlo en: https://hpanel.hostinger.com → Cuenta → API / Developer.

2. **Un sitio (website) en Hostinger** con plan que tenga Node.js (Business/Cloud). El **dominio** de ese sitio es el que usarás en el MCP (ej: `stvls.com` o el subdominio que te asigne Hostinger para la app Node).

3. **Variables de entorno de la app** (Supabase, Resend) configuradas en el **panel de Hostinger** para esa aplicación Node.js. El MCP no permite configurar env vars; hay que hacerlo en hPanel en la sección de la app Node.

#### Herramientas del MCP que usamos

| Herramienta | Uso |
|-------------|-----|
| `hosting_listWebsitesV1` | Listar sitios/dominios de tu hosting para elegir el dominio donde desplegar. |
| `hosting_deployJsApplication` | Subir un zip del código fuente (sin `node_modules`, sin `.next`) y lanzar el build en el servidor. |
| `hosting_listJsDeployments` | Ver estado de los despliegues (pending, completed, running, failed). |
| `hosting_showJsDeploymentLogs` | Ver logs del build si algo falla (necesitas el `buildUuid` del deployment). |

#### Pasos con el MCP

1. **Listar sitios**  
   Ejecutar `hosting_listWebsitesV1` (sin parámetros obligatorios). Anotar el **dominio** del sitio donde quieres la app Node (ej: `tudominio.com`).

2. **Crear el zip del proyecto**  
   El zip debe contener **solo código fuente**: sin `node_modules`, sin `.next`, y respetando `.gitignore`. En la raíz del proyecto:
   ```bash
   # Ejemplo con PowerShell (excluir node_modules y .next)
   Compress-Archive -Path * -DestinationPath stvls-erp-deploy.zip -Force
   ```
   O con Node/npx (mejor, respeta .gitignore):
   ```bash
   npx git-archive-all stvls-erp-deploy.zip
   ```
   Si no tienes `git-archive-all`, puedes usar un script que empaquete todo menos `node_modules`, `.next`, `.git`, `*.zip`.

3. **Desplegar**  
   Llamar `hosting_deployJsApplication` con:
   - `domain`: el dominio del paso 1 (ej: `stvls.com`).
   - `archivePath`: ruta absoluta al zip (ej: `c:\stvls-erp-git\stvls-erp-deploy.zip`).

4. **Comprobar estado**  
   Llamar `hosting_listJsDeployments` con ese `domain`. Revisar que el último deployment pase de `pending` a `completed` o `running`.

5. **Si el build falla**  
   En la lista de deployments, copiar el `buildUuid` (o id) del deployment fallido. Llamar `hosting_showJsDeploymentLogs` con `domain` y `buildUuid` para ver los logs.

#### Importante

- **Variables de entorno**: configúralas en hPanel (Node.js → tu app → Variables de entorno) antes o justo después del primer deploy. Sin ellas, la app no conectará a Supabase ni a Resend.
- **Build/Start**: Hostinger suele detectar Next.js y usar `npm run build` y `npm run start`. Si no, configúralo en el panel de la app.
- **Primera vez**: Si en Hostinger aún no has creado la “Aplicación Node.js” para ese dominio, puede que tengas que crear la app una vez desde el panel (conectar GitHub o subir manualmente) y luego usar el MCP para los siguientes despliegues. Depende de si el MCP despliega a un sitio existente o crea la app; en la práctica, listar sitios y desplegar al dominio suele ser suficiente cuando el plan ya tiene Node.js habilitado.

---

## Opción B: VPS de Hostinger (más control, cualquier plan VPS)

Si tienes un **VPS** (KVM u otro), puedes instalar Node.js y servir la app tú mismo.

### 1. Conectar por SSH

```bash
ssh root@TU_IP_VPS
```

(Usuario/contraseña o clave SSH según lo que te dé Hostinger.)

### 2. Instalar Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # debe mostrar v20.x
```

### 3. Instalar PM2 (mantener la app corriendo)

```bash
sudo npm install -g pm2
```

### 4. Clonar el repositorio

```bash
cd /var/www   # o la ruta que prefieras
git clone https://github.com/stvlsmarketing-spec/stvls-erp.git
cd stvls-erp
```

Si el repo es privado, configura SSH key o token en el servidor.

### 5. Instalar dependencias y build

```bash
npm ci
npm run build
```

### 6. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (en el VPS):

```bash
nano .env.local
```

Pega las mismas variables que en `.env.local` de tu máquina (Supabase, Resend, etc.). Incluye también:
- `NEXT_PUBLIC_SITE_URL` = `https://gestion.stvls.com` (o tu dominio si es otro)
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` = generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

**No subas este archivo a Git** (ya debería estar en `.gitignore`).

### 7. Arrancar con PM2

```bash
pm2 start npm --name "stvls-erp" -- start
pm2 save
pm2 startup   # para que arranque al reiniciar el VPS
```

La app quedará en `http://localhost:3000` dentro del VPS.

### 8. Nginx como proxy inverso

Instala Nginx y crea un sitio que apunte al puerto 3000:

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/stvls-erp
```

Contenido del sitio (cambia `tu-dominio.com` por tu dominio o IP):

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar sitio y recargar Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/stvls-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. HTTPS con Let's Encrypt (recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones. Certbot configurará SSL en Nginx.

### 10. Actualizar la app en el futuro

```bash
cd /var/www/stvls-erp
git pull
npm ci
npm run build
pm2 restart stvls-erp
```

---

## Variables de entorno que debes configurar (resumen)

| Variable | Dónde se usa | Obligatoria |
|----------|--------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Acciones de servidor / admin | Sí |
| `SUPABASE_ACCESS_TOKEN` | Migraciones / API Supabase | Según uso |
| `RESEND_API_KEY` | Envío de emails (facturas) | Sí |
| `RESEND_FROM` | Remitente de emails | Sí |
| `NEXT_PUBLIC_SITE_URL` | URL base (favicon, OG, metadata). Producción: `https://gestion.stvls.com` | Sí (producción) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Evita "Server Action was not found" tras deploys | Recomendado |
| `HOSTINGER_API_TOKEN` | Solo si usas API Hostinger | No |

En **Node.js Web Apps** las configuras en el panel. En **VPS** las pones en `.env.local` en el servidor.

### Generar `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Añade el valor generado como variable de entorno en Hostinger (panel de la app Node.js o en `.env.local` del VPS).

---

## Después de cada deploy: vaciar caché CDN

**Importante:** Tras cada deploy, vacía la caché del CDN para evitar que el login (Server Actions) falle por JS en caché de un build anterior.

**Pasos:** Hostinger → **CDN** → **Vaciar caché**

---

## Comprobar que todo funciona

1. Abre la URL asignada (subdominio Hostinger o tu dominio).
2. Inicia sesión y revisa que Supabase responda (datos, facturas).
3. Prueba el envío de un email (por ejemplo, reenvío de factura) para validar Resend.

---

## Problemas frecuentes

- **Build falla**: Revisa que la versión de Node en Hostinger/VPS sea 18.x o 20.x. En `package.json` no hay `engines`; si quieres fijarla, añade `"engines": { "node": ">=20" }`.
- **502 Bad Gateway**: La app no está levantada o no escucha en el puerto que usa Nginx (3000). Revisa con `pm2 status` y `pm2 logs stvls-erp`.
- **Variables no cargadas**: En Hostinger Node.js Web Apps, asegúrate de guardar las variables en el panel y volver a desplegar. En VPS, que `.env.local` exista en la raíz del proyecto donde ejecutas `npm start`.

Si me dices si tienes **plan con Node.js Web Apps** o **VPS**, puedo ajustar los pasos a tu caso concreto (por ejemplo, solo Opción A o solo Opción B).
