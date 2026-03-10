# Configurar dominio stvls.com en Resend

Las facturas se enviarán desde **administracion@stvls.com** para todas las empresas.

## Límites Resend (plan gratuito)

| Límite | Valor |
|--------|-------|
| Emails/mes | **3.000** |
| Emails/día | **100** |
| Peticiones/segundo | 2 |

---

## Checklist: qué hacer para que NO llegue "No verificado"

> Si los correos llegan como **"Remitente no verificado"**, falta configurar SPF/DKIM/DMARC en Hostinger. Ver [CORREGIR_EMAIL_NO_VERIFICADO.md](./CORREGIR_EMAIL_NO_VERIFICADO.md) para guía detallada.

| # | Dónde | Qué hacer | Estado |
|---|-------|-----------|--------|
| 1 | Resend | Añadir dominio stvls.com | ☐ |
| 2 | Hostinger | Añadir SPF (subdominio send) | ☐ |
| 3 | Hostinger | Añadir MX (subdominio send, bounces) | ☐ |
| 4 | Hostinger | Añadir DKIM (CNAME que da Resend) | ☐ |
| 5 | Hostinger | Añadir DMARC | ☐ |
| 6 | Resend | Verificar dominio (5–30 min) | ☐ |

---

## Paso 1: Añadir dominio en Resend

1. Entra en **https://resend.com/domains**
2. Clic en **Add Domain**
3. Escribe: `stvls.com`
4. Clic en **Add**
5. Resend te mostrará los registros DNS que necesitas. **Cópialos exactamente.**

---

## Paso 2: Registros en Hostinger

**Acceso:** hPanel → **Dominios** → **stvls.com** → **DNS / Nameservers** → **Registros DNS** → **Agregar Registro**

### 2.1 SPF (subdominio `send`)

Resend usa el subdominio `send.stvls.com` como return-path. El SPF va ahí:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | 3600 |

> **Importante:** El nombre es solo `send` (para send.stvls.com). Si Resend te da un valor distinto, usa el de Resend.

### 2.2 MX (bounces en send.stvls.com)

Para que Resend reciba los bounces correctamente:

| Tipo | Nombre | Valor | Prioridad | TTL |
|------|--------|-------|-----------|-----|
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 | 3600 |

> El valor exacto puede variar según la región de Resend. **Usa el que te indique Resend** en el dashboard.

### 2.3 DKIM (CNAME que da Resend)

Resend te dará uno o más registros CNAME. Ejemplo:

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | `resend._domainkey` | `resend._domainkey.resend.com` |

> **Copia el nombre y valor exactos** desde https://resend.com/domains

### 2.4 DMARC (evitar spam)

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:administracion@stvls.com` |

- **p=none**: solo monitoriza (recomendado al inicio)
- **rua**: email para recibir informes de autenticación

Cuando todo funcione bien, puedes endurecer: `p=quarantine` o `p=reject`.

---

## Paso 3: Verificación

- Resend verifica automáticamente en **5–30 minutos** (DNS puede tardar hasta 24 h)
- Comprueba el estado en https://resend.com/domains
- Cuando esté **Verified**, los correos se enviarán correctamente desde administracion@stvls.com

---

## Configuración actual (.env.local)

```
RESEND_API_KEY=re_xxxx
RESEND_FROM=Facturación <administracion@stvls.com>
```

---

## Por qué llega a correo no deseado

Google y Yahoo endurecieron requisitos desde **febrero 2024**. Sin SPF, DKIM y DMARC correctos, los correos tienen muchas más probabilidades de ir a spam.

| Protocolo | Función |
|-----------|--------|
| **SPF** | Lista de servidores autorizados para enviar desde tu dominio |
| **DKIM** | Firma digital que verifica que el mensaje no se alteró |
| **DMARC** | Define qué hacer si fallan SPF/DKIM y envía reportes |

Resend usa Amazon SES. Los registros SPF incluyen `include:amazonses.com`.

---

## Buenas prácticas de contenido (ya en el código)

- **Asunto**: descriptivo (ej. `Factura F2026-0001 - Villegas SL`)
- **Remitente**: nombre reconocible (`Facturación`)
- Sin exceso de mayúsculas ni signos de exclamación
