import { ClientConfig } from './types'

export const fnautosConfig: ClientConfig = {
  id: 'fnautos',
  nombre: 'FNAUTOS',
  nombreCorto: 'FNAUTOS',
  tagline: 'Impulsa la Compra y Venta de Vehículos',
  description: 'El ERP definitivo para concesionarios y profesionales del sector automoción.',
  copyright: '© 2026 FNAUTOS S.L.',
  logoPath: '/logo-fnautos.svg',
  logoPngPath: '/logo-fnautos.png',
  logoDarkPath: '/logo-fnautos.svg', // En FNAUTOS el SVG funciona en ambos
  heroImagePath: '/logo-fnautos.png',
  faviconPath: '/favicon.ico',
  colors: {
    primary: '358 100% 45%',      // Rojo Vivo Metalizado (Más brillante)
    secondary: '222 84% 4.9%',   // Navy Oscuro
    accent: '358 100% 98%',       // Rojo Ultra-ligero para fondos
    ring: '358 100% 45%',         // Anillo del mismo rojo vivo
    brandGold: '#E60007',         // Rojo más "Live"
    brandGoldLight: '#FF3339',
    brandDark: '#0A0A0A',
  },
  email: {
    admin: 'info@fnautos.es',
    from: 'Facturación FNAUTOS <facturacion@fnautos.es>',
  },
  loginDescription: 'Optimiza tu ciclo comercial: desde la gestión de inventario y clientes hasta la emisión de facturas y control de contratos, todo en una plataforma centralizada para el profesional de la automoción.',
  features: [
    { icon: 'CarFront', label: 'Stock e Inventario', desc: 'Control de flota en vivo' },
    { icon: 'FileText', label: 'Facturación y Contratos', desc: 'Emisión legal instantánea' },
    { icon: 'BarChart3', label: 'Control de Negocio', desc: 'Ingresos y rentabilidad' },
  ],
  multiEmpresa: false, // FLAG CRÍTICA: Desactiva selectores multi-empresa para modelo monocompañía (Jimmy Andres Benitez Cortes)
}
