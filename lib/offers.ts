import { createHash, randomBytes, randomUUID } from 'crypto'
import type { Db, MongoServerError } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  AGREEMENT_VERSION,
  DatesUnavailableError,
  getBookingById,
  getBookingQuote,
  getNightDates,
  PROPERTY_ID,
  recordBookingEvent,
  upsertGuestFromBooking,
} from '@/lib/bookings'
import { PET_FEE_AUD } from '@/lib/pricing'
import { getBookingPayments, refundBookingPayments } from '@/lib/refunds'
import type {
  BookingGuest,
  BookingPayment,
  BookingPaymentTransaction,
  BookingPricing,
  BookingRecord,
  PublicSpecialOffer,
  SpecialOfferRecord,
} from '@/types/booking'

export const OFFER_HOLD_HOURS = 24
export const OFFER_CHECKOUT_MINUTES = 30

let indexesEnsured = false

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function duplicateKey(error: unknown): error is MongoServerError {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as MongoServerError).code === 11000)
}

async function ensureOfferIndexes(db: Db) {
  if (indexesEnsured) return
  await Promise.all([
    db.collection('offers').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('offers').createIndex({ status: 1, expiresAt: 1 }),
    db.collection('offers').createIndex({ bookingId: 1, createdAt: -1 }),
    db.collection('offers').createIndex({ inquiryId: 1, createdAt: -1 }),
  ])
  indexesEnsured = true
}

function scaleNightPrices(pricing: BookingPricing, accommodationAud: number) {
  const current = pricing.nights.reduce((sum, night) => sum + night.price, 0)
  if (pricing.nights.length === 0) return []
  let remaining = accommodationAud
  return pricing.nights.map((night, index) => {
    const price =
      index === pricing.nights.length - 1
        ? remaining
        : Math.max(0, Math.round((night.price / Math.max(1, current)) * accommodationAud))
    remaining -= price
    return { ...night, price, isOverride: true }
  })
}

function offerPricing(base: BookingPricing, accommodationAud: number, petFeeAud: number): BookingPricing {
  const totalAud = accommodationAud + petFeeAud
  return {
    ...base,
    accommodationAud,
    petFeeAud,
    totalAud,
    totalCents: totalAud * 100,
    shortStayLevyAud: Math.round(accommodationAud * base.shortStayLevyRate),
    nights: scaleNightPrices(base, accommodationAud),
  }
}

export interface CreateSpecialOfferInput {
  kind: 'new_booking' | 'extension'
  guest?: BookingGuest
  inquiryId?: string
  bookingId?: string
  checkIn?: string
  checkOut: string
  amountDueAud?: number
  revisedTotalAud?: number
  note?: string
  inclusions?: string
}

export async function getAmendmentPreview(
  booking: BookingRecord,
  checkOut: string,
  revisedTotalOverride?: number
) {
  if (booking.status !== 'confirmed') throw new Error('Only a confirmed booking can be amended')
  getNightDates(booking.checkIn, checkOut)

  const adding = checkOut > booking.checkOut
  const addedDates = adding ? getNightDates(booking.checkOut, checkOut) : []
  const removedDates = checkOut < booking.checkOut ? getNightDates(checkOut, booking.checkOut) : []
  let nights = booking.pricing.nights.filter((night) => night.dateStr < checkOut)
  let automaticAdjustmentAud = 0

  if (addedDates.length > 0) {
    const currentQuote = await getBookingQuote(booking.checkIn, checkOut)
    const addedNights = currentQuote.nights.filter((night) => addedDates.includes(night.dateStr))
    automaticAdjustmentAud = addedNights.reduce((sum, night) => sum + night.price, 0)
    nights = [...booking.pricing.nights, ...addedNights]
  } else if (removedDates.length > 0) {
    const removedValue = booking.pricing.nights
      .filter((night) => removedDates.includes(night.dateStr))
      .reduce((sum, night) => sum + night.price, 0)
    automaticAdjustmentAud = -removedValue
  }

  const automaticRevisedTotalAud = booking.pricing.totalAud + automaticAdjustmentAud
  const revisedTotalAud = revisedTotalOverride ?? automaticRevisedTotalAud
  if (!Number.isInteger(revisedTotalAud) || revisedTotalAud < booking.pricing.petFeeAud) {
    throw new Error('Revised total must be a whole AUD amount and cannot be below the pet fee')
  }

  const targetAccommodationAud = revisedTotalAud - booking.pricing.petFeeAud
  const currentNightTotal = nights.reduce((sum, night) => sum + night.price, 0)
  const customDifference = targetAccommodationAud - currentNightTotal
  if (customDifference !== 0 && nights.length > 0) {
    const index = nights.length - 1
    const adjustedPrice = nights[index].price + customDifference
    nights = adjustedPrice >= 0
      ? nights.map((night, nightIndex) =>
          nightIndex === index ? { ...night, price: adjustedPrice, isOverride: true } : night
        )
      : scaleNightPrices({ ...booking.pricing, nights }, targetAccommodationAud)
  }

  const adjustmentAud = revisedTotalAud - booking.pricing.totalAud
  const pricing: BookingPricing = {
    accommodationAud: targetAccommodationAud,
    shortStayLevyRate: booking.pricing.shortStayLevyRate,
    shortStayLevyAud: Math.round(targetAccommodationAud * booking.pricing.shortStayLevyRate),
    petFeeAud: booking.pricing.petFeeAud,
    totalAud: revisedTotalAud,
    totalCents: revisedTotalAud * 100,
    nights,
  }
  return {
    pricing,
    automaticRevisedTotalAud,
    revisedTotalAud,
    adjustmentAud,
    amountDueAud: Math.max(0, adjustmentAud),
    refundDueAud: Math.max(0, -adjustmentAud),
    addedDates,
    removedDates,
  }
}

