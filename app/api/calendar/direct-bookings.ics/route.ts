import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import type { BookingRecord, BookingStatus, SpecialOfferRecord } from '@/types/booking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function escapeICal(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function formatICalDate(date: string) {
  return date.replace(/-/g, '')
}

function formatICalDateTime(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function tokensMatch(provided: string | null, secret: string): boolean {
  if (!provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  const secret = process.env.ICAL_EXPORT_SECRET
  const token = new URL(req.url).searchParams.get('token')
  if (!secret || !tokensMatch(token, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const nowDate = new Date()
  const [bookings, offers] = await Promise.all([
    db
      .collection<BookingRecord>('bookings')
      .find(
        {
          $or: [
            { status: 'confirmed' },
            { status: 'pending_payment', expiresAt: { $gt: nowDate } },
          ],
        },
        { projection: { _id: 1, checkIn: 1, checkOut: 1, status: 1, updatedAt: 1, createdAt: 1 } }
      )
      .sort({ checkIn: 1 })
      .toArray(),
    db
      .collection<SpecialOfferRecord>('offers')
      .find(
        {
          status: { $in: ['sent', 'accepted', 'checkout_pending'] },
          expiresAt: { $gt: nowDate },
        },
        { projection: { _id: 1, checkIn: 1, checkOut: 1, updatedAt: 1, createdAt: 1 } }
      )
      .sort({ checkIn: 1 })
      .toArray(),
  ])

  const now = formatICalDateTime()
  const events = bookings.flatMap((booking) => {
    const status = booking.status as BookingStatus
    const summary = status === 'pending_payment' ? 'Pending direct booking hold' : 'Direct booking blocked'
    return [
      'BEGIN:VEVENT',
      `UID:maxentertain-direct-${booking._id}@maxentertain.com`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatICalDate(booking.checkIn)}`,
      `DTEND;VALUE=DATE:${formatICalDate(booking.checkOut)}`,
      `SUMMARY:${escapeICal(summary)} - MAX Entertain`,
      `STATUS:${status === 'pending_payment' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'TRANSP:OPAQUE',
      'DESCRIPTION:Direct booking blocked',
      `LAST-MODIFIED:${formatICalDateTime(booking.updatedAt ?? booking.createdAt ?? new Date())}`,
      'END:VEVENT',
    ]
  })
  const offerEvents = offers.flatMap((offer) => [
    'BEGIN:VEVENT',
    `UID:maxentertain-offer-${offer._id}@maxentertain.com`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${formatICalDate(offer.checkIn)}`,
    `DTEND;VALUE=DATE:${formatICalDate(offer.checkOut)}`,
    `SUMMARY:${escapeICal('Special offer hold')} - MAX Entertain`,
    'STATUS:TENTATIVE',
    'TRANSP:OPAQUE',
    'DESCRIPTION:24-hour special offer hold',
    `LAST-MODIFIED:${formatICalDateTime(offer.updatedAt ?? offer.createdAt ?? new Date())}`,
    'END:VEVENT',
  ])

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MAX Entertain//Direct Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MAX Entertain Direct Bookings',
    ...events,
    ...offerEvents,
    'END:VCALENDAR',
    '',
  ].join('\r\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
