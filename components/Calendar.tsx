'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
import { useAvailability } from '@/hooks/useAvailability'
import { blockedDates as defaultBlockedDates } from '@/config/property'
import { getPriceSummary, groupNightsByTier, TIER_LABELS, NIGHTLY_RATES, PricingTier, PET_FEE_AUD } from '@/lib/pricing'
import { MIN_ADVANCE_DAYS, earliestCheckInStr, latestCheckInStr } from '@/lib/booking-window'
import { isTurnoverCheckout, nightDates, nightsIncludeBlocked } from '@/lib/stay-nights'
import { trackClick } from '@/lib/analytics'

type PricingState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; overrides: Record<string, number>; tierPrices: Record<PricingTier, number>; minNightsMap: Record<string, number> }

function usePricingOverrides(): PricingState {
  const [state, setState] = useState<PricingState>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/pricing-overrides')
      .then((r) => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      })
      .then((data) => setState({
        status: 'loaded',
        overrides: data.overrides,
        tierPrices: data.tierPrices,
        minNightsMap: data.minNightsMap ?? {},
      }))
      .catch(() => setState({ status: 'error' }))
  }, [])

  return state
}

const TZ = 'Australia/Melbourne'

export default function Calendar({
  blockedDates: blockedDatesProp,
  isLoading: isLoadingProp,
  lastUpdated: lastUpdatedProp,
}: {
  blockedDates?: string[]
  isLoading?: boolean
  lastUpdated?: string | null
}) {
  const availability = useAvailability({ enabled: blockedDatesProp === undefined })
  const pricing = usePricingOverrides()

  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [todayStr, setTodayStr] = useState('')
  const [earliest, setEarliest] = useState('')
  const [latest, setLatest] = useState('')
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)

  useEffect(() => {
    // The homepage is statically generated, so any date computed during the
    // server build is frozen at build time — that's why past days were still
    // shown as "available". React also never reconciles className mismatches
    // during hydration, so we compute "today" on the client after mount and
    // render a neutral skeleton until then.
    const now = new Date()
    setCurrentMonth(toZonedTime(now, TZ))
    setTodayStr(formatInTimeZone(now, TZ, 'yyyy-MM-dd'))
    setEarliest(earliestCheckInStr(now))
    setLatest(latestCheckInStr(now))
    setMounted(true)
  }, [])

  const blockedDates = blockedDatesProp ?? availability.blockedDates
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])
  const isLoading = isLoadingProp ?? availability.isLoading
  const lastUpdated = lastUpdatedProp ?? availability.lastUpdated

  const pricingReady = pricing.status === 'loaded'
  const overrides = pricingReady ? pricing.overrides : {}
  const tierPrices = pricingReady ? pricing.tierPrices : NIGHTLY_RATES
  const minNightsMap = pricingReady ? pricing.minNightsMap : {}

  const monthStart = currentMonth ? startOfMonth(currentMonth) : null
  const monthEnd = currentMonth ? endOfMonth(currentMonth) : null
  const calendarDays =
    monthStart && monthEnd
      ? eachDayOfInterval({
          start: startOfWeek(monthStart, { weekStartsOn: 1 }),
          end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
        })
      : []

  // Date string helpers (all in AU timezone)
  const auStr = (date: Date) => formatInTimeZone(date, TZ, 'yyyy-MM-dd')

  const isBlocked = (date: Date) => blockedSet.has(auStr(date))
  const isPast = (date: Date) => !!todayStr && auStr(date) < todayStr
  // Within the advance-notice window (today .. earliest-1): not bookable.
  const isTooSoon = (date: Date) => !!earliest && !isPast(date) && auStr(date) < earliest
  const isTooFar = (date: Date) => !!latest && auStr(date) > latest
  const isAvailable = (date: Date) => !isPast(date) && !isTooSoon(date) && !isTooFar(date) && !isBlocked(date)
  // Arrival afternoon of an existing booking: selectable as checkout only.
  const isCheckoutOnly = (date: Date) => {
    if (!checkIn || checkOut) return false
    if (isPast(date) || isTooSoon(date) || isTooFar(date)) return false
    return isTurnoverCheckout(auStr(checkIn), auStr(date), blockedSet)
  }
  const isToday = (date: Date) => auStr(date) === todayStr
  const isCheckIn = (date: Date) => !!checkIn && auStr(date) === auStr(checkIn)
  const isCheckOut = (date: Date) => !!checkOut && auStr(date) === auStr(checkOut)
  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false
    const s = auStr(date)
    return s > auStr(checkIn) && s < auStr(checkOut)
  }

  const handleDayClick = (day: Date) => {
    if (isPast(day) || isTooSoon(day) || isTooFar(day)) return

    const dayS = auStr(day)
    const blocked = blockedSet.has(dayS)

    // A booked night cannot start a stay. It can only end one, on the morning
    // the next guest arrives.
    if (!checkIn || checkOut) {
      if (blocked) return
      setCheckIn(day)
      setCheckOut(null)
      return
    }

    const ciS = auStr(checkIn)
    if (dayS === ciS) return

    if (dayS < ciS) {
      if (blocked) return
      setCheckIn(day)
      setCheckOut(null)
      return
    }

    const turnover = blocked && isTurnoverCheckout(ciS, dayS, blockedSet)
    if (blocked && !turnover) return

    if (nightsIncludeBlocked(ciS, dayS, blockedSet)) {
      setCheckIn(day)
      setCheckOut(null)
      return
    }

    const nights = nightDates(ciS, dayS)
    const requiredMin = nights.reduce((max, night) => {
      const minNights = minNightsMap[night]
      return minNights && minNights > max ? minNights : max
    }, 1)
    if (nights.length < requiredMin) {
      if (turnover) return
      setCheckIn(day)
      setCheckOut(null)
      return
    }

    setCheckOut(day)
  }

  const clearDates = () => {
    setCheckIn(null)
    setCheckOut(null)
  }

  // Pricing summary — only compute when pricing data is loaded (show "-" otherwise)
  const summary =
    checkIn && checkOut && pricingReady
      ? getPriceSummary(auStr(checkIn), auStr(checkOut), overrides, tierPrices)
      : null
  const pricingPending = checkIn && checkOut && !pricingReady
  const grouped = summary ? groupNightsByTier(summary.nights) : []

  const selectionPrompt = !checkIn
    ? 'Select check-in date'
    : !checkOut
    ? 'Now select check-out date'
    : null

  return (
    <section id="calendar" className="section-padding bg-white dark:bg-[#1a1a18] scroll-mt-24 md:scroll-mt-28">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="heading-primary">Availability &amp; Pricing</h2>
          <p className="text-luxury text-gray-600">
            Select your dates to see pricing — all fees included, no surprises
          </p>
          {/* Direct booking savings badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm">
            <span className="material-icons text-luxury-gold" style={{ fontSize: '16px' }}>savings</span>
            <span className="text-base font-sans font-semibold text-white tracking-wide shake-attention">
              Book directly &amp; save up to 10%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">

            {/* Selection prompt */}
            <div className="flex items-center justify-between mb-6 min-h-[32px]">
              <div className="flex items-center gap-2">
                {selectionPrompt ? (
                  <>
                    <span className="material-icons text-luxury-gold" style={{ fontSize: '18px' }}>touch_app</span>
                    <span className="text-base font-sans font-semibold text-luxury-dark tracking-wide">{selectionPrompt}</span>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-base text-gray-800 font-sans">
                    <span className="font-semibold text-luxury-dark">{checkIn && format(checkIn, 'd MMM yyyy')}</span>
                    <span className="text-luxury-gold">→</span>
                    <span className="font-semibold text-luxury-dark">{checkOut && format(checkOut, 'd MMM yyyy')}</span>
                    <span className="text-gray-600">({summary?.totalNights} nights)</span>
                  </div>
                )}
              </div>
              {(checkIn || checkOut) && (
                <button
                  onClick={clearDates}
                  className="text-sm font-sans font-semibold text-gray-600 hover:text-luxury-dark underline underline-offset-2 transition-colors"
                >
                  Clear dates
                </button>
              )}
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth((m) => (m ? subMonths(m, 1) : m))}
                disabled={!mounted}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/40 shadow-sm hover:bg-luxury-gold hover:text-white hover:border-luxury-gold transition-colors disabled:opacity-40"
                aria-label="Previous month"
              >
                <span className="material-icons" style={{ fontSize: '26px' }}>chevron_left</span>
              </button>
              <h3 className="text-2xl font-serif font-semibold text-luxury-dark">
                {currentMonth ? format(currentMonth, 'MMMM yyyy') : ' '}
              </h3>
              <button
                onClick={() => setCurrentMonth((m) => (m ? addMonths(m, 1) : m))}
                disabled={!mounted}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/40 shadow-sm hover:bg-luxury-gold hover:text-white hover:border-luxury-gold transition-colors disabled:opacity-40"
                aria-label="Next month"
              >
                <span className="material-icons" style={{ fontSize: '26px' }}>chevron_right</span>
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {!mounted
                ? Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-50 animate-pulse" />
                  ))
                : calendarDays.map((day) => {
                const blocked = isBlocked(day)
                const available = isAvailable(day)
                const past = isPast(day)
                const tooSoon = isTooSoon(day)
                const tooFar = isTooFar(day)
                const today = isToday(day)
                const ci = isCheckIn(day)
                const co = isCheckOut(day)
                const inRange = isInRange(day)
                const checkoutOnly = isCheckoutOnly(day)
                const isCurrentMonth = !!monthStart && !!monthEnd && day >= monthStart && day <= monthEnd

                let cellClass = 'aspect-square flex items-center justify-center text-base font-medium transition-all select-none '

                if (!isCurrentMonth) cellClass += 'opacity-20 '

                if (ci || co) {
                  cellClass += 'bg-luxury-gold text-white rounded-lg cursor-pointer '
                } else if (inRange) {
                  cellClass += 'bg-luxury-gold/20 text-luxury-dark rounded-lg cursor-pointer '
                } else if (past || tooSoon || tooFar) {
                  cellClass += 'bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed '
                } else if (checkoutOnly) {
                  cellClass += 'bg-green-50 text-green-800 rounded-lg cursor-pointer ring-2 ring-inset ring-luxury-gold hover:bg-luxury-gold/30 hover:text-luxury-dark '
                } else if (blocked) {
                  cellClass += 'bg-red-100 text-red-600 rounded-lg line-through cursor-not-allowed '
                } else if (available) {
                  cellClass += 'bg-green-50 text-green-800 rounded-lg cursor-pointer hover:bg-luxury-gold/30 hover:text-luxury-dark '
                } else {
                  cellClass += 'bg-gray-50 text-gray-400 rounded-lg '
                }

                if (today && !ci && !co) cellClass += 'ring-2 ring-luxury-gold '

                return (
                  <div
                    key={day.toString()}
                    className={cellClass}
                    onClick={() => handleDayClick(day)}
                    title={ci ? 'Check-in' : co ? 'Check-out' : checkoutOnly ? 'Checkout morning only — booked from the afternoon' : blocked ? 'Booked' : past ? 'Past' : tooSoon ? `${MIN_ADVANCE_DAYS} days notice required` : tooFar ? 'Beyond booking window' : available ? 'Available' : ''}
                  >
                    {format(day, 'd')}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-green-50 border border-green-300" />
                <span className="text-gray-600">Available</span>
              </div>
              {checkIn && !checkOut && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-green-50 border-2 border-luxury-gold" />
                  <span className="text-gray-600">Checkout only</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-luxury-gold" />
                <span className="text-gray-600">Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-luxury-gold/20 border border-luxury-gold/40" />
                <span className="text-gray-600">Your stay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300" />
                <span className="text-gray-600">Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-gray-100" />
                <span className="text-gray-600">Past</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded ring-2 ring-luxury-gold bg-white" />
                <span className="text-gray-600">Today</span>
              </div>
            </div>

            {/* Pricing Panel — shown after both dates selected */}
            <AnimatePresence>
              {(summary || pricingPending) && (
                <motion.div
                  key="pricing-panel"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35 }}
                  className="mt-6 border-t pt-6"
                >
                  <h4 className="font-serif text-xl font-semibold text-luxury-dark mb-4">
                    Price Breakdown
                  </h4>

                  {pricingPending ? (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-500 text-base">
                        <span className="material-icons animate-spin" style={{ fontSize: '16px' }}>autorenew</span>
                        Loading prices…
                      </div>
                      <div className="border-t pt-4 flex items-center justify-between">
                        <span className="font-sans font-semibold text-luxury-dark">Total — direct booking</span>
                        <span className="text-xl font-serif font-bold text-gray-400">-</span>
                      </div>
                    </div>
                  ) : summary ? (
                    <>
                      {/* Per-tier rows */}
                      <div className="space-y-2 mb-4">
                        {grouped.map(({ tier, count, subtotal, hasOverride }) => {
                          const perNight = Math.round(subtotal / count)
                          return (
                            <div key={tier} className="flex items-start justify-between gap-3 text-base">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                                <span className="text-gray-700">{count} × {TIER_LABELS[tier]}</span>
                                <span className="text-gray-600 text-sm">
                                  @ ${perNight.toLocaleString()}/night
                                  {hasOverride && <span className="ml-1 text-luxury-gold text-xs">(custom)</span>}
                                </span>
                              </div>
                              <span className="font-semibold text-luxury-dark whitespace-nowrap">${subtotal.toLocaleString()}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Divider + totals */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-semibold text-luxury-dark">
                            Total — direct booking
                          </span>
                          <span className="text-xl font-serif font-bold text-luxury-dark">
                            ${summary.total.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Cleaning, linen &amp; taxes included — no hidden charges.
                        </p>
                        <p className="text-sm text-gray-600 mt-1.5">
                          Optional pets: <span className="font-semibold text-luxury-dark">${PET_FEE_AUD} AUD</span> pet cleaning fee (added at checkout if you&rsquo;re travelling with a pet).
                        </p>
                      </div>
                    </>
                  ) : null}

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Link
                      href={`/book?checkIn=${checkIn ? auStr(checkIn) : ''}&checkOut=${checkOut ? auStr(checkOut) : ''}`}
                      onClick={() => trackClick('Book Directly', {
                        location: 'Calendar',
                        checkIn: checkIn ? auStr(checkIn) : '',
                        checkOut: checkOut ? auStr(checkOut) : '',
                      })}
                      className="btn-primary flex-1 inline-flex items-center gap-2 justify-center"
                    >
                      <span className="material-icons" style={{ fontSize: '14px' }}>calendar_today</span>
                      Book Directly &amp; Save
                    </Link>
                    <button
                      onClick={clearDates}
                      className="flex-1 inline-flex items-center gap-2 justify-center px-6 py-3.5 border border-gray-300 text-gray-700 text-sm font-sans font-semibold tracking-wider uppercase hover:border-gray-400 transition-colors"
                      style={{ borderRadius: '2px' }}
                    >
                      Clear &amp; Re-select
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom info note */}
            <div className="mt-6 p-4 bg-luxury-light rounded-lg">
              <div className="flex items-center justify-center gap-2 text-base text-gray-700">
                <span className="material-icons" style={{ fontSize: '16px' }}>calendar_today</span>
                <span>Calendar syncs with all booking platforms automatically.</span>
                {isLoading && (
                  <span className="material-icons animate-spin ml-1" style={{ fontSize: '14px' }}>autorenew</span>
                )}
              </div>
              {lastUpdated && !isLoading && (
                <p className="text-sm text-gray-600 text-center mt-1">
                  Last updated: {format(new Date(lastUpdated), 'MMM d, yyyy h:mm a')}
                </p>
              )}
              <p className="text-sm md:text-base text-gray-700 text-center mt-3 leading-relaxed">
                Minimum stay starts at <span className="font-semibold">2 nights</span>. School &amp; public holidays typically require{' '}
                <span className="font-semibold">3–5 nights</span> minimum. Bookings require at least{' '}
                <span className="font-semibold">{MIN_ADVANCE_DAYS} days&rsquo; advance notice</span>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
