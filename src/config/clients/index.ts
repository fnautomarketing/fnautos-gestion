import { stvlsConfig } from './stvls'
import { fnautosConfig } from './fnautos'
import { nikeConfig } from './nike'
import { ClientConfig } from './types'

// Mapeo de clientes de ejemplo o plantillas disponibles
const clients: Record<string, ClientConfig> = {
  stvls: stvlsConfig,
  fnautos: fnautosConfig,
  nike: nikeConfig,
}

// ============================================================================
// SELECCIÓN DIRECTA DEL CLIENTE ACTIVO PARA ESTE DESPLIEGUE
// ============================================================================
// Este proyecto funciona como plantilla enfocada a una única empresa en ejecución.
// Aquí se define "A FUEGO" (hardcoded) el branding activo. No usamos variables 
// de entorno como NEXT_PUBLIC_CLIENT_ID para evitar dependencias innecesarias 
// en el servidor o problemas de hidratación/build en producción.
//
// -> Para cambiar el branding de la app (ej. se la instalas a otro cliente),
//    simplemente cambia 'fnautos' por otra key del objeto 'clients', o modifica  
//    directamente el archivo 'fnautos.ts'.
const ACTIVE_CLIENT_KEY = 'fnautos'

// Exportar la configuración del cliente en formato objeto para uso global
export const clientConfig: ClientConfig = clients[ACTIVE_CLIENT_KEY] || fnautosConfig

