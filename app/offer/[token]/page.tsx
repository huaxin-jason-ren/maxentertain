import Link from 'next/link'
import BookingSummary from '@/components/BookingSummary'
import { propertyConfig } from '@/config/property'
import { getOfferByToken, toPublicOffer } from '@/lib/offers'
import AcceptOfferButton from './AcceptOfferButton'

export const dynamic = 'force-dynamic'

export default async function SpecialOfferPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { paid?: string; cancelled?: string }
}) {
  const record = await getOfferByToken(params.token)
  const offer = record ? toPublicOffer(record) : null
  const active = Boolean(offer && ['sent', 'accepted', 'checkout_pending'].includes(offer.status) && new Date(offer.expiresAt) > new Date())

  return (
    <main className="min-h-screen bg-luxury-light px-4 py-12 dark:bg-[#141411]">
      <div className="container-custom max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-luxury-dark hover:text-luxury-gold dark:text-white">
          <span className="material-icons" style={{ fontSize: '20px' }}>home</span>
          Back to Property
        </Link>

        {!offer ? (
          <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-[#1f1f1c]">
            <h1 className="font-serif text-3xl font-bold dark:text-white">Offer not found</h1>
            <p className="mt-3 text-gray-700 dark:text-gray-300">This private offer link is invalid. Please contact Jason for help.</p>
          </div>
        ) : ['paid', 'completed'].includes(offer.status) ? (
          <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-[#1f1f1c]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-luxury-gold">Payment received</p>
            <h1 className="mt-3 font-serif text-4xl font-bold dark:text-white">{offer.kind === 'extension' ? 'Your booking amendment is confirmed' : 'Your booking is confirmed'}</h1>
            <p className="mt-4 text-gray-700 dark:text-gray-300">A confirmation email is on its way to you. Thank you for choosing {propertyConfig.name}.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <section className="rounded-lg bg-white p-7 shadow-xl dark:bg-[#1f1f1c] lg:col-span-7">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-luxury-gold">Private 24-hour offer</p>
              <h1 className="mt-3 font-serif text-4xl font-bold text-luxury-dark dark:text-white">
                {offer.kind === 'extension' ? 'Extend your stay' : `Your special offer, ${offer.guestName}`}
              </h1>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                {offer.checkIn} to {offer.checkOut} · {offer.nights} nights · {offer.guestCount} guests
              </p>

              {offer.kind === 'extension' ? (
                <div className="mt-6 rounded-lg border border-luxury-gold/30 bg-luxury-gold/10 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Current total: ${offer.originalTotalAud.toLocaleString()}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Revised total: ${offer.pricing.totalAud.toLocaleString()}</p>
                  {offer.amountDueAud > 0 ? <p className="mt-1 text-lg font-semibold dark:text-white">Additional payment: ${offer.amountDueAud.toLocaleString()}</p> : null}
                  {(offer.refundDueAud ?? 0) > 0 ? <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-300">Refund due: ${(offer.refundDueAud ?? 0).toLocaleString()}</p> : null}
                  {offer.amountDueAud === 0 && !(offer.refundDueAud ?? 0) ? <p className="mt-1 text-lg font-semibold dark:text-white">No payment or refund required</p> : null}
                </div>
              ) : null}

              {offer.inclusions ? <div className="mt-6"><h2 className="font-semibold dark:text-white">Included</h2><p className="mt-1 whitespace-pre-line text-gray-700 dark:text-gray-300">{offer.inclusions}</p></div> : null}
              {offer.note ? <div className="mt-6"><h2 className="font-semibold dark:text-white">A note from Jason</h2><p className="mt-1 whitespace-pre-line text-gray-700 dark:text-gray-300">{offer.note}</p></div> : null}

              <div className="mt-6">
                <h2 className="font-serif text-2xl font-bold dark:text-white">House rules</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
                  {propertyConfig.policies.houseRules.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
                <h2 className="mt-6 font-serif text-2xl font-bold dark:text-white">Cancellation policy</h2>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{propertyConfig.policies.cancellation}</p>
              </div>

              <div className="mt-7 border-t border-gray-200 pt-6 dark:border-white/10">
                {searchParams.paid === '1' ? <p className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">Payment was submitted. We are confirming it now; refresh this page in a moment if the confirmation email has not arrived yet.</p> : null}
                <p className={`mb-4 text-sm font-semibold ${active ? 'text-luxury-gold' : 'text-red-600 dark:text-red-300'}`}>
                  {active
                    ? `Dates reserved until ${new Date(offer.expiresAt).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', dateStyle: 'full', timeStyle: 'short' })} Melbourne time.`
                    : `This offer is ${offer.status.replace('_', ' ')} and can no longer be paid.`}
                </p>
                {searchParams.cancelled === '1' ? <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Payment was not completed. Your offer remains available until the time shown above.</p> : null}
                <AcceptOfferButton
                  token={params.token}
                  disabled={!active}
                  amountDueAud={offer.amountDueAud}
                  refundDueAud={offer.refundDueAud ?? 0}
                />
              </div>
            </section>
            <aside className="lg:col-span-5">
              <BookingSummary pricing={offer.pricing} checkIn={offer.checkIn} checkOut={offer.checkOut} showLevy />
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
