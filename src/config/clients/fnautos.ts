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
    primary: '358 99% 40%',     // Rojo FNAUTOS (#CC0108)
    secondary: '0 0% 1%',       // Negro Premium (#020202)
    brandGold: '#CC0108',       // Rojo principal
    brandGoldLight: '#FF4D4D',  // Rojo claro/vibrante
    brandDark: '#020202',
  },
  email: {
    admin: 'info@fnautos.es',
    from: 'Facturación FNAUTOS <facturacion@fnautos.es>',
  },
  loginDescription: 'Control total de tu flota y operaciones en tiempo real. Máxima eficiencia para un mundo en constante movimiento.',
  features: [
    { icon: 'MapPin', label: 'Trazabilidad Total', desc: 'Seguimiento en vivo GPS' },
    { icon: 'Zap', label: 'IA Predictiva', desc: 'Rutas optimizadas' },
    { icon: 'ShieldCheck', label: 'Seguridad 24/7', desc: 'Protocolos blindados' },
  ],
  multiEmpresa: false,          // <-- CLAVE: Esto desactivará selectores multi-empresa
}
