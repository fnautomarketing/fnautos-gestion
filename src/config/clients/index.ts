import { stvlsConfig } from './stvls'
import { fnautosConfig } from './fnautos'
import { nikeConfig } from './nike'
import { ClientConfig } from './types'

// Mapeo exhaustivo de clientes disponibles
const clients: Record<string, ClientConfig> = {
  stvls: stvlsConfig,
  fnautos: fnautosConfig,
  nike: nikeConfig,
}

// Determinar el cliente activo basado en la variable de entorno NEXT_PUBLIC_CLIENT_ID
// Por defecto se carga el cliente original (STVLS) si no se provee.
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || 'stvls'

// Exportar la configuración del cliente en mayúscula y minúscula para uso global
export const clientConfig: ClientConfig = clients[clientId] || stvlsConfig

console.log(`[Config] App inicializada con cliente activo: ${clientConfig.id.toUpperCase()}`);
