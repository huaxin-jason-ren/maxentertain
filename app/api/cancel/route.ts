import { NextRequest, NextResponse } from 'next/server'
import {
  beginCancellation,
  cancelBooking,
  failCancellation,
  getBookingByCancellationToken,
  hasCommsEvent,
  markCommsEventFailed,
  markCommsEventSent,
} from '@/lib/bookings'
import { computeRefund } from '@/lib/cancellation'
import { sendBookingCancelledEmail, sendOwnerCancellationAlert } from '@/lib/email'
import { refundBookingPayments } from '@/lib/refunds'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { cancellationToken, reason } = await req.json()
    if (!cancellationToken) {
      return NextResponse.json({ error: 'Cancellation token is required' }, { status: 400 })
    }

    const booking = await getBookingByCancellationToken(String(cancellationToken))
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed bookings can be cancelled online' }, { status: 400 })
    }

    const refund = computeRefund(booking)
    const reasonText = String(reason ?? 'Guest requested cancellation')
    const cancellationStarted = await beginCancellation(booking._id, refund.refundAud, reasonText)
    if (!cancellationStarted) {
      return NextResponse.json({ error: 'Booking is already being cancelled or is no longer confirmed' }, { status: 409 })
    }

    let refundStripeId: string | undefined

    if (refund.refundAud > 0) {
      if (!booking.payments?.length && !booking.payment.stripePaymentIntentId) {
        await failCancellation(booking._id, 'Payment intent missing; manual refund required')
        return NextResponse.json({ error: 'Payment intent missing; manual refund required' }, { status: 409 })
      }

      try {
        const result = await refundBookingPayments(booking, refund.refundAud, {
          idempotencyPrefix: `cancel-refund-${booking._id}`,
          metadata: { policyApplied: refund.policyApplied },
        })
        refundStripeId = result.refundIds.join(',')
      } catch (error) {
        await failCancellation(booking._id, error instanceof Error ? error.message : 'Stripe refund failed')
        throw error
      }
    }

    let cancelled
    try {
      cancelled = await cancelBooking(booking._id, {
        refundAmountAud: refund.refundAud,
        refundStripeId,
        reason: reasonText,
      })
    } catch (error) {
      await failCancellation(
        booking._id,
        error instanceof Error ? error.message : 'Final cancellation update failed',
        { refundAlreadyIssued: Boolean(refundStripeId) }
      )
      throw error
    }

    if (cancelled) {
      const emailEvent = 'booking.cancelled.email'
      if (!(await hasCommsEvent(cancelled._id, emailEvent))) {
        try {
          await Promise.all([
            sendBookingCancelledEmail(cancelled, refund),
            sendOwnerCancellationAlert(cancelled, refund),
          ])
          await markCommsEventSent(cancelled._id, emailEvent)
        } catch (error) {
          await markCommsEventFailed(cancelled._id, emailEvent, error)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      refundAud: refund.refundAud,
      refundPercent: refund.refundPercent,
      policyApplied: refund.policyApplied,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cancellation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
