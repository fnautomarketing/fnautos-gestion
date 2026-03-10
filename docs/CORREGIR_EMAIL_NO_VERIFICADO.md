# Corregir "Remitente no verificado" en correos de facturas

## Diagnóstico

Cuando Gmail, Outlook u otros clientes muestran **"Remitente no verificado"** o **"No verificado"**, significa que no pueden validar que el correo proviene de un servidor autorizado para enviar en nombre de `stvls.com`.

**Causa:** Faltan o están mal configurados los registros DNS de autenticación (SPF, DKIM, DMARC) en Hostinger.

---

## Estado actual (verificado vía Hostinger MCP)

| Registro | Nombre | Estado | Valor |
|----------|--------|--------|-------|
| **SPF** | `send` | ✅ Configurado | `v=spf1 include:amazonses.com ~all` |
| **MX** | `send` | ✅ Configurado | `10 feedback-smtp.eu-west-1.amazonses.com.` |
| **DKIM** | `resend._domainkey` | ✅ Configurado | Clave pública Resend (TXT) |
| **DMARC** | `_dmarc` | ⚠️ Duplicado + p=none | Dos registros con `p=none`; Microsoft lo interpreta como débil → "No verificado" |

**Conclusión:** Los registros DNS están correctos y el dominio está **Verified** en Resend. El aviso "No verificado" en Outlook se debe muy probablemente a **DMARC p=none**. Solución: un solo registro con `p=quarantine`. Ver sección [DMARC](#dmarc-por-qué-pnone-causa-no-verificado-en-outlook).

---

## Arquitectura actual

| Componente | Uso |
|------------|-----|
| **Resend** | Servicio que envía los correos (API) |
| **Hostinger** | Donde está registrado el dominio `stvls.com` y sus DNS |
| **From** | `Facturación <administracion@stvls.com>` |

Resend usa Amazon SES por debajo. Para que los correos lleguen como **verificados**, el dominio debe estar verificado en Resend y los registros DNS deben apuntar correctamente.

---

## Solución paso a paso

### 1. Verificar estado del dominio en Resend

1. Entra en **https://resend.com/domains**
2. Busca el dominio `stvls.com`
3. Revisa el estado:
   - **Verified** → El dominio está bien; si aún llega "no verificado", puede ser caché o propagación DNS
   - **Pending** / **Not started** / **Failed** → Hay que configurar o corregir los DNS

### 2. Obtener los registros exactos de Resend

1. En Resend → Domains → `stvls.com` → **View DNS Records**
2. Resend te mostrará los registros que debes añadir. **Copia nombre y valor exactos** (pueden variar por cuenta/región).

Ejemplo típico (valores pueden cambiar):

| Tipo | Nombre (Host) | Valor | Notas |
|------|---------------|-------|-------|
| **TXT** | `send` | `v=spf1 include:amazonses.com ~all` | SPF para send.stvls.com |
| **MX** | `send` | `feedback-smtp.eu-west-1.amazonses.com` | Prioridad 10, bounces |
| **CNAME** | `resend._domainkey` | `resend._domainkey.resend.com` | DKIM (Resend da el valor exacto) |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:administracion@stvls.com` | DMARC; usar **p=quarantine** (no p=none) para Outlook |

> **Importante:** Si Resend te da valores distintos, usa siempre los de Resend.

### 3. Añadir registros en Hostinger

1. Entra en **hPanel** de Hostinger
2. **Dominios** → **stvls.com** → **DNS / Nameservers** → **Administrar registros DNS** (o **Registros DNS**)
3. **Agregar registro** → Añade cada uno según la tabla:

#### SPF (subdominio `send`)

- **Tipo:** TXT  
- **Nombre:** `send` (sin .stvls.com)  
- **Valor:** `v=spf1 include:amazonses.com ~all` (o el que indique Resend)  
- **TTL:** 3600  

#### MX (bounces)

- **Tipo:** MX  
- **Nombre:** `send`  
- **Valor:** `feedback-smtp.eu-west-1.amazonses.com` (o el de Resend)  
- **Prioridad:** 10  
- **TTL:** 3600  

#### DKIM (CNAME)

- **Tipo:** CNAME  
- **Nombre:** `resend._domainkey` (o el que Resend indique)  
- **Valor:** `resend._domainkey.resend.com` (o el que Resend indique)  
- **TTL:** 3600  

#### DMARC

- **Tipo:** TXT  
- **Nombre:** `_dmarc`  
- **Valor:** `v=DMARC1; p=quarantine; rua=mailto:administracion@stvls.com`  
- **TTL:** 3600  
- **Importante:** Usar `p=quarantine` (no `p=none`). Microsoft trata `p=none` como débil y muestra "No verificado" en Outlook.

### 4. Regla SPF duplicada

Si ya tienes un registro SPF para `@` o `stvls.com` (root), **no** crees otro. Solo puedes tener **un SPF por dominio/subdominio**. El SPF para `send` es para `send.stvls.com` (return-path), no para el root. Resend usa `send.stvls.com` como return-path. El SPF del root (`@`) suele ser para otro servicio (ej. correo de Hostinger). Si usas Hostinger para correo corporativo, combina ambos en un solo registro:

```
v=spf1 include:amazonses.com include:_spf.hostinger.com ~all
```

Consulta la documentación de Hostinger para el `include` exacto de tu plan.

### 5. Verificación

1. En Resend → Domains → `stvls.com` → **Verify DNS Records**
2. Espera **5–30 minutos** (la propagación DNS puede tardar hasta 24–48 h)
3. Si falla, usa **Recheck** tras unas horas

### 6. Comprobar envío

Envía una factura de prueba a tu correo. Si el dominio está bien verificado, el aviso "No verificado" debería desaparecer en 24–48 h (por caché de proveedores).

---

## DMARC: por qué p=none causa "No verificado" en Outlook

### La paradoja

- **Sin DMARC:** Los correos iban a correo no deseado (spam).
- **Con DMARC p=none:** Los correos llegan a la bandeja de entrada, pero Outlook muestra "Remitente no verificado".

### Causa

Microsoft trata **DMARC p=none** como una política débil.[^2] Aunque SPF y DKIM pasen, `p=none` hace que la autenticación compuesta de Microsoft falle (`compauth=fail reason=001`), lo que provoca el aviso "No verificado".

### Solución: cambiar a p=quarantine

| Política | Efecto en Outlook |
|----------|-------------------|
| **p=none** | Monitoreo; Microsoft lo considera débil → "No verificado" |
| **p=quarantine** | Indica que proteges el dominio → mayor probabilidad de pasar como verificado |
| **p=reject** | Política más estricta; rechaza correos no autenticados |

**Recomendación:** Usar un único registro DMARC con `p=quarantine`:

```
v=DMARC1; p=quarantine; rua=mailto:administracion@stvls.com
```

### Pasos en Hostinger

1. Entra en **hPanel** → Dominios → stvls.com → DNS.
2. **Elimina** los dos registros TXT actuales de `_dmarc`.
3. **Añade** un solo registro:
   - **Tipo:** TXT  
   - **Nombre:** `_dmarc`  
   - **Valor:** `v=DMARC1; p=quarantine; rua=mailto:administracion@stvls.com`  
   - **TTL:** 3600  

### Importante

- Solo debe haber **un** registro DMARC por dominio; tener varios puede generar conflictos.
- Con `p=quarantine`, los correos que **no** pasen DMARC irán a spam. Resend (administracion@stvls.com) ya está verificado; si usas otros remitentes (p. ej. soporte@), comprueba que también pasen SPF/DKIM.
- **Tiempo:** La propagación DNS y la caché de Microsoft pueden tardar **24–48 h** o más. Si tras el cambio sigue apareciendo "No verificado", puede deberse a reputación del remitente u otros factores internos de Microsoft.

[^2]: [Why does Microsoft composite authentication fail with DMARC p=none?](https://www.suped.com/knowledge/email-deliverability/sender-reputation/why-does-microsoft-composite-authentication-fail-with-dmarc-pnone)

---

## Outlook/Hotmail sigue mostrando "No verificado" (aunque Gmail no)

Si **Gmail** no muestra aviso pero **Outlook/Hotmail** sí, puede deberse a:

1. **DMARC p=none** (ver sección anterior) — solución: cambiar a `p=quarantine`.
2. **Otros criterios de Microsoft** (reputación, volumen, etc.):[^1]

| Factor | Impacto |
|--------|---------|
| **Reputación del remitente** | Dominios nuevos o con poco historial de envío a Microsoft |
| **IP compartida** | Resend usa IPs compartidas; la reputación se construye con el tiempo |
| **Filtro "Small Independent Sender"** | Afecta a remitentes con bajo volumen de envío |
| **Engagement** | Poca interacción (abrir, hacer clic) o quejas de spam |
| **Caché** | Outlook puede tardar días o semanas en actualizar el estado |

### Qué hacer

1. **Cambiar DMARC a p=quarantine** (ver sección anterior).
2. **Añadir a remitentes seguros** (solución inmediata para el destinatario):
   - En Outlook/Hotmail: clic derecho en el correo → "Añadir a remitentes seguros" o "Marcar como seguro"
3. **Construir reputación** (a medio plazo): envío regular, evitar que marquen como spam, listas limpias.
4. **BIMI**: Microsoft **no soporta** BIMI; no ayuda en Outlook.

[^1]: [Why are fully authenticated emails marked as 'Unverified Sender' in Outlook/Hotmail?](https://www.suped.com/knowledge/email-deliverability/troubleshooting/why-are-fully-authenticated-emails-marked-as-unverified-sender-in-outlookhotmail)

---

## Problema adicional: "No hemos podido abrir su archivo"

Si el PDF adjunto no se abre en Gmail móvil:

1. **Content-Type:** El código ya envía `contentType: 'application/pdf'` en los adjuntos.
2. **Alternativa:** Descargar el PDF en el escritorio y abrirlo desde ahí; a veces Gmail móvil tiene problemas con PDFs generados dinámicamente.
3. **Prueba:** Enviar a otro cliente (Outlook, Apple Mail) para descartar problema del cliente.

---

## Resumen de acciones

| # | Acción | Dónde | Estado |
|---|--------|-------|--------|
| 1 | Comprobar estado del dominio | https://resend.com/domains | ⬅️ **Hacer ahora** |
| 2 | Copiar registros DNS exactos | Resend → stvls.com → View DNS Records | Solo si falta algo |
| 3 | Añadir TXT (SPF) para `send` | Hostinger → DNS | ✅ Ya configurado |
| 4 | Añadir MX para `send` | Hostinger → DNS | ✅ Ya configurado |
| 5 | Añadir CNAME/TXT (DKIM) | Hostinger → DNS | ✅ Ya configurado |
| 6 | Añadir TXT (DMARC) para `_dmarc` | Hostinger → DNS | ✅ Ya configurado |
| 7 | Verificar en Resend | Resend → Verify DNS Records | ⬅️ **Hacer ahora** |
| 8 | Esperar propagación | 5–30 min (hasta 24–48 h) | Tras verificar |

> **Nota:** Los registros DNS se pueden revisar/editar con el MCP de Hostinger (`DNS_getDNSRecordsV1`, `DNS_updateDNSRecordsV1`).

---

## Referencias

- [Resend - Managing Domains](https://resend.com/docs/dashboard/domains/introduction)
- [Resend - Email Authentication](https://resend.com/blog/email-authentication-a-developers-guide)
- [Hostinger - DNS Records](https://support.hostinger.com/en/articles/11782550-hostinger-reach-how-to-add-spf-dkim-and-dmarc-records) (conceptos aplicables)
- [Suped - Why Outlook/Hotmail marks authenticated emails as Unverified Sender](https://www.suped.com/knowledge/email-deliverability/troubleshooting/why-are-fully-authenticated-emails-marked-as-unverified-sender-in-outlookhotmail)
- [Suped - Why Microsoft composite authentication fails with DMARC p=none](https://www.suped.com/knowledge/email-deliverability/sender-reputation/why-does-microsoft-composite-authentication-fail-with-dmarc-pnone)
