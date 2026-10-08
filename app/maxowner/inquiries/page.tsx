'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { discoverySourceLabel, type DiscoveryAttribution } from '@/lib/discovery'

type Status = 'new' | 'replied' | 'booked'

interface Inquiry {
  _id: string
  name: string
  email: string
  phone: string
  checkIn: string
  checkOut: string
  guests: string
  message: string
  receivedAt: string
  status: Status
  discovery?: DiscoveryAttribution
}

const STATUS_STYLE: Record<Status, string> = {
  new: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  replied: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  booked: 'bg-green-500/15 text-green-300 border-green-500/30',
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [offerFor, setOfferFor] = useState<string | null>(null)
  const [offerDraft, setOfferDraft] = useState({ amountDueAud: '', groupType: 'family', withPet: false, note: '', inclusions: 'Accommodation, cleaning, Victorian short-stay levy and payment processing' })
  const [offerMessage, setOfferMessage] = useState('')
  const [sendingOffer, setSendingOffer] = useState(false)
  const [livePrice, setLivePrice] = useState<Record<string, number>>({})

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const res = await fetch(`/api/maxowner/inquiries?page=${p}`)
    const data = await res.json()
    setInquiries(data.inquiries)
    setTotal(data.total)
    setPage(data.page)
    setPages(data.pages)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: Status) => {
    await fetch('/api/maxowner/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setInquiries((prev) => prev.map((i) => (i._id === id ? { ...i, status } : i)))
  }

  const sendOffer = async (inq: Inquiry) => {
    setSendingOffer(true)
    setOfferMessage('')
    const response = await fetch('/api/maxowner/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        kind: 'new_booking',
        inquiryId: inq._id,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        guests: Number(inq.guests),
        groupType: offerDraft.groupType,
        withPet: offerDraft.withPet,
        message: inq.message || 'Special offer requested',
        checkIn: inq.checkIn,
        checkOut: inq.checkOut,
        amountDueAud: Number(offerDraft.amountDueAud),
        note: offerDraft.note,
        inclusions: offerDraft.inclusions,
      }),
    })
    const data = await response.json().catch(() => ({}))
    setSendingOffer(false)
    setOfferMessage(response.ok ? 'Offer sent and dates reserved for 24 hours.' : data.error ?? 'Could not send offer.')
    if (response.ok) {
      setOfferFor(null)
      setInquiries((current) => current.map((item) => item._id === inq._id ? { ...item, status: 'replied' } : item))
    }
  }

  const loadLivePrice = async (inq: Inquiry) => {
    const response = await fetch(`/api/maxowner/offers?checkIn=${encodeURIComponent(inq.checkIn)}&checkOut=${encodeURIComponent(inq.checkOut)}`)
    const data = await response.json().catch(() => ({}))
    if (response.ok && typeof data.quote?.totalAud === 'number') {
      setLivePrice((current) => ({ ...current, [inq._id]: data.quote.totalAud }))
    } else {
      setOfferMessage(data.error ?? 'Could not calculate the current direct price.')
    }
  }

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-28 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-luxury-gold mb-1">Inquiries</h1>
          <p className="text-gray-400 text-sm">{total} total — from the direct inquiry form</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : inquiries.length === 0 ? (
        <div className="bg-[#1a1a18] rounded-xl border border-white/10 p-12 text-center">
          <p className="text-gray-500">No inquiries yet.</p>
          <p className="text-gray-600 text-sm mt-1">They appear here when guests submit the form on the site.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <div
              key={inq._id}
              className="bg-[#1a1a18] rounded-xl border border-white/10 overflow-hidden"
            >
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(expanded === inq._id ? null : inq._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-semibold text-white text-sm truncate">{inq.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[inq.status]}`}>
                      {inq.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    <span className="truncate max-w-full">{inq.email}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>{inq.checkIn} → {inq.checkOut}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>{inq.guests} guests</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {inq.receivedAt ? format(new Date(inq.receivedAt), 'd MMM yyyy, h:mm a') : '—'}
                  </p>
                </div>
                <span className="text-gray-600 text-sm">{expanded === inq._id ? '▲' : '▼'}</span>
              </div>

              {expanded === inq._id && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-4 mt-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Email</p>
                      <a href={`mailto:${inq.email}`} className="text-luxury-gold hover:underline">{inq.email}</a>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Phone</p>
                      <span className="text-gray-300">{inq.phone || '—'}</span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Check-in</p>
                      <span className="text-gray-300">{inq.checkIn}</span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Check-out</p>
                      <span className="text-gray-300">{inq.checkOut}</span>
                    </div>
                  </div>

                  {inq.message && (
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs mb-1">Message</p>
                      <p className="text-gray-300 text-sm leading-relaxed bg-black/20 rounded-lg px-4 py-3">{inq.message}</p>
                    </div>
                  )}
                  {inq.discovery ? (
                    <div className="mb-4 rounded-lg bg-black/20 px-4 py-3 text-sm text-gray-300">
                      <span className="text-gray-500">Found us via: </span>
                      {discoverySourceLabel(inq.discovery.source)}
                      {inq.discovery.sourceOther ? ` — ${inq.discovery.sourceOther}` : ''}
                      {!inq.discovery.source && inq.discovery.utmSource ? ` — UTM: ${inq.discovery.utmSource}` : ''}
                      {!inq.discovery.source && !inq.discovery.utmSource && inq.discovery.referrer ? ` — ${inq.discovery.referrer}` : ''}
                    </div>
                  ) : null}

                  {offerFor === inq._id ? (
                    <div className="mb-4 grid gap-3 rounded-lg border border-luxury-gold/20 bg-luxury-gold/5 p-4 md:grid-cols-2">
                      <label className="text-xs text-gray-400">
                        All-inclusive offer total (AUD)
                        <input type="number" min="1" required value={offerDraft.amountDueAud} onChange={(event) => setOfferDraft((draft) => ({ ...draft, amountDueAud: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="text-xs text-gray-400">
                        Group type
                        <select value={offerDraft.groupType} onChange={(event) => setOfferDraft((draft) => ({ ...draft, groupType: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
                          <option value="family">Family</option><option value="corporate">Corporate</option><option value="golf">Golf</option><option value="milestone">Milestone</option><option value="other">Other</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input type="checkbox" checked={offerDraft.withPet} onChange={(event) => setOfferDraft((draft) => ({ ...draft, withPet: event.target.checked }))} />
                        Pet included (total includes the $100 fee)
                      </label>
                      <label className="text-xs text-gray-400 md:col-span-2">
                        Inclusions
                        <textarea rows={2} value={offerDraft.inclusions} onChange={(event) => setOfferDraft((draft) => ({ ...draft, inclusions: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      </label>
                      <label className="text-xs text-gray-400 md:col-span-2">
                        Note from Jason
                        <textarea rows={2} value={offerDraft.note} onChange={(event) => setOfferDraft((draft) => ({ ...draft, note: event.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      </label>
                      <div className="flex gap-2 md:col-span-2">
                        <button type="button" onClick={() => loadLivePrice(inq)} className="rounded-lg border border-white/20 px-4 py-2 text-xs text-gray-200">Check live price</button>
                        {typeof livePrice[inq._id] === 'number' ? <span className="self-center text-xs text-gray-300">Current direct price: <strong className="text-white">${livePrice[inq._id].toLocaleString()}</strong>{offerDraft.withPet ? ' + $100 pet fee' : ''}</span> : null}
                        <button disabled={sendingOffer || !offerDraft.amountDueAud} onClick={() => sendOffer(inq)} className="rounded-lg bg-luxury-gold px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">{sendingOffer ? 'Sending…' : 'Reserve dates and send'}</button>
                        <button onClick={() => setOfferFor(null)} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-400">Cancel</button>
                      </div>
                    </div>
                  ) : null}
                  {offerMessage && expanded === inq._id ? <p className="mb-3 text-sm text-luxury-gold">{offerMessage}</p> : null}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs mr-1">Status:</span>
                    {(['new', 'replied', 'booked'] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(inq._id, s)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          inq.status === s
                            ? STATUS_STYLE[s]
                            : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setOfferFor(offerFor === inq._id ? null : inq._id)
                        setOfferMessage('')
                      }}
                      className="ml-auto rounded-lg border border-luxury-gold/40 px-3 py-1.5 text-xs font-semibold text-luxury-gold"
                    >
                      Send special offer
                    </button>
                    <a
                      href={`mailto:${inq.email}?subject=Your enquiry for MAX Entertain Beachside Retreat`}
                      className="text-xs text-luxury-gold hover:underline"
                    >
                      Reply via email →
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => load(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm text-gray-400 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/5 transition-colors"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page === pages}
            className="px-4 py-2 text-sm text-gray-400 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/5 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
