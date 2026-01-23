'use client'

import { useEffect, useMemo, useState } from 'react'
import { blockedDates as defaultBlockedDates } from '@/config/property'

type AvailabilityState = {
  blockedDates: string[]
  isLoading: boolean
  lastUpdated: string | null
}

export function useAvailability({ enabled = true }: { enabled?: boolean } = {}) {
  const [state, setState] = useState<AvailabilityState>({
    blockedDates: defaultBlockedDates,
    isLoading: enabled,
    lastUpdated: null,
  })

  useEffect(() => {
    if (!enabled) return

    let isMounted = true

    const fetchBlockedDates = async () => {
      try {
        if (isMounted) {
          setState((s) => ({ ...s, isLoading: true }))
        }

        const response = await fetch('/api/calendar')
        if (!response.ok) {
          throw new Error(`Failed to fetch calendar data (${response.status})`)
        }
        const data = await response.json()

        if (isMounted) {
          setState({
            blockedDates: Array.isArray(data.blockedDates) ? data.blockedDates : [],
            lastUpdated: typeof data.lastUpdated === 'string' ? data.lastUpdated : null,
            isLoading: false,
          })
        }
      } catch (error) {
        console.warn('Failed to fetch calendar data, using default blocked dates:', error)
        if (isMounted) {
          setState({
            blockedDates: defaultBlockedDates,
            lastUpdated: null,
            isLoading: false,
          })
        }
      }
    }

    fetchBlockedDates()

    const interval = setInterval(fetchBlockedDates, 3600000) // refresh hourly
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [enabled])

  const blockedSet = useMemo(() => new Set(state.blockedDates), [state.blockedDates])

  return {
    ...state,
    blockedSet,
  }
}

