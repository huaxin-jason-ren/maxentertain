import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { requireOwner } from '@/lib/authServer'
import { getDb } from '@/lib/mongodb'
import { getBookingById, getBookingQuote, getNightDates, normaliseGuest, DatesUnavailableError } from '@/lib/bookings'
import {
  createSpecialOffer,
  getAmendmentPreview,
  markOfferEmailResult,
  revokeOffer,
  rotateOfferToken,
} from '@/lib/offers'
import { sendSpecialOfferEmail } from '@/lib/email'
import type { SpecialOfferRecord } from '@/types/booking'

export const runtime = 'nodejs'

async function assertDatesAvailable(req: NextRequest, dates: string[]) {
  const response = await fetch(new URL('/api/calendar', req.nextUrl.origin), { cache: 'no-store' })
  if (!response.ok) throw new Error('Availability could not be verified')
  const calendar = await response.json()
  if (calendar.calendarHealth?.degraded) throw new Error('Availability feeds are temporarily unavailable')
  const blocked = new Set<string>(calendar.blockedDates ?? [])
  if (dates.some((date) => blocked.has(date))) throw new DatesUnavailableError()
}

export async function GET(req: NextRequest) {
  const denied = await requireOwner(req)
  if (denied) return denied
  const previewCheckIn = req.nextUrl.searchParams.get('checkIn')
  const previewCheckOut = req.nextUrl.searchParams.get('checkOut')
  const previewBookingId = req.nextUrl.searchParams.get('bookingId')
  if (previewBookingId && previewCheckOut) {
    try {
      const booking = await getBookingById(previewBookingId)
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      const preview = await getAmendmentPreview(booking, previewCheckOut)
      return NextResponse.json({ preview })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Amendment unavailable' }, { status: 400 })
    }
  }
  if (previewCheckIn && previewCheckOut) {
    try {
      const quote = await getBookingQuote(previewCheckIn, previewCheckOut)
      return NextResponse.json({ quote })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Quote unavailable' }, { status: 400 })
    }
  }
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1))
  const limit = 25
  const db = await getDb()
  const [offers, total] = await Promise.all([
    db.collection<SpecialOfferRecord>('offers')
      .find({}, { projection: { tokenHash: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection('offers').countDocuments(),
  ])
  return NextResponse.json({ offers, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
}

export async function POST(req: NextRequest) {
  const denied = await requireOwner(req)
  if (denied) return denied

  try {
    const body = await req.json()
    const action = String(body.action ?? 'create')

    if (action === 'revoke') {
      const offer = await revokeOffer(String(body.offerId ?? ''))
      if (!offer) return NextResponse.json({ error: 'Active offer not found' }, { status: 404 })
      return NextResponse.json({ ok: true, offer })
    }

    if (action === 'resend') {
      const { offer, token } = await rotateOfferToken(String(body.offerId ?? ''))
      try {
        await sendSpecialOfferEmail(offer, token)
        await markOfferEmailResult(offer._id)
      } catch (error) {
        await markOfferEmailResult(offer._id, error)
        throw error
      }
      return NextResponse.json({ ok: true })
    }

    const kind = body.kind === 'extension' ? 'extension' : 'new_booking'
    const booking = kind === 'extension' ? await getBookingById(String(body.bookingId ?? '')) : null
    if (kind === 'extension' && (!booking || booking.status !== 'confirmed')) {
      return NextResponse.json({ error: 'Confirmed booking not found' }, { status: 404 })
    }

    const checkIn = booking?.checkIn ?? String(body.checkIn ?? '')
    const checkOut = String(body.checkOut ?? '')
    const datesToHold = booking
      ? checkOut > booking.checkOut ? getNightDates(booking.checkOut, checkOut) : []
      : getNightDates(checkIn, checkOut)
    if (datesToHold.length > 0) await assertDatesAvailable(req, datesToHold)

    const guest = booking?.guest ?? normaliseGuest({
      ...body,
      phone: String(body.phone || 'Not supplied'),
      guests: Number(body.guests) > 0 ? Number(body.guests) : 1,
      message: String(body.message || 'Owner-created special offer'),
    })
    const { offer, token } = await createSpecialOffer({
      kind,
      guest,
      inquiryId: body.inquiryId ? String(body.inquiryId) : undefined,
      bookingId: booking?._id,
      checkIn,
      checkOut,
      amountDueAud: kind === 'new_booking' ? Number(body.amountDueAud) : undefined,
      revisedTotalAud:
        kind === 'extension' && body.revisedTotalAud !== undefined
          ? Number(body.revisedTotalAud)
          : undefined,
      note: String(body.note ?? ''),
      inclusions: String(body.inclusions ?? ''),
    })

    try {
      await sendSpecialOfferEmail(offer, token)
      await markOfferEmailResult(offer._id)
    } catch (error) {
      await revokeOffer(offer._id)
      await markOfferEmailResult(offer._id, error)
      throw error
    }

    if (body.inquiryId) {
      try {
        const inquiryId = new ObjectId(String(body.inquiryId))
        await (await getDb()).collection('inquiries').updateOne(
          { _id: inquiryId },
          { $set: { status: 'replied', lastOfferId: offer._id, updatedAt: new Date() } }
        )
      } catch {
        // The offer is still valid if an old/malformed inquiry id cannot be linked.
      }
    }

    return NextResponse.json({ ok: true, offer: { ...offer, tokenHash: undefined } })
  } catch (error) {
    if (error instanceof DatesUnavailableError) {
      return NextResponse.json({ error: 'DATES_UNAVAILABLE' }, { status: 409 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Offer action failed' },
      { status: 400 }
    )
  }
}
