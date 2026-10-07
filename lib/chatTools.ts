import { getBookingQuote, BookingValidationError } from '@/lib/bookings'
import { groupNightsByTier, TIER_LABELS } from '@/lib/pricing'
import { getSiteUrl } from '@/lib/site'
import { nightDates } from '@/lib/stay-nights'

/**
 * Tool layer for the MAX chat agent.
 *
 * - Gemini function declarations describe the tools the model may call.
 * - The executors run server-side, reusing the same pricing/availability
 *   logic that powers the booking funnel, so the bot can never quote a price
 *   or availability that disagrees with the real /book flow.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value)
}

async function fetchBlockedDates(): Promise<Set<string>> {
  try {
    const res = await fetch(`${getSiteUrl()}/api/calendar`, {
      // Calendar route caches for an hour itself; keep it fresh-ish here.
      next: { revalidate: 300 },
    })
    if (!res.ok) return new Set()
    const data = (await res.json()) as { blockedDates?: string[] }
    return new Set(data.blockedDates ?? [])
  } catch {
    return new Set()
  }
}

// ─────────────────────────── Gemini function declarations ───────────────────────────

// NOTE: Gemini's Schema.type is an enum and must be UPPERCASE (OBJECT, STRING, …).
// Lowercase values cause the tool declarations to be ignored, so the model can
// describe tools but never actually call them.
export const chatToolDeclarations = [
  {
    name: 'check_availability',
    description:
      "Check whether the property is available for a specific date range. Call this whenever the guest asks if dates are free, or mentions/implies specific dates. Dates must be resolved to absolute YYYY-MM-DD (today's date is provided in the system context).",
    input_schema: {
      type: 'object',
      properties: {
        checkIn: { type: 'string', description: 'Check-in date, YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'Check-out date, YYYY-MM-DD' },
      },
      required: ['checkIn', 'checkOut'],
    },
  },
  {
    name: 'get_price_quote',
    description:
      'Get the exact total price for a date range, including the per-night breakdown and the estimated saving vs booking through an OTA. Call this when the guest asks about price/cost, or after confirming availability when guiding them toward booking.',
    input_schema: {
      type: 'object',
      properties: {
        checkIn: { type: 'string', description: 'Check-in date, YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'Check-out date, YYYY-MM-DD' },
      },
      required: ['checkIn', 'checkOut'],
    },
  },
  {
    name: 'capture_booking_lead',
    description:
      'Call this when the guest is ready to book, asks to be contacted, or wants a human to follow up about a booking. After calling, ask the guest for their name and email so the owner can follow up.',
    input_schema: {
      type: 'object',
      properties: {
        checkIn: { type: 'string', description: 'Check-in date if known, YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'Check-out date if known, YYYY-MM-DD' },
      },
      required: [],
    },
  },
  {
    name: 'escalate_to_owner',
    description:
      "Call this when the guest asks a property-specific question that you cannot answer from the provided context (do NOT guess). After calling, apologise briefly and offer to have the owner email them back, then ask for their email.",
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The exact question the guest asked that you could not answer.' },
      },
      required: ['question'],
    },
  },
] as const

// ─────────────────────────── Executors ───────────────────────────

export type ToolResult = {
  /** Plain object returned to the model as the functionResponse payload. */
  response: Record<string, unknown>
  /** Side-effects for the server to act on (UI actions, conversation flags). */
  intent?: 'asked_availability' | 'asked_price' | 'booking_intent'
  escalateQuestion?: string
  collectContact?: { reason: 'booking' | 'unanswered'; checkIn?: string; checkOut?: string; question?: string }
  bookCta?: { checkIn: string; checkOut: string; totalAud: number }
}

async function runCheckAvailability(args: any): Promise<ToolResult> {
  const { checkIn, checkOut } = args ?? {}
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) {
    return { response: { ok: false, error: 'Please provide a valid check-in and check-out date.' } }
  }
  const blocked = await fetchBlockedDates()
  const nights = nightDates(checkIn, checkOut)
  const blockedNights = nights.filter((d) => blocked.has(d))
  return {
    intent: 'asked_availability',
    response: {
      ok: true,
      checkIn,
      checkOut,
      available: blockedNights.length === 0,
      blockedNights,
      nights: nights.length,
    },
  }
}

async function runGetPriceQuote(args: any): Promise<ToolResult> {
  const { checkIn, checkOut } = args ?? {}
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) {
    return { response: { ok: false, error: 'Please provide a valid check-in and check-out date.' } }
  }
  try {
    const quote = await getBookingQuote(checkIn, checkOut)
    const breakdown = groupNightsByTier(quote.nights).map((g) => ({
      tier: TIER_LABELS[g.tier],
      nights: g.count,
      subtotalAud: g.subtotal,
    }))
    // OTA platforms typically add ~12% in fees; surface an honest "save direct" figure.
    const otaEstimate = Math.round(quote.totalAud * 1.12)
    return {
      intent: 'asked_price',
      bookCta: { checkIn, checkOut, totalAud: quote.totalAud },
      response: {
        ok: true,
        checkIn,
        checkOut,
        nights: quote.totalNights,
        totalAud: quote.totalAud,
        perNightAvgAud: Math.round(quote.totalAud / quote.totalNights),
        breakdown,
        otaEstimateAud: otaEstimate,
        directSavingAud: otaEstimate - quote.totalAud,
      },
    }
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return { response: { ok: false, error: err.message } }
    }
    return { response: { ok: false, error: 'Pricing is unavailable for those dates right now.' } }
  }
}

function runCaptureBookingLead(args: any): ToolResult {
  const checkIn = isIsoDate(args?.checkIn) ? args.checkIn : undefined
  const checkOut = isIsoDate(args?.checkOut) ? args.checkOut : undefined
  return {
    intent: 'booking_intent',
    collectContact: { reason: 'booking', checkIn, checkOut },
    response: {
      ok: true,
      next: 'Ask the guest for their name and email so the owner can follow up to finalise the booking.',
    },
  }
}

function runEscalateToOwner(args: any): ToolResult {
  const question = typeof args?.question === 'string' ? args.question.slice(0, 500) : ''
  return {
    escalateQuestion: question,
    collectContact: { reason: 'unanswered', question },
    response: {
      ok: true,
      next: 'Apologise briefly, tell the guest the owner (Jason) will email them back, and ask for their email address.',
    },
  }
}

export async function executeChatTool(name: string, args: any): Promise<ToolResult> {
  switch (name) {
    case 'check_availability':
      return runCheckAvailability(args)
    case 'get_price_quote':
      return runGetPriceQuote(args)
    case 'capture_booking_lead':
      return runCaptureBookingLead(args)
    case 'escalate_to_owner':
      return runEscalateToOwner(args)
    default:
      return { response: { ok: false, error: `Unknown tool: ${name}` } }
  }
}
