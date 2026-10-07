'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BookingRecord, BookingStatus } from '@/types/booking'

const STATUS_OPTIONS: Array<{ id: 'all' | BookingStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending_payment', label: 'Pending holds' },
  { id: 'cancelling', label: 'Cancelling' },
  { id: 'refund_pending', label: 'Refund pending' },
  { id: 'payment_orphaned', label: 'Payment issues' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'expired', label: 'Expired' },
  { id: 'completed', label: 'Completed' },
]

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending_payment: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-green-500/15 text-green-300 border-green-500/30',
  cancelling: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  refund_pending: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  payment_orphaned: 'bg-red-500/15 text-red-300 border-red-500/30',
  expired: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  refunded: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  completed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
}

type BookingEvent = {
  _id: string
  event: string
  data?: Record<string, unknown>
  createdAt: string
}

type CommsItem = {
  key: string
  label: string
  audience: 'guest'
  description: string
  status: 'sent' | 'scheduled' | 'missed' | 'skipped' | 'awaiting_payment'
  sentAt?: string
  scheduledAt?: string
  note?: string
}

const COMMS_STATUS_STYLE: Record<CommsItem['status'], string> = {
  sent: 'bg-green-500/15 text-green-300 border-green-500/30',
  scheduled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  missed: 'bg-red-500/15 text-red-300 border-red-500/30',
  skipped: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  awaiting_payment: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
}

const COMMS_STATUS_LABEL: Record<CommsItem['status'], string> = {
  sent: 'Sent',
  scheduled: 'Scheduled',
  missed: 'Missed',
  skipped: 'Not applicable',
  awaiting_payment: 'Awaiting payment',
}

function bondLabel(b?: BookingRecord['bond']) {
  if (!b || b.status === 'none') return '—'
  if (b.status === 'authorized') return `held $${b.amountAud} (refundable)`
  if (b.status === 'released') return 'released'
  if (b.status === 'captured') return `charged $${b.capturedAmountAud ?? b.amountAud}`
  if (b.status === 'failed') return `hold failed${b.lastError ? ` — ${b.lastError}` : ''}`
  return '—'
}

