'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type Offer = {
  _id: string
  kind: 'new_booking' | 'extension'
  status: string
  guest: { name: string; email: string }
  checkIn: string
  checkOut: string
  nights: number
  amountDueAud: number
  refundDueAud?: number
  originalTotalAud: number
  expiresAt: string
  emailSentAt?: string
  emailError?: string
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  guests: '8',
  groupType: 'family',
  checkIn: '',
  checkOut: '',
  amountDueAud: '',
  withPet: false,
  note: '',
  inclusions: 'Accommodation, cleaning, Victorian short-stay levy and payment processing',
}

export default function OwnerOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [livePrice, setLivePrice] = useState<number | null>(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/maxowner/offers')
    const data = await response.json()
    setOffers(data.offers ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const response = await fetch('/api/maxowner/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        kind: 'new_booking',
        ...form,
        guests: Number(form.guests),
        amountDueAud: Number(form.amountDueAud),
        message: 'Owner-created special offer',
      }),
    })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    setMessage(response.ok ? 'Offer sent. The dates are held for 24 hours.' : data.error ?? 'Could not send offer.')
    if (response.ok) {
      setForm(emptyForm)
      setShowForm(false)
      load()
    }
  }

  const action = async (offerId: string, name: 'resend' | 'revoke') => {
    setMessage('')
    const response = await fetch('/api/maxowner/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: name, offerId }),
    })
    const data = await response.json().catch(() => ({}))
    setMessage(response.ok ? `Offer ${name === 'resend' ? 'resent' : 'revoked'}.` : data.error ?? 'Action failed.')
    if (response.ok) load()
  }

  const previewPrice = async () => {
    setMessage('')
    const response = await fetch(`/api/maxowner/offers?checkIn=${encodeURIComponent(form.checkIn)}&checkOut=${encodeURIComponent(form.checkOut)}`)
    const data = await response.json().catch(() => ({}))
    setLivePrice(response.ok ? data.quote?.totalAud ?? null : null)
    if (!response.ok) setMessage(data.error ?? 'Could not calculate the live price.')
  }

  return (
    <div className="p-4 pb-28 text-white md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold">Special Offers</h1>
          <p className="text-sm text-gray-400">Private quotes with a 24-hour date reservation.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-black">
          {showForm ? 'Close' : 'New offer'}
        </button>
      </div>

      {message ? <p className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">{message}</p> : null}

      {showForm ? (
        <form onSubmit={submit} className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-[#1a1a18] p-5 md:grid-cols-2">
          {[
            ['name', 'Guest name', 'text'],
            ['email', 'Email', 'email'],
            ['phone', 'Phone', 'text'],
            ['guests', 'Guests', 'number'],
            ['checkIn', 'Check-in', 'date'],
            ['checkOut', 'Check-out', 'date'],
            ['amountDueAud', 'Special offer total (AUD)', 'number'],
          ].map(([key, label, type]) => (
            <label key={key} className="text-xs text-gray-400">
              {label}
              <input
                required
                type={type}
                value={String(form[key as keyof typeof form])}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>
          ))}
          <label className="text-xs text-gray-400">
            Group type
            <select value={form.groupType} onChange={(event) => setForm((current) => ({ ...current, groupType: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
              <option value="family">Family</option><option value="corporate">Corporate</option><option value="golf">Golf</option><option value="milestone">Milestone</option><option value="other">Other</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.withPet} onChange={(event) => setForm((current) => ({ ...current, withPet: event.target.checked }))} />
            Travelling with a pet (the total must include the $100 fee)
          </label>
          <label className="text-xs text-gray-400 md:col-span-2">
            Inclusions
            <textarea value={form.inclusions} onChange={(event) => setForm((current) => ({ ...current, inclusions: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          </label>
          <label className="text-xs text-gray-400 md:col-span-2">
            Note from Jason
            <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          </label>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button type="button" disabled={!form.checkIn || !form.checkOut} onClick={previewPrice} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-200 disabled:opacity-40">Check live price</button>
            {livePrice !== null ? <span className="text-sm text-gray-300">Current public direct price: <strong className="text-white">${livePrice.toLocaleString()}</strong>{form.withPet ? ' + $100 pet fee' : ''}</span> : null}
            <button disabled={busy} className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {busy ? 'Checking and sending…' : 'Reserve dates and send'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {offers.map((offer) => {
          const active = ['sent', 'accepted', 'checkout_pending'].includes(offer.status)
          return (
            <div key={offer._id} className="rounded-xl border border-white/10 bg-[#1a1a18] p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{offer.guest.name}</p>
                    <span className="rounded-full border border-luxury-gold/30 px-2 py-0.5 text-xs text-luxury-gold">{offer.status.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500">{offer.kind.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{offer.guest.email}</p>
                  <p className="text-sm text-gray-400">{offer.checkIn} to {offer.checkOut} · {offer.nights} nights</p>
                  <p className="mt-1 text-sm text-white">
                    {offer.kind === 'extension'
                      ? offer.amountDueAud > 0
                        ? `$${offer.amountDueAud.toLocaleString()} additional payment`
                        : (offer.refundDueAud ?? 0) > 0
                          ? `$${(offer.refundDueAud ?? 0).toLocaleString()} refund`
                          : 'No payment adjustment'
                      : `$${offer.amountDueAud.toLocaleString()} due`}
                    {offer.kind === 'extension' ? ` · revised total $${(offer.originalTotalAud + offer.amountDueAud - (offer.refundDueAud ?? 0)).toLocaleString()}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Expires {new Date(offer.expiresAt).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
                  {offer.emailError ? <p className="mt-1 text-xs text-red-300">{offer.emailError}</p> : null}
                </div>
                {active ? (
                  <div className="flex gap-2">
                    <button onClick={() => action(offer._id, 'resend')} className="rounded-lg border border-luxury-gold/40 px-3 py-2 text-xs text-luxury-gold">Resend</button>
                    <button onClick={() => action(offer._id, 'revoke')} className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-300">Revoke</button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
        {offers.length === 0 ? <p className="rounded-xl border border-white/10 p-10 text-center text-gray-500">No offers yet.</p> : null}
      </div>
    </div>
  )
}
