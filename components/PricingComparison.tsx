'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import DatePicker from '@/components/DatePicker'
import { useAvailability } from '@/hooks/useAvailability'
import { propertyConfig } from '@/config/property'

type Platform = 'airbnb' | 'booking' | 'vrbo'

function dateStrToUtcDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = dateStrToUtcDate(checkIn).getTime()
  const b = dateStrToUtcDate(checkOut).getTime()
  return Math.round((b - a) / 86400000)
}

function toDateStrUTC(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addUtcDays(d: Date, days: number) {
  const next = new Date(d.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function calcEstimatedTotal({
  checkIn,
  checkOut,
  platform,
}: {
  checkIn: string
  checkOut: string
  platform: Platform
}) {
  const pricing = propertyConfig.pricing
  if (!pricing?.baseRate) return null

  const nights = nightsBetween(checkIn, checkOut)
  if (!Number.isFinite(nights) || nights <= 0) return null

  const start = dateStrToUtcDate(checkIn)
  const endExclusive = dateStrToUtcDate(checkOut)

  const seasonal = pricing.seasonalRates ?? []
  const nightlyRates: number[] = []
  for (let cur = new Date(start); cur < endExclusive; cur = addUtcDays(cur, 1)) {
    const curStr = toDateStrUTC(cur)
    const match = seasonal.find((s) => curStr >= s.start && curStr <= s.end)
    nightlyRates.push(match?.rate ?? pricing.baseRate)
  }

  const subtotal = nightlyRates.reduce((a, b) => a + b, 0)
  const cleaning = pricing.fees?.cleaning ?? 0
  const taxesRate = pricing.fees?.taxesRate ?? 0
  const beforeTax = subtotal + cleaning
  const taxes = beforeTax * taxesRate
  const baseTotal = beforeTax + taxes

  const adj = pricing.platformAdjustments?.[platform]
  const multiplier = adj?.multiplier ?? 1
  const extraFee = adj?.extraFee ?? 0

  return (baseTotal * multiplier) + extraFee
}

function getAirbnbListingId(url?: string) {
  if (!url) return null
  const m = url.match(/\/rooms\/(\d+)/)
  return m?.[1] ?? null
}

function buildAirbnbUrl(baseUrl: string, checkIn: string, checkOut: string, adults: number) {
  const id = getAirbnbListingId(baseUrl)
  const root = id ? `https://www.airbnb.com.au/rooms/${id}` : baseUrl
  const u = new URL(root)
  u.searchParams.set('check_in', checkIn)
  u.searchParams.set('check_out', checkOut)
  u.searchParams.set('adults', String(adults))
  return u.toString()
}

function buildBookingUrl(baseUrl: string, checkIn: string, checkOut: string, adults: number) {
  const u = new URL(baseUrl)
  u.searchParams.set('checkin', checkIn)
  u.searchParams.set('checkout', checkOut)
  u.searchParams.set('group_adults', String(adults))
  u.searchParams.set('group_children', '0')
  u.searchParams.set('no_rooms', '1')
  u.searchParams.set('sb_price_type', 'total')
  return u.toString()
}

function buildVrboUrl(baseUrl: string, checkIn: string, checkOut: string, adults: number) {
  const u = new URL(baseUrl)
  u.searchParams.set('startDate', checkIn)
  u.searchParams.set('endDate', checkOut)
  u.searchParams.set('chkin', checkIn)
  u.searchParams.set('chkout', checkOut)
  u.searchParams.set('adults', String(adults))
  return u.toString()
}

function platformMeta(p: Platform) {
  if (p === 'airbnb') {
    return { label: 'Airbnb', icon: '/images/icons/airbnb_icon.jpg' }
  }
  if (p === 'booking') {
    return { label: 'Booking.com', icon: '/images/icons/booking_icon.jpeg' }
  }
  return { label: 'Vrbo', icon: '/images/icons/vrbo.png' }
}

function parseMoney(input: string) {
  const cleaned = input.replace(/[^0-9.]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export default function PricingComparison() {
  const searchParams = useSearchParams()
  const { blockedSet, isLoading } = useAvailability()

  const todayStr = new Date().toISOString().split('T')[0]
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') ?? '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '')
  const [guests, setGuests] = useState<number>(() => {
    const raw = searchParams.get('guests')
    const n = raw ? Number(raw) : 8
    return Number.isFinite(n) && n > 0 ? Math.min(Math.max(n, 1), propertyConfig.maxGuests) : 8
  })

  const [manualTotals, setManualTotals] = useState<Record<Platform, string>>({
    airbnb: '',
    booking: '',
    vrbo: '',
  })

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return null
    const n = nightsBetween(checkIn, checkOut)
    return n > 0 ? n : null
  }, [checkIn, checkOut])

  const errors = useMemo(() => {
    const out: string[] = []
    if (!checkIn || !checkOut) return out
    if (nights === null) out.push('Check-out must be after check-in.')
    if (nights !== null && nights < 2) out.push('Minimum stay is 2 nights.')
    return out
  }, [checkIn, checkOut, nights])

  const platformUrls = useMemo(() => {
    if (!checkIn || !checkOut || errors.length > 0) return null
    const airbnbBase = propertyConfig.booking?.airbnb
    const bookingBase = propertyConfig.booking?.bookingCom
    const vrboBase = propertyConfig.booking?.vrbo

    return {
      airbnb: airbnbBase ? buildAirbnbUrl(airbnbBase, checkIn, checkOut, guests) : null,
      booking: bookingBase ? buildBookingUrl(bookingBase, checkIn, checkOut, guests) : null,
      vrbo: vrboBase ? buildVrboUrl(vrboBase, checkIn, checkOut, guests) : null,
    } as const
  }, [checkIn, checkOut, guests, errors.length])

  const estimatedTotals = useMemo(() => {
    if (!checkIn || !checkOut || errors.length > 0) return null
    const totals: Record<Platform, number | null> = {
      airbnb: calcEstimatedTotal({ checkIn, checkOut, platform: 'airbnb' }),
      booking: calcEstimatedTotal({ checkIn, checkOut, platform: 'booking' }),
      vrbo: calcEstimatedTotal({ checkIn, checkOut, platform: 'vrbo' }),
    }
    return totals
  }, [checkIn, checkOut, errors.length])

  const computed = useMemo(() => {
    if (!nights) return null
    const values: Array<{ platform: Platform; total: number; perNight: number }> = []
    ;(['airbnb', 'booking', 'vrbo'] as Platform[]).forEach((p) => {
      const v = parseMoney(manualTotals[p]) ?? estimatedTotals?.[p] ?? null
      if (v === null) return
      values.push({ platform: p, total: v, perNight: v / nights })
    })
    if (values.length === 0) return { values, cheapest: null as Platform | null }
    const cheapest = [...values].sort((a, b) => a.total - b.total)[0]?.platform ?? null
    return { values, cheapest }
  }, [manualTotals, nights, estimatedTotals])

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-6">
          <DatePicker
            id="pricing-checkin"
            label="Check-in"
            value={checkIn}
            onChange={(v) => {
              setCheckIn(v)
              if (checkOut && v && checkOut <= v) setCheckOut('')
            }}
            blockedSet={blockedSet}
            minDateStr={todayStr}
            disabled={isLoading}
          />

          <DatePicker
            id="pricing-checkout"
            label="Check-out"
            value={checkOut}
            onChange={setCheckOut}
            blockedSet={blockedSet}
            minDateStr={checkIn || todayStr}
            minExclusive={Boolean(checkIn)}
            disabled={isLoading || !checkIn}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
            <select
              value={String(guests)}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85"
            >
              {Array.from({ length: propertyConfig.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Tip: Prices vary by platform and may include different fees. Open each platform for the official total.
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        {nights && errors.length === 0 && (
          <div className="mt-4 text-sm text-gray-700">
            <span className="font-semibold">Nights:</span> {nights}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {(['airbnb', 'booking', 'vrbo'] as Platform[]).map((p) => {
          const meta = platformMeta(p)
          const url = platformUrls?.[p] ?? null
          const total = parseMoney(manualTotals[p]) ?? estimatedTotals?.[p] ?? null
          const perNight = total !== null && nights ? total / nights : null
          const isCheapest = computed?.cheapest === p

          return (
            <div
              key={p}
              className={`relative bg-white rounded-2xl shadow-xl p-6 border ${
                isCheapest ? 'border-luxury-gold' : 'border-transparent'
              }`}
            >
              <div className="absolute top-4 right-4">
                <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-black/10 bg-white">
                  <Image src={meta.icon} alt={meta.label} width={36} height={36} className="object-cover" />
                </div>
              </div>

              <div className="pr-12">
                <div className="text-lg font-semibold text-luxury-dark">{meta.label}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {url ? 'Open with selected dates' : 'Link not configured in property settings'}
                </div>
              </div>

              <div className="mt-4">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    View price on {meta.label}
                  </a>
                ) : (
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Missing booking URL in `config/property.ts`
                  </div>
                )}
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total price
                </label>
                <input
                  type="text"
                  value={manualTotals[p]}
                  onChange={(e) => setManualTotals((s) => ({ ...s, [p]: e.target.value }))}
                  placeholder={
                    estimatedTotals?.[p] != null
                      ? `Estimated: AU$ ${estimatedTotals[p]!.toFixed(2)}`
                      : 'Enter total (optional)'
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85"
                />
                {perNight !== null && (
                  <div className="mt-2 text-xs text-gray-600">
                    Approx. <span className="font-semibold">AU$ {perNight.toFixed(2)}</span> per night
                  </div>
                )}
                {estimatedTotals?.[p] != null && manualTotals[p].trim().length === 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Using estimated total from `propertyConfig.pricing`.
                  </div>
                )}
                {isCheapest && total !== null && (
                  <div className="mt-3 text-xs font-semibold text-luxury-gold">Lowest total (based on entered prices)</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-gray-500">
        Note: This page can calculate an estimated total from your site pricing. For exact platform totals, open the
        platform links (fees and taxes may differ by channel).
      </div>
    </div>
  )
}

