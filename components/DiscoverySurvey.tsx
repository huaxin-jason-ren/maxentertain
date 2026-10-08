'use client'

import { useState } from 'react'
import { DISCOVERY_SOURCE_OPTIONS } from '@/lib/discovery'
import { getDiscoveryContext } from '@/lib/discovery-client'

export default function DiscoverySurvey({ endpoint }: { endpoint: string }) {
  const [source, setSource] = useState('')
  const [sourceOther, setSourceOther] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const save = async () => {
    if (!source) return
    setStatus('saving')
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discovery: {
          ...getDiscoveryContext(),
          source,
          sourceOther: source === 'other' ? sourceOther : undefined,
        },
      }),
    })
    setStatus(response.ok ? 'saved' : 'error')
  }

  if (status === 'saved') {
    return (
      <div className="mt-8 rounded-xl border border-green-500/20 bg-green-500/10 p-5 text-green-800 dark:text-green-300">
        Thank you — this helps us understand which channels genuinely bring guests to MAX Entertain.
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-5">
      <h2 className="font-serif text-xl font-bold text-luxury-dark dark:text-white">How did you find this website?</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Optional — one quick answer helps us focus on what works.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-white/10 dark:bg-[#141411] dark:text-white"
        >
          <option value="">Select an option</option>
          {DISCOVERY_SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={save}
          disabled={!source || status === 'saving' || (source === 'other' && !sourceOther.trim())}
          className="rounded-lg bg-luxury-gold px-5 py-2 font-semibold text-black disabled:opacity-40"
        >
          {status === 'saving' ? 'Saving…' : 'Submit'}
        </button>
      </div>
      {source === 'other' ? (
        <input
          value={sourceOther}
          onChange={(event) => setSourceOther(event.target.value)}
          placeholder="Please tell us where"
          className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-white/10 dark:bg-[#141411] dark:text-white"
        />
      ) : null}
      {status === 'error' ? <p className="mt-2 text-sm text-red-600 dark:text-red-300">Could not save your answer. Please try again.</p> : null}
    </div>
  )
}