export async function createSpecialOffer(input: CreateSpecialOfferInput) {
  const db = await getDb()
  await ensureOfferIndexes(db)
  await cleanupExpiredOffers()

  const existing =
    input.kind === 'extension' && input.bookingId
      ? await getBookingById(input.bookingId)
      : null
  if (input.kind === 'extension' && (!existing || existing.status !== 'confirmed')) {
    throw new Error('Only a confirmed booking can be extended')
  }
  if (existing) {
    const activeAmendment = await db.collection<SpecialOfferRecord>('offers').findOne({
      bookingId: existing._id,
      status: { $in: ['sent', 'accepted', 'checkout_pending'] },
    })
    if (activeAmendment) {
      throw new Error('This booking already has an active amendment offer. Revoke or complete it first.')
    }
  }

  const guest = existing?.guest ?? input.guest
  if (!guest) throw new Error('Guest details are required')

  const checkIn = existing?.checkIn ?? String(input.checkIn ?? '')
  const checkOut = input.checkOut
  const allNights = getNightDates(checkIn, checkOut)
  let lockDates = allNights
  let originalTotalAud = 0
  let amountDueAud: number
  let refundDueAud = 0
  let pricing: BookingPricing

  if (input.kind === 'extension' && existing) {
    const preview = await getAmendmentPreview(existing, checkOut, input.revisedTotalAud)
    lockDates = preview.addedDates
    originalTotalAud = existing.pricing.totalAud
    amountDueAud = preview.amountDueAud
    refundDueAud = preview.refundDueAud
    pricing = preview.pricing
  } else {
    if (!Number.isInteger(input.amountDueAud) || Number(input.amountDueAud) < 1 || Number(input.amountDueAud) > 100_000) {
      throw new Error('Offer amount must be a whole AUD amount between $1 and $100,000')
    }
    amountDueAud = Number(input.amountDueAud)
    const standard = await getBookingQuote(checkIn, checkOut)
    const petFeeAud = guest.withPet ? PET_FEE_AUD : 0
    const accommodationAud = amountDueAud - petFeeAud
    if (accommodationAud < 1) throw new Error('Offer total must exceed the pet cleaning fee')
    pricing = offerPricing(standard, accommodationAud, petFeeAud)
  }
  const now = new Date()
  const expiresAt = new Date(now.getTime() + OFFER_HOLD_HOURS * 60 * 60 * 1000)
  const offerId = randomUUID()
  const token = randomBytes(32).toString('base64url')
  const offer: SpecialOfferRecord = {
    _id: offerId,
    propertyId: PROPERTY_ID,
    kind: input.kind,
    status: 'sent',
    tokenHash: hashToken(token),
    inquiryId: input.inquiryId,
    bookingId: existing?._id,
    guest,
    checkIn,
    checkOut,
    previousCheckOut: existing?.checkOut,
    nights: allNights.length,
    heldDates: lockDates,
    pricing,
    originalTotalAud,
    amountDueAud,
    refundDueAud,
    note: input.note?.trim().slice(0, 2000),
    inclusions: input.inclusions?.trim().slice(0, 2000),
    expiresAt,
    createdAt: now,
    updatedAt: now,
  }

  const locks = lockDates.map((date) => ({
    propertyId: PROPERTY_ID,
    date,
    bookingId: `offer:${offerId}`,
    offerId,
    status: 'offer_hold',
    expiresAt,
    createdAt: now,
    updatedAt: now,
  }))

  if (locks.length > 0) {
    try {
      await db.collection('booking_locks').insertMany(locks, { ordered: true })
    } catch (error) {
      await db.collection('booking_locks').deleteMany({ offerId })
      if (duplicateKey(error)) throw new DatesUnavailableError()
      throw error
    }
  }

  try {
    await db.collection<SpecialOfferRecord>('offers').insertOne(offer)
  } catch (error) {
    await db.collection('booking_locks').deleteMany({ offerId })
    throw error
  }

  return { offer, token }
}

