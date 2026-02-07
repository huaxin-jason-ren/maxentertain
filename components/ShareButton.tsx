'use client'

import { useMemo, useState } from 'react'
import { Share2, Check } from 'lucide-react'

type Props = {
  className?: string
  iconOnly?: boolean
  label?: string
}

export default function ShareButton({ className, iconOnly = false, label = 'Share' }: Props) {
  const [copied, setCopied] = useState(false)

  const canShare = useMemo(() => {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  }, [])

  async function handleShare() {
    if (typeof window === 'undefined') return

    const url = window.location.href
    const title = document?.title || 'Share'

    try {
      if (canShare) {
        await navigator.share({ title, url })
        return
      }

      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // User cancelled share OR clipboard blocked — silently ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className}
      aria-label={iconOnly ? label : undefined}
    >
      {copied ? (
        <>
          <Check size={16} />
          {!iconOnly && <span>Copied</span>}
        </>
      ) : (
        <>
          <Share2 size={16} />
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  )
}

