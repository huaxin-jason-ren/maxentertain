'use client'

import type { DiscoveryAttribution } from '@/lib/discovery'

const STORAGE_KEY = 'maxentertain.discovery'

export function captureDiscoveryContext() {
  if (typeof window === 'undefined') return
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    const params = new URLSearchParams(window.location.search)
    const context: DiscoveryAttribution = existing ? JSON.parse(existing) : {}
    context.utmSource ||= params.get('utm_source') || undefined
    context.utmMedium ||= params.get('utm_medium') || undefined
    context.utmCampaign ||= params.get('utm_campaign') || undefined
    if (!context.referrer && document.referrer && !document.referrer.startsWith(window.location.origin)) {
      context.referrer = document.referrer
    }
    if (context.utmSource || context.utmMedium || context.utmCampaign || context.referrer) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context))
    }
  } catch {
    // Attribution must never interrupt booking or inquiry.
  }
}

export function getDiscoveryContext(): DiscoveryAttribution {
  if (typeof window === 'undefined') return {}
  captureDiscoveryContext()
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}
