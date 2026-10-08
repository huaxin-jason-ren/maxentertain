import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { sendInquiryReceivedEmails } from '@/lib/email'
import { getClientIp, rateLimitDurable } from '@/lib/rateLimit'
import { normaliseDiscovery } from '@/lib/discovery'

const MAX_LENGTHS = {
  name: 200,
  email: 320,
  phone: 50,
  guests: 20,
  message: 5000,
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function cleanField(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export async function POST(req: NextRequest) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ ok: true }) // silently skip if not configured
  }

  if (!(await rateLimitDurable('inquiries', getClientIp(req), 5, 60_000))) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()

    const name = cleanField(body.name, MAX_LENGTHS.name)
    const email = cleanField(body.email, MAX_LENGTHS.email)
    const phone = cleanField(body.phone, MAX_LENGTHS.phone)
    const guests = cleanField(body.guests, MAX_LENGTHS.guests)
    const message = cleanField(body.message, MAX_LENGTHS.message)
    const checkIn = cleanField(body.checkIn, 10)
    const checkOut = cleanField(body.checkOut, 10)
    const discovery = normaliseDiscovery(body.discovery)

    if (!name || !email || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
    }
    if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
      return NextResponse.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 })
    }

    const db = await getDb()
    await db.collection('inquiries').insertOne({
      name,
      email,
      phone,
      checkIn,
      checkOut,
      guests,
      message,
      receivedAt: new Date(),
      status: 'new',
      discovery,
    })

    await sendInquiryReceivedEmails({
      name,
      email,
      phone,
      checkIn,
      checkOut,
      guests,
      message,
      discovery,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Inquiry submission failed:', error)
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again or email us directly.' },
      { status: 500 }
    )
  }
}