// Exact instant in the owner's timezone, to the second.
function fmtMelbourne(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [status, setStatus] = useState<'all' | BookingStatus>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [eventsByBooking, setEventsByBooking] = useState<Record<string, BookingEvent[]>>({})
  const [openBookingId, setOpenBookingId] = useState<string | null>(null)
  const [openArrivalId, setOpenArrivalId] = useState<string | null>(null)
  const [arrivalDraft, setArrivalDraft] = useState<Record<string, { details: string; passcode: string }>>({})
  const [openExtensionId, setOpenExtensionId] = useState<string | null>(null)
  const [extensionDraft, setExtensionDraft] = useState<Record<string, { checkOut: string; revisedTotalAud: string; note: string }>>({})
  const [extensionPreview, setExtensionPreview] = useState<Record<string, { automaticRevisedTotalAud: number; adjustmentAud: number; addedDates: string[]; removedDates: string[] }>>({})
  const [commsByBooking, setCommsByBooking] = useState<Record<string, CommsItem[]>>({})
  const [openCommsId, setOpenCommsId] = useState<string | null>(null)
  const [health, setHealth] = useState<Record<string, boolean> | null>(null)
  const [icalExportConfigured, setIcalExportConfigured] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/maxowner/bookings?status=${status}&page=${page}`)
    const data = await res.json()
    setBookings(data.bookings ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [status, page])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/maxowner/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data.checks ?? null)
        setIcalExportConfigured(Boolean(data.icalExportConfigured ?? data.checks?.icalExportSecret))
      })
      .catch(() => setHealth(null))
  }, [])

  const resendConfirmation = async (bookingId: string) => {
    await runAction(bookingId, { action: 'resend_confirmation' }, 'Confirmation email resent.')
  }

  const runAction = async (bookingId: string, payload: Record<string, unknown>, okMessage: string) => {
    setMessage('')
    const res = await fetch('/api/maxowner/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, ...payload }),
    })
    const data = await res.json().catch(() => ({}))
    setMessage(res.ok ? okMessage : data.error ?? 'Action failed.')
    if (res.ok) load()
  }

  const toggleArrival = (booking: BookingRecord) => {
    setOpenArrivalId((current) => (current === booking._id ? null : booking._id))
    setArrivalDraft((prev) =>
      prev[booking._id]
        ? prev
        : {
            ...prev,
            [booking._id]: {
              details: booking.arrival?.details ?? '',
              passcode: booking.arrival?.passcode ?? '',
            },
          }
    )
  }

  const saveArrival = async (bookingId: string) => {
    const draft = arrivalDraft[bookingId] ?? { details: '', passcode: '' }
    await runAction(
      bookingId,
      { action: 'set_arrival', details: draft.details, passcode: draft.passcode },
      'Arrival details saved.'
    )
    setOpenArrivalId(null)
  }

  const toggleExtension = (booking: BookingRecord) => {
    setOpenExtensionId((current) => current === booking._id ? null : booking._id)
    setExtensionDraft((current) => current[booking._id] ? current : {
      ...current,
      [booking._id]: { checkOut: '', revisedTotalAud: '', note: '' },
    })
  }

  const previewExtension = async (booking: BookingRecord) => {
    const draft = extensionDraft[booking._id]
    if (!draft?.checkOut) return
    setMessage('')
    const response = await fetch(`/api/maxowner/offers?bookingId=${encodeURIComponent(booking._id)}&checkOut=${encodeURIComponent(draft.checkOut)}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(data.error ?? 'Could not calculate the amendment.')
      return
    }
    setExtensionPreview((current) => ({ ...current, [booking._id]: data.preview }))
    setExtensionDraft((current) => ({
      ...current,
      [booking._id]: {
        ...current[booking._id],
        revisedTotalAud: String(data.preview.automaticRevisedTotalAud),
      },
    }))
  }

  const sendExtensionOffer = async (booking: BookingRecord) => {
    const draft = extensionDraft[booking._id]
    setMessage('')
    const response = await fetch('/api/maxowner/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        kind: 'extension',
        bookingId: booking._id,
        checkOut: draft?.checkOut,
        revisedTotalAud: Number(draft?.revisedTotalAud),
        note: draft?.note,
        inclusions: 'Booking date amendment, Victorian short-stay levy and payment processing',
      }),
    })
    const data = await response.json().catch(() => ({}))
    setMessage(response.ok ? 'Amendment offer sent. Any added dates are held for 24 hours.' : data.error ?? 'Could not send amendment offer.')
    if (response.ok) setOpenExtensionId(null)
  }

  const loadComms = async (bookingId: string) => {
    setOpenCommsId((current) => (current === bookingId ? null : bookingId))
    if (commsByBooking[bookingId]) return
    const res = await fetch(`/api/maxowner/bookings/${bookingId}/comms`)
    const data = await res.json().catch(() => ({}))
    setCommsByBooking((prev) => ({ ...prev, [bookingId]: data.timeline ?? [] }))
  }

  const loadEvents = async (bookingId: string) => {
    setOpenBookingId((current) => current === bookingId ? null : bookingId)
    if (eventsByBooking[bookingId]) return
    const res = await fetch(`/api/maxowner/bookings/${bookingId}/events`)
    const data = await res.json()
    setEventsByBooking((prev) => ({ ...prev, [bookingId]: data.events ?? [] }))
  }

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-40 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-serif text-luxury-gold">Bookings</h1>
          <p className="text-sm text-gray-400">{total} bookings in this view</p>
        </div>
      </div>

      {health ? (
        <div className="mb-6 grid gap-2 md:grid-cols-4">
          {Object.entries(health).map(([key, ok]) => (
            <div key={key} className="rounded-lg border border-white/10 bg-[#1a1a18] px-4 py-3 text-sm">
              <span className={ok ? 'text-green-300' : 'text-red-300'}>{ok ? 'OK' : 'Needs setup'}</span>
              <span className="ml-2 text-gray-400">{key}</span>
            </div>
          ))}
        </div>
      ) : null}

      {icalExportConfigured ? (
        <div className="mb-6 rounded-lg border border-luxury-gold/20 bg-luxury-gold/10 px-4 py-3 text-sm text-luxury-gold">
          <p className="font-semibold">Private direct-booking iCal feed</p>
          <p className="mt-1 text-luxury-gold/80">
            Configured. Use{' '}
            <code className="text-xs">/api/calendar/direct-bookings.ics?token=&lt;ICAL_EXPORT_SECRET&gt;</code>{' '}
            with the secret from your server env (never stored in this UI).
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setStatus(option.id)
              setPage(1)
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              status === option.id
                ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-gold'
                : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {message ? <p className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">{message}</p> : null}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#1a1a18] p-12 text-center">
          <p className="text-gray-500">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-xl border border-white/10 bg-[#1a1a18] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-white">{booking.guest.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[booking.status]}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className="rounded-full border border-luxury-gold/30 bg-luxury-gold/10 px-2 py-0.5 text-xs text-luxury-gold">
                      {booking.guest.groupType}
                    </span>
                    {booking.guest.withPet ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                        <span className="material-icons" style={{ fontSize: '12px' }}>pets</span>
                        Travelling with pet
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-1 text-sm text-gray-400 md:grid-cols-2">
                    <p>{booking.guest.email}</p>
                    <p>{booking.guest.phone}</p>
                    <p>{booking.checkIn} to {booking.checkOut} ({booking.nights} nights)</p>
                    <p>
                      ${booking.pricing.totalAud.toLocaleString()} total
                      {booking.pricing.petFeeAud ? ` (incl. $${booking.pricing.petFeeAud} pet fee)` : ''}
                    </p>
                    <p>Payment intent: {booking.payment.stripePaymentIntentId ?? '—'}</p>
                    <p>Refund ID: {booking.refundStripeId ?? '—'}</p>
                    <p>
                      Terms accepted:{' '}
                      {booking.agreement
                        ? `${new Date(booking.agreement.acceptedAt).toLocaleDateString()} · v${booking.agreement.version}`
                        : '—'}
                    </p>
                    <p>Security bond: {bondLabel(booking.bond)}</p>
                  </div>
                  {booking.refundAmountAud ? (
                    <p className="mt-2 text-sm text-purple-300">Refunded: ${booking.refundAmountAud.toLocaleString()}</p>
                  ) : null}
                  {booking.guest.message ? (
                    <p className="mt-3 rounded-lg bg-black/20 px-4 py-3 text-sm leading-relaxed text-gray-300">{booking.guest.message}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {booking.payment.stripeInvoiceUrl ? (
                    <a href={booking.payment.stripeInvoiceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-luxury-gold hover:text-luxury-gold">
                      Invoice
                    </a>
                  ) : null}
                  {booking.status === 'confirmed' ? (
                    <button
                      onClick={() => resendConfirmation(booking._id)}
                      className="rounded-lg border border-luxury-gold/40 px-3 py-2 text-xs font-semibold text-luxury-gold hover:bg-luxury-gold/10"
                    >
                      Resend confirmation
                    </button>
                  ) : null}
                  {booking.status === 'confirmed' ? (
                    <button
                      onClick={() => toggleExtension(booking)}
                      className="rounded-lg border border-luxury-gold/40 px-3 py-2 text-xs font-semibold text-luxury-gold hover:bg-luxury-gold/10"
                    >
                      {openExtensionId === booking._id ? 'Close amendment' : 'Change dates / price'}
                    </button>
                  ) : null}
                  {booking.status === 'confirmed' ? (
                    <button
                      onClick={() => toggleArrival(booking)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-luxury-gold hover:text-luxury-gold"
                    >
                      {openArrivalId === booking._id ? 'Close arrival info' : booking.arrival?.details || booking.arrival?.passcode ? 'Edit arrival info' : 'Add arrival info'}
                    </button>
                  ) : null}
                  {booking.status === 'pending_payment' ? (
                    <button
                      onClick={() => runAction(booking._id, { action: 'expire_hold' }, 'Pending hold expired.')}
                      className="rounded-lg border border-yellow-500/40 px-3 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-500/10"
                    >
                      Expire hold
                    </button>
                  ) : null}
                  {booking.bond?.status === 'authorized' ? (
                    <>
                      <button
                        onClick={() => runAction(booking._id, { action: 'release_bond' }, 'Security hold released.')}
                        className="rounded-lg border border-green-500/40 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/10"
                      >
                        Release hold
                      </button>
                      <button
                        onClick={() => {
                          const amount = window.prompt(`Damage charge to take from the $${booking.bond?.amountAud ?? 300} bond (AUD)`, String(booking.bond?.amountAud ?? 300))
                          if (amount !== null) {
                            runAction(booking._id, { action: 'capture_bond', amountAud: Number(amount) }, 'Bond captured for damage.')
                          }
                        }}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                      >
                        Claim damage
                      </button>
                    </>
                  ) : null}
                  {['confirmed', 'cancelled', 'payment_orphaned'].includes(booking.status) ? (
                    <button
                      onClick={() => {
                        const amount = window.prompt('Manual refund amount in AUD', String(booking.refundAmountAud ?? 0))
                        if (amount !== null) {
                          runAction(
                            booking._id,
                            { action: 'mark_manual_refund', refundAmountAud: Number(amount), reason: 'Owner marked manual refund' },
                            'Manual refund marked.'
                          )
                        }
                      }}
                      className="rounded-lg border border-purple-500/40 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/10"
                    >
                      Mark manual refund
                    </button>
                  ) : null}
                  <button
                    onClick={() => loadComms(booking._id)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-luxury-gold hover:text-luxury-gold"
                  >
                    {openCommsId === booking._id ? 'Hide messages' : 'Guest messages'}
                  </button>
                  <button
                    onClick={() => loadEvents(booking._id)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-luxury-gold hover:text-luxury-gold"
                  >
                    {openBookingId === booking._id ? 'Hide events' : 'Events'}
                  </button>
                </div>
              </div>
              {openCommsId === booking._id ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Guest message timeline</p>
                  <p className="mb-3 text-xs text-gray-500">
                    Every email the guest receives. All times shown in Melbourne time, to the second. Scheduled sends fire from the daily comms run (Melbourne morning, ≈9am AEDT / 8am AEST).
                  </p>
                  <div className="space-y-2">
                    {(commsByBooking[booking._id] ?? []).map((item) => (
                      <div key={item.key} className="rounded-lg bg-black/20 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-gray-200">{item.label}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${COMMS_STATUS_STYLE[item.status]}`}>
                            {COMMS_STATUS_LABEL[item.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                        <div className="mt-2 grid gap-1 text-xs text-gray-400 md:grid-cols-2">
                          {item.status === 'sent' ? (
                            <p><span className="text-gray-500">Sent:</span> {fmtMelbourne(item.sentAt)}</p>
                          ) : item.status === 'scheduled' ? (
                            <p><span className="text-gray-500">Will send:</span> {fmtMelbourne(item.scheduledAt)}</p>
                          ) : item.scheduledAt ? (
                            <p><span className="text-gray-500">Was due:</span> {fmtMelbourne(item.scheduledAt)}</p>
                          ) : null}
                        </div>
                        {item.note ? <p className="mt-1 text-xs text-gray-500 italic">{item.note}</p> : null}
                      </div>
                    ))}
                    {(commsByBooking[booking._id] ?? []).length === 0 ? (
                      <p className="text-sm text-gray-500">Loading…</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {openArrivalId === booking._id ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Arrival &amp; check-in details</p>
                  <p className="mb-3 text-xs text-gray-500">
                    Sent to the guest in the 3-day pre-stay email (and the 1-day reminder for last-minute bookings). Stored privately — never shown publicly.
                  </p>
                  <label className="mb-1 block text-xs font-semibold text-gray-400">Arrival instructions (directions, parking, WiFi, etc.)</label>
                  <textarea
                    value={arrivalDraft[booking._id]?.details ?? ''}
                    onChange={(e) =>
                      setArrivalDraft((prev) => ({
                        ...prev,
                        [booking._id]: { details: e.target.value, passcode: prev[booking._id]?.passcode ?? '' },
                      }))
                    }
                    rows={5}
                    placeholder={'e.g. The property is at 1975 Point Nepean Road, Tootgarook.\nParking: driveway fits 3 cars.\nWiFi: MaxEntertain / password ...'}
                    className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-200 focus:border-luxury-gold focus:outline-none"
                  />
                  <label className="mb-1 block text-xs font-semibold text-gray-400">Door access code (override)</label>
                  <p className="mb-1 text-xs text-gray-500">
                    Leave blank to use the fixed property code (set via the DOOR_PASSCODE env var). Only fill this in to send a different code for this one booking.
                  </p>
                  <input
                    type="text"
                    value={arrivalDraft[booking._id]?.passcode ?? ''}
                    onChange={(e) =>
                      setArrivalDraft((prev) => ({
                        ...prev,
                        [booking._id]: { details: prev[booking._id]?.details ?? '', passcode: e.target.value },
                      }))
                    }
                    placeholder="Default: fixed property code"
                    className="mb-3 w-full max-w-xs rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-200 focus:border-luxury-gold focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveArrival(booking._id)}
                      className="rounded-lg border border-luxury-gold/40 px-4 py-2 text-xs font-semibold text-luxury-gold hover:bg-luxury-gold/10"
                    >
                      Save arrival details
                    </button>
                    <button
                      onClick={() => setOpenArrivalId(null)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-400 hover:border-white/30 hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              {openExtensionId === booking._id ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Stay price amendment</p>
                  <p className="mb-3 text-xs text-gray-500">
                    Current checkout is {booking.checkOut} and current total is ${booking.pricing.totalAud.toLocaleString()}. Added nights use current rates; removed nights use their originally paid rates.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-gray-400">
                      New checkout date
                      <input type="date" min={booking.checkIn} value={extensionDraft[booking._id]?.checkOut ?? ''} onChange={(event) => {
                        setExtensionDraft((current) => ({ ...current, [booking._id]: { ...current[booking._id], checkOut: event.target.value, revisedTotalAud: '' } }))
                        setExtensionPreview((current) => {
                          const next = { ...current }
                          delete next[booking._id]
                          return next
                        })
                      }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                    </label>
                    <label className="text-xs text-gray-400">
                      Revised booking total (AUD)
                      <input type="number" min={booking.pricing.petFeeAud} value={extensionDraft[booking._id]?.revisedTotalAud ?? ''} onChange={(event) => setExtensionDraft((current) => ({ ...current, [booking._id]: { ...current[booking._id], revisedTotalAud: event.target.value } }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                    </label>
                    {extensionPreview[booking._id] ? (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300 md:col-span-2">
                        <p>Existing total: <strong>${booking.pricing.totalAud.toLocaleString()}</strong></p>
                        <p>Automatic revised total: <strong>${extensionPreview[booking._id].automaticRevisedTotalAud.toLocaleString()}</strong></p>
                        <p className={Number(extensionDraft[booking._id]?.revisedTotalAud) - booking.pricing.totalAud < 0 ? 'text-green-300' : 'text-yellow-300'}>
                          {Number(extensionDraft[booking._id]?.revisedTotalAud) - booking.pricing.totalAud > 0
                            ? `Guest pays $${(Number(extensionDraft[booking._id]?.revisedTotalAud) - booking.pricing.totalAud).toLocaleString()}`
                            : Number(extensionDraft[booking._id]?.revisedTotalAud) - booking.pricing.totalAud < 0
                              ? `Guest receives $${Math.abs(Number(extensionDraft[booking._id]?.revisedTotalAud) - booking.pricing.totalAud).toLocaleString()} refund`
                              : 'No payment or refund required'}
                        </p>
                        <p className="mt-1 text-gray-500">{extensionPreview[booking._id].addedDates.length} night(s) added · {extensionPreview[booking._id].removedDates.length} night(s) removed</p>
                      </div>
                    ) : null}
                    <label className="text-xs text-gray-400 md:col-span-2">
                      Note from Jason
                      <textarea rows={2} value={extensionDraft[booking._id]?.note ?? ''} onChange={(event) => setExtensionDraft((current) => ({ ...current, [booking._id]: { ...current[booking._id], note: event.target.value } }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                    </label>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button disabled={!extensionDraft[booking._id]?.checkOut} onClick={() => previewExtension(booking)} className="rounded-lg border border-white/20 px-4 py-2 text-xs text-gray-200 disabled:opacity-50">Calculate difference</button>
                    <button disabled={!extensionPreview[booking._id] || !extensionDraft[booking._id]?.revisedTotalAud} onClick={() => sendExtensionOffer(booking)} className="rounded-lg bg-luxury-gold px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">Reserve and email amendment</button>
                    <button onClick={() => setOpenExtensionId(null)} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-400">Cancel</button>
                  </div>
                </div>
              ) : null}
              {openBookingId === booking._id ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Event timeline</p>
                  <div className="space-y-2">
                    {(eventsByBooking[booking._id] ?? []).map((event) => (
                      <div key={event._id} className="rounded-lg bg-black/20 px-4 py-3 text-xs text-gray-400">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-gray-200">{event.event}</span>
                          <span>{event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}</span>
                        </div>
                        {event.data ? (
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[11px] text-gray-500">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))}
                    {(eventsByBooking[booking._id] ?? []).length === 0 ? (
                      <p className="text-sm text-gray-500">No events recorded yet.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