export async function getOfferByToken(token: string) {
  if (!token) return null
  await cleanupExpiredOffers()
  const db = await getDb()
  await ensureOfferIndexes(db)
  return db.collection<SpecialOfferRecord>('offers').findOne({ tokenHash: hashToken(token) })
}

export async function getOfferById(id: string) {
  const db = await getDb()
  await ensureOfferIndexes(db)
  return db.collection<SpecialOfferRecord>('offers').findOne({ _id: id })
}

export function toPublicOffer(offer: SpecialOfferRecord): PublicSpecialOffer {
  return {
    kind: offer.kind,
    status: offer.status,
    guestName: offer.guest.name,
    checkIn: offer.checkIn,
    checkOut: offer.checkOut,
    nights: offer.nights,
    guestCount: offer.guest.guests,
    pricing: offer.pricing,
    originalTotalAud: offer.originalTotalAud,
    amountDueAud: offer.amountDueAud,
    refundDueAud: offer.refundDueAud,
    note: offer.note,
    inclusions: offer.inclusions,
    expiresAt: offer.expiresAt.toISOString(),
    acceptedAt: offer.acceptedAt?.toISOString(),
  }
}

export async function acceptOffer(token: string, agreementIp?: string) {
  const db = await getDb()
  const now = new Date()
  const result = await db.collection<SpecialOfferRecord>('offers').findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      status: { $in: ['sent', 'accepted'] },
      expiresAt: { $gt: now },
    },
    {
      $set: {
        status: 'accepted',
        acceptedAt: now,
        agreement: { version: AGREEMENT_VERSION, acceptedAt: now, ip: agreementIp },
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  )
  if (!result) throw new Error('This offer is no longer available')
  return result
}

