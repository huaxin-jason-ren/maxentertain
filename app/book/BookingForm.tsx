'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import type { BookingGroupType, BookingPricing } from '@/types/booking'
import { PET_FEE_AUD, BOND_AMOUNT_AUD } from '@/lib/pricing'
import { MAX_OCCUPANCY } from '@/lib/booking-window'
import BookingSummary from '@/components/BookingSummary'
import CancellationPolicy from '@/components/CancellationPolicy'
import { getDiscoveryContext } from '@/lib/discovery-client'

const GROUP_OPTIONS: { value: BookingGroupType; label: string }[] = [
  { value: 'family', label: 'Multi-generational family stay' },
  { value: 'milestone', label: 'Milestone birthday / celebration' },
  { value: 'golf', label: 'Golf group' },
  { value: 'corporate', label: 'Corporate retreat' },
  { value: 'other', label: 'Other' },
]

const inputClass =
  'mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-luxury-dark transition-colors outline-none focus:border-luxury-gold focus:bg-white focus:ring-2 focus:ring-luxury-gold/20 dark:border-white/10 dark:bg-[#141411]/80 dark:text-white dark:placeholder-white/30 dark:focus:bg-[#141411]'

const labelClass =
  'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'

export default function BookingForm({
  checkIn,
  checkOut,
  pricing,
}: {
  checkIn: string
  checkOut: string
  pricing: BookingPricing
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [withPet, setWithPet] = useState(false)

  // The server computes the authoritative total; this mirrors the pet fee live
  // in the summary + Pay button as the guest toggles it.
  const displayPricing: BookingPricing = withPet
    ? {
        ...pricing,
        petFeeAud: PET_FEE_AUD,
        totalAud: pricing.totalAud + PET_FEE_AUD,
        totalCents: (pricing.totalAud + PET_FEE_AUD) * 100,
      }
    : pricing

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const payload = {
      checkIn,
      checkOut,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      guests: Number(form.get('guests') ?? 0),
      groupType: String(form.get('groupType') ?? 'other'),
      pets: String(form.get('pets') ?? ''),
      withPet,
      message: String(form.get('message') ?? ''),
      rulesAccepted: form.get('rulesAccepted') === 'on',
      discovery: getDiscoveryContext(),
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error === 'DATES_UNAVAILABLE'
          ? 'Those dates were just taken. Please choose another date range.'
          : data.error ?? 'Booking could not be started')
      }

      if (!data.checkoutUrl) throw new Error('Stripe checkout URL was not returned')
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking could not be started')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <form onSubmit={submit} className="rounded-2xl border-t-2 border-luxury-gold/60 bg-white/[0.97] p-6 shadow-2xl backdrop-blur-sm dark:bg-[#1a1a1a]/[0.97] md:p-8">

          {/* Badge + heading */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-luxury-gold/30 bg-luxury-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-luxury-gold">
            <span className="material-icons text-[12px]">verified</span>
            Direct Booking — No Platform Fees
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold text-luxury-dark dark:text-white md:text-4xl">
            Secure Your Stay
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Your dates are held for 30 minutes once checkout opens. Pay securely with Stripe — no platform surcharge.
          </p>

          {/* Section divider */}
          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Guest Details</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/10" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>
                <span className="material-icons text-[14px] text-luxury-gold">person</span>
                Full name
              </span>
              <input name="name" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>
                <span className="material-icons text-[14px] text-luxury-gold">email</span>
                Email
              </span>
              <input name="email" type="email" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>
                <span className="material-icons text-[14px] text-luxury-gold">phone</span>
                Phone
              </span>
              <input name="phone" required placeholder="+61 ..." className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>
                <span className="material-icons text-[14px] text-luxury-gold">group</span>
                Guests (max {MAX_OCCUPANCY})
              </span>
              <input name="guests" type="number" min={1} max={MAX_OCCUPANCY} required className={inputClass} />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass}>
                <span className="material-icons text-[14px] text-luxury-gold">category</span>
                Group type
              </span>
              <select name="groupType" required className={inputClass}>
                {GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2 rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={withPet}
                  onChange={(e) => setWithPet(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-luxury-gold"
                />
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="material-icons text-[16px] text-luxury-gold">pets</span>
                  I&rsquo;m travelling with a pet
                  <span className="font-semibold text-luxury-dark dark:text-white">(+${PET_FEE_AUD} pet cleaning fee)</span>
                </span>
              </label>
              {withPet ? (
                <input
                  name="pets"
                  placeholder="Tell us about your pet — breed, size, etc."
                  className={`${inputClass} mt-3`}
                />
              ) : null}
            </div>
            <label className="block md:col-span-2">
              <span className={labelClass}>
                <span className="material-icons text-[14px] text-luxury-gold">chat_bubble_outline</span>
                Tell Jason about your stay
              </span>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Occasion, family mix, arrival plans, or anything we should know."
                className={inputClass}
              />
            </label>
          </div>

          {/* Terms & House Rules */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Terms &amp; House Rules
            </p>
            <ul className="mb-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span>Maximum <strong>{MAX_OCCUPANCY} people</strong> on the property at any time — adults and children combined.</span></li>
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span><strong>Strictly no parties or events.</strong> The Mornington Peninsula Shire Short Stay Code of Conduct applies and noise is monitored.</span></li>
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span>Outdoor areas (pool, spa, decks, balconies) are closed <strong>11 pm–7 am</strong>.</span></li>
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span>This is <strong>not a Schoolies</strong> booking. No smoking indoors. Pets only by prior disclosure.</span></li>
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span>A <strong>refundable ${BOND_AMOUNT_AUD} security hold</strong> is placed before check-in and <strong>automatically released after checkout</strong> — you&rsquo;re only charged if damage is claimed.</span></li>
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span>Guests are responsible for any damage or excessive cleaning beyond fair wear and tear.</span></li>
              <li className="flex gap-2"><span className="text-luxury-gold">•</span><span>The <Link href="/terms" target="_blank" className="text-luxury-gold underline underline-offset-2">full terms</Link> and the cancellation policy shown on this page apply.</span></li>
            </ul>
            <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
              <input name="rulesAccepted" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-luxury-gold" />
              <span>I have read and accept the Terms &amp; House Rules above.</span>
            </label>
          </div>

          {error ? (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <span className="material-icons shrink-0 text-[16px]">error_outline</span>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-7 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="material-icons animate-spin text-[18px]">sync</span>
                Opening Secure Checkout…
              </>
            ) : (
              <>
                <span className="material-icons text-[18px]">lock</span>
                Pay ${displayPricing.totalAud.toLocaleString()} Securely
              </>
            )}
          </button>

          {/* Trust signals */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="material-icons text-[13px]">verified_user</span>
              Powered by Stripe
            </span>
            <span className="flex items-center gap-1">
              <span className="material-icons text-[13px]">schedule</span>
              30-min date hold
            </span>
            <span className="flex items-center gap-1">
              <span className="material-icons text-[13px]">receipt_long</span>
              Invoice provided
            </span>
          </div>
        </form>
      </div>

      <aside className="space-y-5 lg:col-span-5">
        <BookingSummary pricing={displayPricing} checkIn={checkIn} checkOut={checkOut} showLevy />
        <div className="rounded-2xl border border-luxury-gold/20 bg-white/[0.97] p-5 text-sm text-gray-700 shadow-xl dark:bg-[#1a1a1a]/[0.97] dark:text-gray-300">
          <div className="mb-1.5 flex items-center gap-2 font-semibold text-luxury-dark dark:text-white">
            <span className="material-icons text-luxury-gold text-[18px]">verified_user</span>
            ${BOND_AMOUNT_AUD} refundable security hold
          </div>
          <p className="leading-relaxed">
            A ${BOND_AMOUNT_AUD} hold is placed on your card a day or two before check-in and{' '}
            <strong>released automatically after checkout</strong>. It is not a charge — you&rsquo;re only
            charged if damage is claimed. Bank release times vary.
          </p>
        </div>
        <CancellationPolicy />
      </aside>
    </div>
  )
}
