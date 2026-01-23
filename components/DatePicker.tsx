'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

const AU_TZ = 'Australia/Melbourne'

function dateStrToUtcDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

function utcDateToDateStr(date: Date) {
  return formatInTimeZone(date, AU_TZ, 'yyyy-MM-dd')
}

function todayStrAU() {
  return formatInTimeZone(new Date(), AU_TZ, 'yyyy-MM-dd')
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  blockedSet,
  minDateStr,
  minExclusive = false,
  error,
  disabled = false,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  blockedSet: Set<string>
  minDateStr: string
  minExclusive?: boolean
  error?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const nowAU = useMemo(() => toZonedTime(new Date(), AU_TZ), [])
  const initialMonth = value ? dateStrToUtcDate(value) : nowAU
  const [month, setMonth] = useState<Date>(initialMonth)

  useEffect(() => {
    if (!value) return
    // Keep calendar view aligned with selected value
    setMonth(dateStrToUtcDate(value))
  }, [value])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      const root = rootRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const minStr = minDateStr || todayStrAU()
  const todayStr = todayStrAU()

  const isDisabledDay = (d: Date) => {
    const dayStr = utcDateToDateStr(d)
    // Past (AU)
    if (dayStr < todayStr) return true
    // Min date
    if (minExclusive ? dayStr <= minStr : dayStr < minStr) return true
    // Blocked
    if (blockedSet.has(dayStr)) return true
    return false
  }

  const displayValue = value ? value : ''

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label} *
      </label>

      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between gap-3 ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || 'YYYY-MM-DD'}
        </span>
        <CalendarIcon size={18} className="text-gray-500" />
      </button>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {open && (
        <div
          role="dialog"
          aria-label={`${label} date picker`}
          className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              className="p-2 hover:bg-luxury-light rounded-lg transition-colors"
              aria-label="Previous month"
              onClick={() => setMonth((m) => subMonths(m, 1))}
            >
              ←
            </button>
            <div className="text-sm font-semibold text-gray-800">
              {format(toZonedTime(month, AU_TZ), 'MMMM yyyy')}
            </div>
            <button
              type="button"
              className="p-2 hover:bg-luxury-light rounded-lg transition-colors"
              aria-label="Next month"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-gray-600 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const dayStr = utcDateToDateStr(d)
              const inMonth = d >= monthStart && d <= monthEnd
              const disabledDay = isDisabledDay(d)
              const selected = value === dayStr

              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => {
                    onChange(dayStr)
                    setOpen(false)
                  }}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    !inMonth ? 'opacity-30' : ''
                  } ${
                    selected
                      ? 'bg-luxury-gold/25 ring-2 ring-luxury-gold text-luxury-dark'
                      : disabledDay
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-50 text-green-800 hover:bg-green-100'
                  }`}
                  aria-label={`Select ${dayStr}`}
                >
                  {formatInTimeZone(d, AU_TZ, 'd')}
                </button>
              )
            })}
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            Unavailable and past dates are disabled.
          </div>
        </div>
      )}
    </div>
  )
}

