import { ClientConfig } from './types'

export const fnautosConfig: ClientConfig = {
  id: 'fnautos',
  nombre: 'FNAUTOS',
  nombreCorto: 'FNAUTOS',
  tagline: 'Gestión Inteligente de Automoción',
  description: 'Plataforma integral para gestión de flotas y administración de automoción.',
  copyright: '© 2026 FNAUTOS S.L.',
  logoPath: '/logo-fnautos.svg',   // TODO: El cliente debe proveerlo
  logoPngPath: '/logo-fnautos.png', // TODO: El cliente debe proveerlo
  heroImagePath: '/hero-fnautos.png', // TODO: El cliente debe proveerlo
  faviconPath: '/favicon-fnautos.ico', // TODO:
  colors: {
    primary: '220 70% 50%',     // Ejemplo: Azul vibrante
    secondary: '215 28% 17%',   // Gris oscuro
    brandGold: '#2563eb',       // Usando un azul fuerte como primario en lugar de dorado
    brandGoldLight: '#60a5fa',  // Azul más claro
    brandDark: '#1e3a5f',
  },
  email: {
    admin: 'hola@fnautos.com',
    from: 'Facturación FNAUTOS <facturacion@fnautos.com>',
  },
  multiEmpresa: false,          // <-- CLAVE: Esto desactivará selectores multi-empresa
}
