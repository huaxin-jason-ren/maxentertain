import InquiryForm from '@/components/InquiryForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function InquiryPage() {
  const safeSrc = (src: string) => encodeURI(src)

  return (
    <main className="relative min-h-screen">
      {/* Fixed background */}
      <div className="fixed inset-0 -z-10">
        <Image
          src={safeSrc('/Airbnb picture/1975 Point Nepean Road- HD/Backyard.jpg')}
          alt="Property background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/15" />
      </div>

      <div className="section-padding">
        <div className="container-custom">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors drop-shadow"
          >
            <ArrowLeft size={20} />
            <span>Back to Property</span>
          </Link>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left: copy (keeps background visible on the right) */}
            <div className="lg:col-span-5">
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white drop-shadow-2xl mb-3">
                  Your journey starts here
            </h1>
                <p className="text-white/90 text-base md:text-lg drop-shadow">
                  Stay at the top-rated luxury stay on the Mornington Peninsula.
                </p>
                <p className="text-white/85 text-sm md:text-base mt-3 drop-shadow">
                  Please check out the{' '}
                  <Link href="/#calendar" className="underline underline-offset-4 hover:text-white">
                    availability calendar
                  </Link>{' '}
                  to find out our availability.
                </p>
              </div>
            </div>

            {/* Right: form (narrower so it doesn't cover the whole photo) */}
            <div className="lg:col-span-7 lg:justify-self-end w-full">
              <InquiryForm variant="glass" containerClassName="w-full max-w-xl ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}





