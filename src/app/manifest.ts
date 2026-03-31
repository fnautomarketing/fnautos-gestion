import { MetadataRoute } from 'next'
import { clientConfig } from '@/config/clients'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${clientConfig.nombreCorto} ERP`,
    short_name: clientConfig.nombreCorto,
    description: clientConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: clientConfig.colors.brandDark,
    theme_color: clientConfig.colors.primary,
    icons: [
      {
        src: '/icon.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
