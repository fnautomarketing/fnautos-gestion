// Interface abstracta base para forzar tipado en todas las configuraciones de los clientes
export interface ClientConfig {
  id: string
  nombre: string
  nombreCorto: string
  tagline: string
  description: string
  copyright: string
  logoPath: string
  logoPngPath: string
  heroImagePath: string
  faviconPath: string
  colors: {
    primary: string
    secondary: string
    brandGold: string
    brandGoldLight: string
    brandDark: string
  }
  email: {
    admin: string
    from: string
  }
  // Funcionalidades
  multiEmpresa: boolean
}
