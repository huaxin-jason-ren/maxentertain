import { ImageResponse } from 'next/og'
import { propertyConfig } from '@/config/property'

export const size = {
  width: 1200,
  height: 600,
}

export const contentType = 'image/png'

export default function TwitterImage() {
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
        <div style={{ fontSize: 20, letterSpacing: 2, opacity: 0.9, marginBottom: 18 }}>
          MAX ENTERTAIN
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}>
          {propertyConfig.name}
        </div>
        <div style={{ fontSize: 26, lineHeight: 1.3, opacity: 0.9, maxWidth: 980 }}>
          {propertyConfig.description}
        </div>
      </div>
    ),
    size
  )
}

