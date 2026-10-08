import Link from 'next/link'
import BookingSummary from '@/components/BookingSummary'
import CancellationPolicy from '@/components/CancellationPolicy'
import { getBookingById, getBookingByStripeSession, toPublicBookingSummary } from '@/lib/bookings'
import { getStripe } from '@/lib/stripe'
import DiscoverySurvey from '@/components/DiscoverySurvey'

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams?: { bookingId?: string; session_id?: string }
}) {
  const bookingId = searchParams?.bookingId
  const sessionId = searchParams?.session_id

  // Prefer Stripe session proof when present; never reveal cancellation tokens
  // from bookingId alone (cancel links stay in the confirmation email).
  let booking = null
  if (sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId)
      const sessionBookingId = session.metadata?.bookingId
      if (sessionBookingId && (!bookingId || bookingId === sessionBookingId)) {
        booking =
          (await getBookingByStripeSession(sessionId)) ??
          (await getBookingById(sessionBookingId))
      }
    } catch {
      booking = null
    }
  } else if (bookingId) {
    booking = await getBookingById(bookingId)
  }

  const summary = booking ? toPublicBookingSummary(booking, false) : null

  return (
    <main className="min-h-screen bg-luxury-light px-4 py-16 dark:bg-[#141411]">
      <div className="container-custom max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-luxury-dark transition-colors hover:text-luxury-gold dark:text-white">
          <span className="material-icons" style={{ fontSize: '20px' }}>home</span>
          <span>Back to Property</span>
        </Link>

        {!summary ? (
          <div className="rounded-sm bg-white p-8 shadow-xl dark:bg-[#1f1f1c]">
            <h1 className="font-serif text-3xl font-bold text-luxury-dark dark:text-white">Booking Not Found</h1>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              We could not find that booking. If Stripe charged your card, please contact Jason with your payment receipt.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <section className="rounded-sm bg-white p-8 shadow-xl dark:bg-[#1f1f1c] lg:col-span-7">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-luxury-gold">
                {summary.status === 'confirmed' ? 'Booking Confirmed' : 'Payment Processing'}
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold text-luxury-dark dark:text-white">
                Thank you, {summary.guestName}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {summary.status === 'confirmed'
                  ? 'Your direct booking is confirmed. A customised confirmation email will arrive shortly with your receipt, cancellation link, house rules, and next steps.'
                  : 'Stripe has redirected you back to the site. If your payment has completed, the booking will update once the Stripe webhook arrives.'}
              </p>

              <div className="mt-8 grid gap-4 text-base text-gray-700 dark:text-gray-300 md:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Check-in</p>
                  <p className="font-semibold text-luxury-dark dark:text-white">{summary.checkIn}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Check-out</p>
                  <p className="font-semibold text-luxury-dark dark:text-white">{summary.checkOut}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Guests</p>
                  <p className="font-semibold text-luxury-dark dark:text-white">{summary.guestCount}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500">Booking ID</p>
                  <p className="break-all font-semibold text-luxury-dark dark:text-white">{summary.id}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {summary.invoiceUrl ? (
                  <a href={summary.invoiceUrl} className="btn-primary" target="_blank" rel="noreferrer">
                    View Invoice
                  </a>
                ) : null}
                {summary.receiptUrl ? (
                  <a href={summary.receiptUrl} className="inline-flex items-center justify-center border border-luxury-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-luxury-gold transition-colors hover:bg-luxury-gold hover:text-white" target="_blank" rel="noreferrer">
                    View Receipt
                  </a>
                ) : null}
              </div>
              {sessionId ? (
                <DiscoverySurvey endpoint={`/api/bookings/${encodeURIComponent(summary.id)}?session_id=${encodeURIComponent(sessionId)}`} />
              ) : null}
            </section>

            <aside className="space-y-5 lg:col-span-5">
              <BookingSummary pricing={summary.pricing} checkIn={summary.checkIn} checkOut={summary.checkOut} showLevy />
              <CancellationPolicy />
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
