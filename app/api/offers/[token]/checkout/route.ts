import { NextRequest, NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/site'
import { getStripe } from '@/lib/stripe'
import {
  acceptOffer,
  attachOfferCheckout,
  completeNonPaymentAmendment,
  getOfferByToken,
  OFFER_CHECKOUT_MINUTES,
} from '@/lib/offers'
import { getClientIp, rateLimit } from '@/lib/rateLimit'
import { sendBookingAmendedEmail, sendOwnerAmendmentAlert } from '@/lib/email'
import type { SpecialOfferRecord } from '@/types/booking'

export const runtime = 'nodejs'

async function finishNoPaymentAmendment(offer: SpecialOfferRecord, token: string) {
  const result = await completeNonPaymentAmendment(offer._id)
  if (!result.booking) throw new Error('Booking amendment could not be completed')
  await Promise.all([
    sendBookingAmendedEmail(result.booking, {
      previousTotalAud: offer.originalTotalAud,
      refundAud: offer.refundDueAud ?? 0,
    }),
    sendOwnerAmendmentAlert(result.booking, {
      previousTotalAud: offer.originalTotalAud,
      refundAud: offer.refundDueAud ?? 0,
    }),
  ])
  return NextResponse.json({
    completed: true,
    redirectUrl: `${getSiteUrl()}/offer/${encodeURIComponent(token)}?completed=1`,
  })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const ip = getClientIp(req)
    if (!rateLimit('offer-checkout', ip, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many attempts. Please wait and try again.' }, { status: 429 })
    }
    const body = await req.json()
    if (body.rulesAccepted !== true) {
      return NextResponse.json({ error: 'House rules and cancellation policy must be accepted' }, { status: 400 })
    }

    const current = await getOfferByToken(params.token)
    if (!current) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    if (current.kind === 'extension' && current.amountDueAud === 0 && current.status === 'checkout_pending') {
      return finishNoPaymentAmendment(current, params.token)
    }

    if (
      current.status === 'checkout_pending' &&
      current.stripeSessionId &&
      current.checkoutExpiresAt &&
      current.checkoutExpiresAt > new Date()
    ) {
      const existing = await getStripe().checkout.sessions.retrieve(current.stripeSessionId)
      if (existing.url) return NextResponse.json({ checkoutUrl: existing.url })
    }

    const agreementIp = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || ip
    const offer = await acceptOffer(params.token, agreementIp)
    if (offer.kind === 'extension' && offer.amountDueAud === 0) {
      return finishNoPaymentAmendment(offer, params.token)
    }
    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    const checkoutExpiresAt = new Date(Date.now() + OFFER_CHECKOUT_MINUTES * 60 * 1000)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: offer.guest.email,
      customer_creation: 'always',
      expires_at: Math.floor(checkoutExpiresAt.getTime() / 1000),
      invoice_creation: { enabled: true },
      metadata: {
        offerId: offer._id,
        offerKind: offer.kind,
        propertyId: offer.propertyId,
        ...(offer.bookingId ? { bookingId: offer.bookingId } : {}),
      },
      payment_intent_data: {
        setup_future_usage: 'off_session',
        metadata: {
          offerId: offer._id,
          offerKind: offer.kind,
          ...(offer.bookingId ? { bookingId: offer.bookingId } : {}),
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aud',
            unit_amount: offer.amountDueAud * 100,
            product_data: {
              name: offer.kind === 'extension' ? 'MAX Entertain extra night' : 'MAX Entertain special offer',
              description: `${offer.checkIn} to ${offer.checkOut} (${offer.nights} nights)`,
            },
          },
        },
      ],
      success_url: `${siteUrl}/offer/${encodeURIComponent(params.token)}?paid=1`,
      cancel_url: `${siteUrl}/offer/${encodeURIComponent(params.token)}?cancelled=1`,
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
    })

    await attachOfferCheckout(offer._id, session.id, checkoutExpiresAt)
    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout could not be started' },
      { status: 400 }
    )
  }
}
