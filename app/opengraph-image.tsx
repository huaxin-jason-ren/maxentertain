import { ImageResponse } from 'next/og'
import { propertyConfig } from '@/config/property'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #0B0F14 0%, #1A2230 45%, #0B0F14 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 2, opacity: 0.9, marginBottom: 18 }}>
          MAX ENTERTAIN
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, marginBottom: 22 }}>
          {propertyConfig.name}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.3, opacity: 0.9, maxWidth: 980 }}>
          {propertyConfig.description}
        </div>
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            fontSize: 22,
            opacity: 0.9,
          }}
        >
          <span>Beachside luxury</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>Book direct</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>Mornington Peninsula</span>
        </div>
      </div>
    ),
    size
  )
}

