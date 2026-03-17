import { ClientConfig } from './types'

export const stvlsConfig: ClientConfig = {
  id: 'stvls',
  nombre: 'STV Global',
  nombreCorto: 'STV Logistics',
  tagline: 'El Futuro de la Logística Inteligente',
  description: 'Solución integral para gestión logística, transporte y administración empresarial de vanguardia.',
  copyright: '© 2026 STV Logistics Group',
  logoPath: '/logo-stv.svg',
  logoPngPath: '/logo-stv.png',
  heroImagePath: '/hero-login.png',
  faviconPath: '/favicon.ico', // Ajustar si es diferente
  colors: {
    // HSL puro (sin `hsl()` ni porcentajes donde sea numérico puro) adaptado a tailwind variables
    primary: '221 39% 11%',       // Un azul muy oscuro
    secondary: '215 28% 17%',
    accent: '215 28% 98%',
    ring: '221 39% 11%',
    brandGold: '#E0A904',
    brandGoldLight: '#F5D547',
    brandDark: '#1F2937',
  },
  email: {
    admin: 'administracion@stvls.com',
    from: 'Facturación STVLS <administracion@stvls.com>',
  },
  multiEmpresa: true,
  razonSocial: 'STV Logistics Group S.A.',
  loginDescription: 'Plataforma líder en logística inteligente y gestión de suministros globales. Tecnología punta para tu cadena de valor.',
  features: [
    { icon: 'Truck', label: 'Logística Global', desc: 'Red de transporte optimizada' },
    { icon: 'BarChart3', label: 'Analítica Real', desc: 'Datos precisos al instante' },
    { icon: 'Globe', label: 'Presencia Mundial', desc: 'Gestión sin fronteras' },
  ],
}
