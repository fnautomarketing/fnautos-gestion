import { ClientConfig } from './types'

// Configuración de ejemplo: Nike Sport Management ERP
// Demuestra que el sistema white-label funciona para cualquier empresa
export const nikeConfig: ClientConfig = {
  id: 'nike',
  nombre: 'Nike Sport S.L.',
  nombreCorto: 'NIKE',
  tagline: 'Just Do Business',
  description: 'Sistema de gestión de rendimiento deportivo y logística corporativa.',
  copyright: '© 2026 Nike Sport S.L.',
  logoPath: '/logo-nike.svg',      // placeholder hasta que el cliente provea su logo
  logoPngPath: '/logo-nike.png',
  heroImagePath: '/hero-nike.jpg',
  faviconPath: '/favicon-nike.ico',
  colors: {
    primary: '0 0% 0%',           // Negro puro — identidad Nike
    secondary: '0 0% 15%',        // Gris oscuro
    accent: '0 0% 98%',
    ring: '0 0% 0%',
    brandGold: '#111111',          // Negro principal
    brandGoldLight: '#555555',     // Gris medio
    brandDark: '#000000',
  },
  email: {
    admin: 'erp@nike-sport.com',
    from: 'Facturación Nike Sport <facturacion@nike-sport.com>',
  },
  multiEmpresa: true,
  razonSocial: 'Nike Sport S.L.',
  loginDescription: 'Gestión de alto rendimiento para equipos de élite. Lleva tu administración deportiva al siguiente nivel.',
  features: [
    { icon: 'Activity', label: 'Rendimiento', desc: 'Métricas de atletas en vivo' },
    { icon: 'Package', label: 'Inventario Pro', desc: 'Stock global en tiempo real' },
    { icon: 'Trophy', label: 'Gestión de Éxito', desc: 'KPIS de victoria corporativa' },
  ],
}
