import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import { HydrationFix } from '@/components/hydration-fix'
import { clientConfig } from '@/config/clients'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: `${clientConfig.nombreCorto} | Gestión Inteligente`,
  description: clientConfig.description,
  metadataBase: new URL(SITE_URL),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: clientConfig.nombreCorto,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: `${clientConfig.nombre} | ${clientConfig.tagline}`,
    description: clientConfig.description,
    type: 'website',
    locale: 'es_ES',
    url: SITE_URL,
    siteName: clientConfig.nombre,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${clientConfig.nombre} | ${clientConfig.tagline}`,
    description: clientConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Inyectamos las variables de color del cliente dinámicamente
  // Esto sobreescribe los base defauls de Tailwind
  const clientThemeCSS = `
    :root {
      --client-primary: ${clientConfig.colors.primary};
      --client-secondary: ${clientConfig.colors.secondary};
      --client-accent: ${clientConfig.colors.accent};
      --client-ring: ${clientConfig.colors.ring};
    }
  `;

  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: clientThemeCSS }} />
      </head>
      <body className="font-sans antialiased min-h-full w-full" suppressHydrationWarning>
        <HydrationFix />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
