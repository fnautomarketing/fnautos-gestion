import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { clientConfig } from '@/config/clients'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
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
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            style={{ objectFit: 'contain', width: '80%', height: '80%' }}
          />
        ) : (
          <span style={{ fontSize: 56, fontWeight: 800, color: clientConfig.colors.brandGold }}>{clientConfig.nombreCorto}</span>
        )}
      </div>
    ),
    { ...size }
  )
}
