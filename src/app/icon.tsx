import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { clientConfig } from '@/config/clients'

// 48x48 para retina: máximo tamaño que aprovechan las pestañas modernas
export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default async function Icon() {
  const logoPath = join(process.cwd(), 'public', (clientConfig.logoPngPath || clientConfig.logoPath).replace(/^\//, ''))
  let logoSrc: string
  try {
    const buf = await readFile(logoPath)
    logoSrc = `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    logoSrc = ''
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          overflow: 'hidden',
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            style={{ objectFit: 'contain', width: '90%', height: '90%' }}
          />
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, color: clientConfig.colors.brandGold }}>{clientConfig.nombreCorto.slice(0, 3).toUpperCase()}</span>
        )}
      </div>
    ),
    { ...size }
  )
}
