import { getDb } from '@/lib/mongodb'
import { getStripe } from '@/lib/stripe'
import type { BookingPaymentTransaction, BookingRecord } from '@/types/booking'

export function getBookingPayments(booking: BookingRecord): BookingPaymentTransaction[] {
  if (booking.payments?.length) return booking.payments.map((payment) => ({ ...payment }))
  if (!booking.payment.stripePaymentIntentId) return []
  return [{
    ...booking.payment,
    id: booking.payment.stripePaymentIntentId,
    kind: 'booking',
    amountAud: booking.pricing.totalAud,
  }]
}

export async function refundBookingPayments(
  booking: BookingRecord,
  refundAud: number,
  options: { idempotencyPrefix: string; metadata?: Record<string, string> }
) {
  const payments = getBookingPayments(booking)
  if (!Number.isInteger(refundAud) || refundAud < 1) {
    throw new Error('Refund amount must be a positive whole AUD amount')
  }

  const availableAud = payments.reduce(
    (sum, payment) => sum + Math.max(0, payment.amountAud - (payment.refundedAud ?? 0)),
    0
  )
  if (refundAud > availableAud) {
    throw new Error(`Refund of $${refundAud} exceeds the remaining paid balance of $${availableAud}`)
  }

  const db = await getDb()
  if (!booking.payments?.length) {
    await db.collection<BookingRecord>('bookings').updateOne(
      { _id: booking._id },
      { $set: { payments, updatedAt: new Date() } }
    )
  }

  let remainingAud = refundAud
  const refundIds: string[] = []
  for (let index = payments.length - 1; index >= 0 && remainingAud > 0; index -= 1) {
    const payment = payments[index]
    const availableOnPayment = Math.max(0, payment.amountAud - (payment.refundedAud ?? 0))
    if (!payment.stripePaymentIntentId || availableOnPayment === 0) continue
    const amountAud = Math.min(remainingAud, availableOnPayment)
    const refund = await getStripe().refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        amount: amountAud * 100,
        metadata: {
          bookingId: booking._id,
          paymentId: payment.id,
          ...options.metadata,
        },
      },
      { idempotencyKey: `${options.idempotencyPrefix}-${payment.id}-${amountAud}` }
    )
    refundIds.push(refund.id)
    payment.refundedAud = (payment.refundedAud ?? 0) + amountAud
    payment.refundIds = [...(payment.refundIds ?? []), refund.id]
    remainingAud -= amountAud
    await db.collection<BookingRecord>('bookings').updateOne(
      { _id: booking._id, 'payments.id': payment.id },
      {
        $set: {
          'payments.$.refundedAud': payment.refundedAud,
          'payments.$.refundIds': payment.refundIds,
          updatedAt: new Date(),
        },
      }
    )
  }

  if (remainingAud > 0) throw new Error(`Could not allocate $${remainingAud} of the required refund`)
  return { refundIds, payments }
}
