import { NextRequest, NextResponse } from 'next/server'
import { getBookingById, toPublicBookingSummary } from '@/lib/bookings'
import { getStripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'
import { normaliseDiscovery } from '@/lib/discovery'
import type { BookingRecord } from '@/types/booking'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 401 })
  }

  const booking = await getBookingById(params.id)
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const storedSessionId = booking.payment.stripeSessionId || booking.stripeSessionId
  if (!storedSessionId || storedSessionId !== sessionId) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.metadata?.bookingId && session.metadata.bookingId !== booking._id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Never include cancellation token on this endpoint.
  return NextResponse.json(toPublicBookingSummary(booking, false))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id is required' }, { status: 401 })

  const booking = await getBookingById(params.id)
  const storedSessionId = booking?.payment.stripeSessionId || booking?.stripeSessionId
  if (!booking || !storedSessionId || storedSessionId !== sessionId) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.metadata?.bookingId !== booking._id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const body = await req.json()
  const discovery = normaliseDiscovery(body.discovery)
  if (!discovery?.source) {
    return NextResponse.json({ error: 'A valid discovery source is required' }, { status: 400 })
  }
  const merged = { ...booking.discovery, ...discovery }
  await (await getDb()).collection<BookingRecord>('bookings').updateOne(
    { _id: booking._id },
    { $set: { discovery: merged, updatedAt: new Date() } }
  )
  return NextResponse.json({ ok: true })
}
