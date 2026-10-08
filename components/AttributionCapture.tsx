'use client'

import { useEffect } from 'react'
import { captureDiscoveryContext } from '@/lib/discovery-client'

export default function AttributionCapture() {
  useEffect(() => {
    captureDiscoveryContext()
  }, [])
  return null
}
