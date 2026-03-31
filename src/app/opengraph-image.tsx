import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { clientConfig } from '@/config/clients'

export const alt = `${clientConfig.nombreCorto} ERP - Sistema de Gestión Empresarial`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${clientConfig.colors.brandDark} 0%, #1e293b 50%, ${clientConfig.colors.brandDark} 100%)`,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {logoSrc ? (
          <img src={logoSrc} alt="" width={200} height={200} style={{ objectFit: 'contain', marginBottom: 24 }} />
        ) : (
          <div
            style={{
              width: 160,
              height: 160,
              background: 'linear-gradient(135deg, #93662d 0%, #c9b31e 50%, #e4d44e 70%, #93662d 100%)',
              borderRadius: 32,
              marginBottom: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 800, color: 'white' }}>{clientConfig.nombreCorto}</span>
          </div>
        )}
        <h1 style={{ fontSize: 64, fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-2px' }}>
          {clientConfig.nombreCorto} ERP
        </h1>
        <p style={{ fontSize: 28, color: '#94a3b8', marginTop: 16, maxWidth: 800, textAlign: 'center' }}>
          Sistema de Gestión Empresarial para Logística y Transporte
        </p>
      </div>
    ),
    { ...size }
  )
}
