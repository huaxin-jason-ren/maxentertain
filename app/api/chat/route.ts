import { NextResponse, type NextRequest } from 'next/server'
import { propertyConfig } from '@/config/property'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ClientMessage = {
  role: 'user' | 'assistant'
  content: string
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
const MAX_MESSAGES = 20
const MAX_CHARS_PER_MESSAGE = 2000
const MAX_TOTAL_CHARS = 12000

// Minimal in-memory rate limiter (best-effort).
// Note: serverless platforms may not guarantee persistence across instances.
type Bucket = { count: number; resetAtMs: number }
const RL_WINDOW_MS = 60_000
const RL_MAX = 20

function getRateLimitStore(): Map<string, Bucket> {
  const g = globalThis as unknown as { __guestChatRL?: Map<string, Bucket> }
  if (!g.__guestChatRL) g.__guestChatRL = new Map()
  return g.__guestChatRL
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

function rateLimitOrThrow(key: string) {
  const now = Date.now()
  const store = getRateLimitStore()
  const hit = store.get(key)

  if (!hit || hit.resetAtMs <= now) {
    store.set(key, { count: 1, resetAtMs: now + RL_WINDOW_MS })
    return
  }

  hit.count += 1
  store.set(key, hit)

  if (hit.count > RL_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((hit.resetAtMs - now) / 1000))
    const err = new Error('rate_limited')
    ;(err as any).status = 429
    ;(err as any).retryAfterSec = retryAfterSec
    throw err
  }
}

function compactPropertyContext(): string {
  const cfg = propertyConfig

  const amenities = cfg.amenities?.slice(0, 80).join(', ')
  const houseRules = cfg.policies?.houseRules?.slice(0, 40).map((r) => `- ${r}`).join('\n')

  const photoSections = (cfg.photoSections ?? []).map((s) => {
    const desc = s.description ? ` — ${s.description}` : ''
    return `- ${s.title}${desc}`
  })

  const nearby = cfg.localArea?.attractions?.slice(0, 30).map((a) => {
    const drive =
      a.drive?.durationMin != null && a.drive?.distanceKm != null
        ? `${a.drive.durationMin} min drive (${a.drive.distanceKm} km)`
        : a.distance
          ? a.distance
          : ''
    return `- ${a.name}${drive ? ` — ${drive}` : ''}`
  })

  return [
    `Property name: ${cfg.name}`,
    `Location: ${cfg.location}`,
    `Capacity: ${cfg.bedrooms} bedrooms, ${cfg.bathrooms} bathrooms, up to ${cfg.maxGuests} guests`,
    `Summary: ${cfg.description}`,
    '',
    `Check-in: ${cfg.policies.checkIn}`,
    `Check-out: ${cfg.policies.checkOut}`,
    `Cancellation: ${cfg.policies.cancellation}`,
    '',
    `House rules:\n${houseRules || '- (none provided)'}`,
    '',
    `Amenities: ${amenities || '(none provided)'}`,
    '',
    `Photo sections:\n${photoSections.length ? photoSections.join('\n') : '- (none)'}`,
    '',
    `Nearby:\n${nearby?.length ? nearby.join('\n') : '- (none)'}`,
    '',
    `Contact email: ${cfg.contact.email}`,
  ].join('\n')
}

function systemPrompt(): string {
  return [
    'You are the guest FAQ assistant for a vacation rental property website.',
    'You MUST answer using ONLY the information provided in the CONTEXT.',
    'If the question is not answered by the context, say you do not have that information and suggest contacting the host via /inquiry.',
    'Do not invent policies, prices, availability, discounts, or addresses beyond what is provided.',
    'Keep answers concise, friendly, and practical. Use bullet points when helpful.',
    'If the user asks for something unrelated to the property, politely refuse and redirect back to property questions.',
    '',
    'CONTEXT:',
    compactPropertyContext(),
  ].join('\n')
}

function validateMessages(input: unknown): ClientMessage[] {
  if (!Array.isArray(input)) throw new Error('Invalid messages')
  const msgs = input
    .slice(-MAX_MESSAGES)
    .map((m: any) => ({
      role: m?.role,
      content: typeof m?.content === 'string' ? m.content : '',
    }))
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0)

  let total = 0
  for (const m of msgs) {
    if (m.content.length > MAX_CHARS_PER_MESSAGE) {
      m.content = m.content.slice(0, MAX_CHARS_PER_MESSAGE)
    }
    total += m.content.length
  }
  if (total > MAX_TOTAL_CHARS) {
    // Keep the most recent messages while staying under the cap.
    const trimmed: ClientMessage[] = []
    let running = 0
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i]!
      if (running + m.content.length > MAX_TOTAL_CHARS) continue
      trimmed.unshift(m)
      running += m.content.length
    }
    return trimmed
  }

  return msgs
}

export async function POST(req: NextRequest) {
  try {
    rateLimitOrThrow(getClientIp(req))

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server not configured (missing ANTHROPIC_API_KEY)' },
        { status: 500 },
      )
    }

    const body = await req.json().catch(() => null)
    const messages = validateMessages(body?.messages)
    if (messages.length === 0) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 700,
        temperature: 0.2,
        system: systemPrompt(),
        messages: messages.map((m) => ({
          role: m.role,
          content: [{ type: 'text', text: m.content }],
        })),
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { error: 'Anthropic request failed', status: res.status, detail: text.slice(0, 500) },
        { status: 502 },
      )
    }

    const data: any = await res.json()
    const parts: string[] = Array.isArray(data?.content)
      ? data.content.filter((c: any) => c?.type === 'text' && typeof c?.text === 'string').map((c: any) => c.text)
      : []

    const reply = parts.join('').trim()
    return NextResponse.json({ reply })
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : 500
    if (status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'retry-after': String(err.retryAfterSec || 30) } },
      )
    }
    return NextResponse.json({ error: 'Chat failed' }, { status })
  }
}

