const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

type BlockedNights = { has(date: string): boolean }

/**
 * Nights a stay occupies: check-in inclusive, check-out exclusive.
 * The checkout date is a morning departure, so it is not a night.
 * Returns an empty list when the dates are missing or out of order.
 */
export function nightDates(checkIn: string, checkOut: string): string[] {
  if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut) || checkOut <= checkIn) return []

  const [startYear, startMonth, startDay] = checkIn.split('-').map(Number)
  const [endYear, endMonth, endDay] = checkOut.split('-').map(Number)
  const end = Date.UTC(endYear, endMonth - 1, endDay)
  const dates: string[] = []

  for (let cursor = Date.UTC(startYear, startMonth - 1, startDay); cursor < end; cursor += 86_400_000) {
    const date = new Date(cursor)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
  }

  return dates
}

/** True when any occupied night of the stay is already booked. */
export function nightsIncludeBlocked(checkIn: string, checkOut: string, blocked: BlockedNights): boolean {
  return nightDates(checkIn, checkOut).some((date) => blocked.has(date))
}

/**
 * A booked night can still be a checkout. The guest leaves that morning and
 * the next guest arrives that afternoon, so every night before that morning
 * must be free. Later days inside the same booking stay blocked.
 */
export function isTurnoverCheckout(checkIn: string, day: string, blocked: BlockedNights): boolean {
  if (!DATE_RE.test(checkIn) || !DATE_RE.test(day) || day <= checkIn) return false
  if (!blocked.has(day)) return false
  return !nightsIncludeBlocked(checkIn, day, blocked)
}
