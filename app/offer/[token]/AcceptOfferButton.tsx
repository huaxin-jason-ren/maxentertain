'use client'

import { useState } from 'react'

export default function AcceptOfferButton({
  token,
  disabled,
  amountDueAud,
  refundDueAud,
}: {
  token: string
  disabled: boolean
  amountDueAud: number
  refundDueAud: number
}) {
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const checkout = async () => {
    setBusy(true)
    setError('')
    const response = await fetch(`/api/offers/${encodeURIComponent(token)}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rulesAccepted: accepted }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok && data.checkoutUrl) {
      window.location.assign(data.checkoutUrl)
      return
    }
    if (response.ok && data.redirectUrl) {
      window.location.assign(data.redirectUrl)
      return
    }
    setBusy(false)
    setError(data.error ?? 'Checkout could not be started.')
  }

  return (
    <div>
      <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 dark:border-white/10 dark:text-gray-300">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" />
        <span>I accept the house rules, cancellation policy, dates and price shown in this offer.</span>
      </label>
      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={disabled || !accepted || busy}
        onClick={checkout}
        className="mt-4 w-full rounded-lg bg-luxury-gold px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? amountDueAud > 0 ? 'Opening secure payment…' : 'Applying amendment…'
          : amountDueAud > 0
            ? `Accept and pay $${amountDueAud.toLocaleString()}`
            : refundDueAud > 0
              ? `Accept and receive $${refundDueAud.toLocaleString()} refund`
              : 'Accept amendment'}
      </button>
    </div>
  )
}
