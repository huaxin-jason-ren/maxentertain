import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { normaliseDiscovery } from '@/lib/discovery'
import { getOfferByToken } from '@/lib/offers'
import { getBookingById } from '@/lib/bookings'
import type { BookingRecord } from '@/types/booking'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const offer = await getOfferByToken(params.token)
  if (!offer?.bookingId || !['paid', 'completed'].includes(offer.status)) {
    return NextResponse.json({ error: 'Confirmed booking not found' }, { status: 404 })
  }
  const booking = await getBookingById(offer.bookingId)
  if (!booking) return NextResponse.json({ error: 'Confirmed booking not found' }, { status: 404 })

  const body = await req.json()
  const discovery = normaliseDiscovery(body.discovery)
  if (!discovery?.source) {
    return NextResponse.json({ error: 'A valid discovery source is required' }, { status: 400 })
  }
  await (await getDb()).collection<BookingRecord>('bookings').updateOne(
    { _id: booking._id },
    { $set: { discovery: { ...booking.discovery, ...discovery }, updatedAt: new Date() } }
  )
  return NextResponse.json({ ok: true })
}
