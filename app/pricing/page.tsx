import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PricingComparison from '@/components/PricingComparison'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="section-padding">
        <div className="container-custom">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-luxury-accent hover:text-luxury-gold mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>

          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="heading-primary mb-2">Price Comparison</h1>
              <p className="text-gray-600">
                Select dates to compare pricing across Airbnb, Booking.com, and Vrbo.
              </p>
            </div>
          </div>

          <PricingComparison />
        </div>
      </div>
    </main>
  )
}

