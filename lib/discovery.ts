export const DISCOVERY_SOURCE_OPTIONS = [
  { value: 'google_search', label: 'Google Search' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'vrbo_stayz', label: 'Vrbo / Stayz' },
  { value: 'friend_family', label: 'Friend or family recommendation' },
  { value: 'returning_guest', label: 'Returning guest' },
  { value: 'house_number_plate', label: 'House number plate / property sign' },
  { value: 'car_decal_print', label: 'Car decal or printed material' },
  { value: 'other', label: 'Other' },
] as const

export type DiscoverySource = typeof DISCOVERY_SOURCE_OPTIONS[number]['value']

export interface DiscoveryAttribution {
  source?: DiscoverySource
  sourceOther?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referrer?: string
  reportedAt?: Date
}

const DISCOVERY_SOURCES = new Set<string>(DISCOVERY_SOURCE_OPTIONS.map((option) => option.value))

function clean(value: unknown, maxLength: number) {
  return String(value ?? '')
    .replace(/[\r\n\0]+/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function normaliseDiscovery(value: unknown): DiscoveryAttribution | undefined {
  if (!value || typeof value !== 'object') return undefined
  const input = value as Record<string, unknown>
  const sourceValue = clean(input.source, 50)
  const source = DISCOVERY_SOURCES.has(sourceValue) ? sourceValue as DiscoverySource : undefined
  const sourceOther = clean(input.sourceOther, 300) || undefined
  const utmSource = clean(input.utmSource, 200) || undefined
  const utmMedium = clean(input.utmMedium, 200) || undefined
  const utmCampaign = clean(input.utmCampaign, 300) || undefined
  const referrer = clean(input.referrer, 1000) || undefined

  if (!source && !sourceOther && !utmSource && !utmMedium && !utmCampaign && !referrer) {
    return undefined
  }
  return {
    source,
    sourceOther: source === 'other' ? sourceOther : undefined,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    ...(source ? { reportedAt: new Date() } : {}),
  }
}

export function discoverySourceLabel(source?: string) {
  return DISCOVERY_SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source ?? 'Not provided'
}