export async function attachOfferCheckout(offerId: string, stripeSessionId: string, checkoutExpiresAt: Date) {
  const db = await getDb()
  const offer = await db.collection<SpecialOfferRecord>('offers').findOneAndUpdate(
    { _id: offerId, status: 'accepted', expiresAt: { $gt: new Date() } },
    {
      $set: {
        status: 'checkout_pending',
        stripeSessionId,
        checkoutExpiresAt,
        expiresAt: checkoutExpiresAt,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )
  if (!offer) throw new Error('Offer could not start checkout')
  await db.collection('booking_locks').updateMany(
    { offerId, status: 'offer_hold' },
    { $set: { expiresAt: checkoutExpiresAt, updatedAt: new Date() } }
  )
  return offer
}

export async function markOfferEmailResult(offerId: string, error?: unknown) {
  const db = await getDb()
  const now = new Date()
  await db.collection('offers').updateOne(
    { _id: offerId },
    error
      ? { $set: { emailError: error instanceof Error ? error.message : String(error), updatedAt: now } }
      : { $set: { emailSentAt: now, updatedAt: now }, $unset: { emailError: '' } }
  )
}

export async function rotateOfferToken(offerId: string) {
  const db = await getDb()
  const token = randomBytes(32).toString('base64url')
  const offer = await db.collection<SpecialOfferRecord>('offers').findOneAndUpdate(
    {
      _id: offerId,
      status: { $in: ['sent', 'accepted', 'checkout_pending'] },
      expiresAt: { $gt: new Date() },
    },
    { $set: { tokenHash: hashToken(token), updatedAt: new Date() } },
    { returnDocument: 'after' }
  )
  if (!offer) throw new Error('Only an active offer can be resent')
  return { offer, token }
}

export async function revokeOffer(offerId: string) {
  const db = await getDb()
  const now = new Date()
  const offer = await db.collection<SpecialOfferRecord>('offers').findOneAndUpdate(
    { _id: offerId, status: { $in: ['sent', 'accepted', 'checkout_pending'] } },
    { $set: { status: 'revoked', revokedAt: now, updatedAt: now } },
    { returnDocument: 'after' }
  )
  if (offer) await db.collection('booking_locks').deleteMany({ offerId, status: 'offer_hold' })
  return offer
}

export async function expireOffer(offerId: string, reason = 'checkout_expired') {
  const db = await getDb()
  const now = new Date()
  const offer = await db.collection<SpecialOfferRecord>('offers').findOneAndUpdate(
    { _id: offerId, status: { $in: ['sent', 'accepted', 'checkout_pending'] } },
    { $set: { status: 'expired', emailError: reason, updatedAt: now } },
    { returnDocument: 'after' }
  )
  if (offer) await db.collection('booking_locks').deleteMany({ offerId, status: 'offer_hold' })
  return offer
}

export async function markOfferPaymentOrphaned(offerId: string, payment: BookingPayment, reason: string) {
  const db = await getDb()
  const offer = await db.collection<SpecialOfferRecord>('offers').findOneAndUpdate(
    { _id: offerId, status: { $ne: 'paid' } },
    { $set: { status: 'payment_orphaned', payment, emailError: reason, updatedAt: new Date() } },
    { returnDocument: 'after' }
  )
  if (offer) await db.collection('booking_locks').deleteMany({ offerId, status: 'offer_hold' })
  return offer
}

export async function cleanupExpiredOffers() {
  const db = await getDb()
  await ensureOfferIndexes(db)
  const now = new Date()
  const expired = await db
    .collection<SpecialOfferRecord>('offers')
    .find({ status: { $in: ['sent', 'accepted', 'checkout_pending'] }, expiresAt: { $lte: now } })
    .toArray()
  if (expired.length === 0) return 0
  const ids = expired.map((offer) => offer._id)
  await db.collection('offers').updateMany(
    { _id: { $in: ids } },
    { $set: { status: 'expired', updatedAt: now } }
  )
  await db.collection('booking_locks').deleteMany({ offerId: { $in: ids }, status: 'offer_hold' })
  return ids.length
}

export async function hasActiveOfferLocks(offer: SpecialOfferRecord) {
  const db = await getDb()
  const dates = offer.heldDates?.length
    ? offer.heldDates
    : offer.kind === 'extension' && offer.bookingId
      ? getNightDates((await getBookingById(offer.bookingId))?.checkOut ?? offer.checkIn, offer.checkOut)
      : getNightDates(offer.checkIn, offer.checkOut)
  const count = await db.collection('booking_locks').countDocuments({
    offerId: offer._id,
    date: { $in: dates },
    status: 'offer_hold',
    expiresAt: { $gt: new Date() },
  })
  return count === dates.length
}

function legacyTransaction(booking: BookingRecord): BookingPaymentTransaction | null {
  if (!booking.payment.stripePaymentIntentId || !booking.payment.paidAt) return null
  return {
    ...booking.payment,
    id: booking.payment.stripePaymentIntentId,
    kind: 'booking',
    amountAud: booking.pricing.totalAud,
  }
}

export async function confirmOfferPayment(offerId: string, payment: BookingPayment) {
  const db = await getDb()
  const offer = await getOfferById(offerId)
  if (!offer) throw new Error('Offer not found')
  if (offer.status === 'paid') {
    return { offer, booking: offer.bookingId ? await getBookingById(offer.bookingId) : null }
  }
  if (offer.status !== 'checkout_pending' || !offer.agreement || !(await hasActiveOfferLocks(offer))) {
    throw new Error('Offer is not payable or its reserved dates have expired')
  }

  const now = new Date()
  if (offer.kind === 'new_booking') {
    // A deterministic id makes webhook recovery safe if the process exits after
    // inserting the booking but before marking the offer paid.
    const bookingId = offer._id
    const recovered = await getBookingById(bookingId)
    if (recovered) {
      await db.collection('booking_locks').updateMany(
        { offerId: offer._id },
        { $set: { bookingId, status: 'confirmed', updatedAt: now }, $unset: { offerId: '', expiresAt: '' } }
      )
      await db.collection('offers').updateOne(
        { _id: offer._id },
        { $set: { status: 'paid', bookingId, payment, paidAt: now, updatedAt: now } }
      )
      return { offer: { ...offer, status: 'paid' as const, bookingId, payment, paidAt: now }, booking: recovered }
    }
    const transaction: BookingPaymentTransaction = {
      ...payment,
      id: payment.stripePaymentIntentId ?? payment.stripeSessionId ?? randomUUID(),
      kind: 'booking',
      amountAud: offer.amountDueAud,
      offerId: offer._id,
    }
    const booking: BookingRecord = {
      _id: bookingId,
      propertyId: PROPERTY_ID,
      status: 'confirmed',
      guest: offer.guest,
      checkIn: offer.checkIn,
      checkOut: offer.checkOut,
      nights: offer.nights,
      pricing: offer.pricing,
      payment,
      payments: [transaction],
      stripeSessionId: payment.stripeSessionId,
      source: 'offer',
      rulesAccepted: true,
      agreement: offer.agreement,
      cancellationToken: randomUUID(),
      confirmedAt: now,
      createdAt: offer.createdAt,
      updatedAt: now,
      comms: { commsEventsSent: [] },
    }
    await db.collection<BookingRecord>('bookings').insertOne(booking)
    await db.collection('booking_locks').updateMany(
      { offerId: offer._id, status: 'offer_hold' },
      {
        $set: { bookingId, status: 'confirmed', updatedAt: now },
        $unset: { offerId: '', expiresAt: '' },
      }
    )
    await db.collection<SpecialOfferRecord>('offers').updateOne(
      { _id: offer._id, status: 'checkout_pending' },
      { $set: { status: 'paid', bookingId, payment, paidAt: now, updatedAt: now } }
    )
    await recordBookingEvent(db, bookingId, 'booking.offer_confirmed', { offerId, payment })
    await upsertGuestFromBooking(booking)
    return { offer: { ...offer, status: 'paid' as const, bookingId, payment, paidAt: now }, booking }
  }

  const booking = offer.bookingId ? await getBookingById(offer.bookingId) : null
  if (!booking || booking.status !== 'confirmed') throw new Error('Original booking is no longer confirmed')
  if (offer.previousCheckOut && booking.checkOut !== offer.previousCheckOut) {
    throw new Error('The booking dates changed after this amendment was sent')
  }
  const extensionTransaction: BookingPaymentTransaction = {
    ...payment,
    id: payment.stripePaymentIntentId ?? payment.stripeSessionId ?? randomUUID(),
    kind: 'extension',
    amountAud: offer.amountDueAud,
    offerId: offer._id,
  }
  const priorPayments = booking.payments ?? [legacyTransaction(booking)].filter(Boolean) as BookingPaymentTransaction[]
  if (booking.checkOut === offer.checkOut && priorPayments.some((item) => item.offerId === offer._id)) {
    await db.collection('offers').updateOne(
      { _id: offer._id },
      { $set: { status: 'paid', payment, paidAt: now, updatedAt: now } }
    )
    return { offer: { ...offer, status: 'paid' as const, payment, paidAt: now }, booking }
  }
  const updated = await db.collection<BookingRecord>('bookings').findOneAndUpdate(
    { _id: booking._id, status: 'confirmed', checkOut: booking.checkOut },
    {
      $set: {
        checkOut: offer.checkOut,
        nights: offer.nights,
        pricing: offer.pricing,
        payments: [...priorPayments, extensionTransaction],
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  )
  if (!updated) throw new Error('Booking changed while the extension was being confirmed')
  const removedDates =
    offer.checkOut < booking.checkOut ? getNightDates(offer.checkOut, booking.checkOut) : []
  if (removedDates.length > 0) {
    await db.collection('booking_locks').deleteMany({
      bookingId: booking._id,
      status: 'confirmed',
      date: { $in: removedDates },
    })
  }
  await db.collection('booking_locks').updateMany(
    { offerId: offer._id, status: 'offer_hold' },
    {
      $set: { bookingId: booking._id, status: 'confirmed', updatedAt: now },
      $unset: { offerId: '', expiresAt: '' },
    }
  )
  await db.collection<SpecialOfferRecord>('offers').updateOne(
    { _id: offer._id, status: 'checkout_pending' },
    { $set: { status: 'paid', payment, paidAt: now, updatedAt: now } }
  )
  await db.collection('guests').updateOne(
    { _id: booking.guest.email.toLowerCase() },
    {
      $set: { lastCheckOut: offer.checkOut, lastStayedAt: new Date(`${offer.checkOut}T00:00:00.000Z`), updatedAt: now },
      $inc: { totalSpendAud: offer.amountDueAud },
    }
  )
  await recordBookingEvent(db, booking._id, 'booking.extended', {
    offerId,
    previousCheckOut: booking.checkOut,
    checkOut: offer.checkOut,
    amountAud: offer.amountDueAud,
    payment,
  })
  return { offer: { ...offer, status: 'paid' as const, payment, paidAt: now }, booking: updated }
}

export async function completeNonPaymentAmendment(offerId: string) {
  const db = await getDb()
  const offer = await getOfferById(offerId)
  if (!offer || offer.kind !== 'extension' || offer.amountDueAud > 0) {
    throw new Error('This amendment requires payment or is not available')
  }
  if (!['accepted', 'checkout_pending'].includes(offer.status)) {
    if (offer.status === 'completed' && offer.bookingId) {
      return { offer, booking: await getBookingById(offer.bookingId) }
    }
    throw new Error('This amendment is no longer available')
  }

  const booking = offer.bookingId ? await getBookingById(offer.bookingId) : null
  if (!booking || booking.status !== 'confirmed') throw new Error('Original booking is no longer confirmed')
  if (offer.previousCheckOut && booking.checkOut !== offer.previousCheckOut) {
    throw new Error('The booking dates changed after this amendment was sent')
  }

  const refundResult = offer.refundDueAud && !offer.refundIds?.length
    ? await refundBookingPayments(booking, offer.refundDueAud, {
        idempotencyPrefix: `amendment-refund-${offer._id}`,
        metadata: { offerId: offer._id, reason: 'booking_amendment' },
      })
    : null
  if (refundResult) {
    await db.collection('offers').updateOne(
      { _id: offer._id },
      {
        $set: {
          status: 'checkout_pending',
          refundIds: refundResult.refundIds,
          updatedAt: new Date(),
        },
      }
    )
  }
  const now = new Date()
  const removedDates =
    offer.checkOut < booking.checkOut ? getNightDates(offer.checkOut, booking.checkOut) : []

  const updated = await db.collection<BookingRecord>('bookings').findOneAndUpdate(
    { _id: booking._id, status: 'confirmed', checkOut: booking.checkOut },
    {
      $set: {
        checkOut: offer.checkOut,
        nights: offer.nights,
        pricing: offer.pricing,
        ...((refundResult || offer.refundIds?.length)
          ? { payments: refundResult?.payments ?? getBookingPayments(booking) }
          : {}),
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  )
  if (!updated) throw new Error('Booking changed while the amendment was being applied')

  if (removedDates.length > 0) {
    await db.collection('booking_locks').deleteMany({
      bookingId: booking._id,
      status: 'confirmed',
      date: { $in: removedDates },
    })
  }
  await db.collection('booking_locks').updateMany(
    { offerId: offer._id, status: 'offer_hold' },
    {
      $set: { bookingId: booking._id, status: 'confirmed', updatedAt: now },
      $unset: { offerId: '', expiresAt: '' },
    }
  )
  await db.collection<SpecialOfferRecord>('offers').updateOne(
    { _id: offer._id },
    { $set: { status: 'completed', paidAt: now, updatedAt: now } }
  )
  await db.collection('guests').updateOne(
    { _id: booking.guest.email.toLowerCase() },
    {
      $set: {
        lastCheckOut: offer.checkOut,
        lastStayedAt: new Date(`${offer.checkOut}T00:00:00.000Z`),
        updatedAt: now,
      },
      ...(offer.refundDueAud ? { $inc: { totalSpendAud: -offer.refundDueAud } } : {}),
    }
  )
  await recordBookingEvent(db, booking._id, 'booking.amended', {
    offerId,
    previousCheckOut: booking.checkOut,
    checkOut: offer.checkOut,
    previousTotalAud: booking.pricing.totalAud,
    revisedTotalAud: offer.pricing.totalAud,
    refundAud: offer.refundDueAud ?? 0,
    refundIds: refundResult?.refundIds ?? offer.refundIds ?? [],
  })
  return { offer: { ...offer, status: 'completed' as const, paidAt: now }, booking: updated }
}
