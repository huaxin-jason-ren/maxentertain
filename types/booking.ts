import type { NightBreakdown } from '@/lib/pricing'

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelling'
  | 'refund_pending'
  | 'expired'
  | 'cancelled'
  | 'refunded'
  | 'payment_orphaned'
  | 'completed'

export type BookingGroupType =
  | 'family'
  | 'corporate'
  | 'golf'
  | 'milestone'
  | 'other'

export interface BookingGuest {
  name: string
  email: string
  phone: string
  guests: number
  groupType: BookingGroupType
  pets: string
  /** Guest is travelling with a pet — triggers the pet cleaning fee. */
  withPet: boolean
  message: string
}

export interface BookingPricing {
  accommodationAud: number
  shortStayLevyRate: number
  shortStayLevyAud: number
  /** Flat pet cleaning fee added to the total when the guest travels with a pet. */
  petFeeAud: number
  totalAud: number
  totalCents: number
  nights: NightBreakdown[]
}

export interface BookingPayment {
  stripeSessionId?: string
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeInvoiceId?: string
  stripeInvoiceUrl?: string
  stripeReceiptUrl?: string
  /** Saved for placing the security-deposit hold off-session before check-in. */
  stripeCustomerId?: string
  stripePaymentMethodId?: string
  paidAt?: Date
}

export interface BookingPaymentTransaction extends BookingPayment {
  id: string
  kind: 'booking' | 'extension'
  amountAud: number
  offerId?: string
  refundedAud?: number
  refundIds?: string[]
}

export type BondStatus = 'none' | 'authorized' | 'released' | 'captured' | 'failed'

export interface BookingBond {
  status: BondStatus
  amountAud: number
  /** The manual-capture PaymentIntent holding the deposit. */
  paymentIntentId?: string
  authorizedAt?: Date
  releasedAt?: Date
  capturedAt?: Date
  capturedAmountAud?: number
  lastError?: string
}

export interface BookingArrival {
  /** Free-text arrival/check-in instructions: directions, parking, WiFi, etc. */
  details?: string
  /** Door/lockbox access code. Owner-only + guest pre-stay email; never public. */
  passcode?: string
  updatedAt?: Date
}

export interface BookingAgreement {
  /** Which version of the terms the guest accepted (for evidence of consent). */
  version: string
  acceptedAt: Date
  ip?: string
}

export interface BookingComms {
  commsEventsSent?: string[]
  lastEmailError?: string
  preStaySent?: number[]
  /** Exact send time per pre-stay offset, keyed by the day count (e.g. "3"). */
  preStaySentAt?: Record<string, Date>
  checkoutCompletedSent?: boolean
  reviewRequestedAt?: Date
  reviewSource?: 'google' | 'direct'
  reviewReceivedAt?: Date
}

export interface BookingRecord {
  _id: string
  propertyId: string
  status: BookingStatus
  guest: BookingGuest
  checkIn: string
  checkOut: string
  nights: number
  pricing: BookingPricing
  payment: BookingPayment
  /** All successful charges. Legacy bookings may only have `payment`. */
  payments?: BookingPaymentTransaction[]
  stripeSessionId?: string
  source: 'direct' | 'offer'
  rulesAccepted: boolean
  cancellationToken: string
  cancelReason?: string
  refundAmountAud?: number
  refundStripeId?: string
  expiresAt?: Date
  confirmedAt?: Date
  cancelledAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  comms?: BookingComms
  arrival?: BookingArrival
  agreement?: BookingAgreement
  bond?: BookingBond
}

export type OfferKind = 'new_booking' | 'extension'
export type OfferStatus =
  | 'sent'
  | 'accepted'
  | 'checkout_pending'
  | 'paid'
  | 'completed'
  | 'expired'
  | 'revoked'
  | 'payment_orphaned'

export interface SpecialOfferRecord {
  _id: string
  propertyId: string
  kind: OfferKind
  status: OfferStatus
  tokenHash: string
  inquiryId?: string
  bookingId?: string
  guest: BookingGuest
  checkIn: string
  checkOut: string
  previousCheckOut?: string
  nights: number
  /** All nights for a new stay; only the added nights for an extension. */
  heldDates: string[]
  pricing: BookingPricing
  /** Current total before an extension; zero for a new booking offer. */
  originalTotalAud: number
  /** Amount charged by this offer. */
  amountDueAud: number
  /** Amount returned when the revised booking total is lower. */
  refundDueAud?: number
  note?: string
  inclusions?: string
  expiresAt: Date
  acceptedAt?: Date
  agreement?: BookingAgreement
  stripeSessionId?: string
  checkoutExpiresAt?: Date
  payment?: BookingPayment
  refundIds?: string[]
  emailSentAt?: Date
  emailError?: string
  paidAt?: Date
  revokedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PublicSpecialOffer {
  kind: OfferKind
  status: OfferStatus
  guestName: string
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  pricing: BookingPricing
  originalTotalAud: number
  amountDueAud: number
  refundDueAud?: number
  note?: string
  inclusions?: string
  expiresAt: string
  acceptedAt?: string
}

export interface PublicBookingSummary {
  id: string
  status: BookingStatus
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  groupType: BookingGroupType
  pets: string
  pricing: BookingPricing
  invoiceUrl?: string
  receiptUrl?: string
  cancellationToken?: string
  cancellationUrl?: string
  confirmedAt?: string
}

export interface GuestRecord {
  _id: string
  propertyId: string
  name: string
  email: string
  phone: string
  tags: BookingGroupType[]
  totalBookings: number
  totalSpendAud: number
  marketingOptOut?: boolean
  lastBookingId: string
  lastCheckIn: string
  lastCheckOut: string
  lastStayedAt?: Date
  offerCampaignsSent?: string[]
  createdAt: Date
  updatedAt: Date
}

