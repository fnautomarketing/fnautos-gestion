# Hostinger API MCP (solo este proyecto)

El servidor MCP de Hostinger está configurado en `.cursor/mcp.json` para este proyecto.

## Requisitos

- Node.js 24+ (requerido por hostinger-api-mcp)
- `HOSTINGER_API_TOKEN` en `.env.local`

## Obtener el API Token

1. Entra en **https://hpanel.hostinger.com**
2. Ve a tu cuenta → API / Developer
3. Crea o copia tu API token

## Configuración en .env.local

```
HOSTINGER_API_TOKEN=tu_token_aqui
```

## Capacidades

- Gestión de facturación
- Gestión de registros DNS
- Control de máquinas virtuales
- Y más endpoints de la API de Hostinger

Ver [Hostinger API MCP Server](https://www.hostinger.com/support/11079316-hostinger-api-mcp-server/) y [GitHub](https://github.com/hostinger/api-mcp-server).
