'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { propertyConfig } from '@/config/property'

export default function Hero() {
  // Prefer the HD version of _DSC8072.jpg for the homepage hero image
  const heroKey = '_DSC8072'
  const heroImage = `/images/hd/${heroKey}.jpg`

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Single Hero Image */}
      <div className="relative h-full w-full">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Lighter overlay so more of the hero photo shows through */}
          <div className="relative w-full h-full bg-gradient-to-r from-black/55 via-black/35 to-black/20">
            <Image
              src={heroImage}
              alt={propertyConfig.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={85}
              unoptimized={false}
              onError={(e) => {
                // Fallback to HD version if compressed fails
                const target = e.target as HTMLImageElement
                const hdFallback =
                  propertyConfig.images.find((img) => img.includes(heroKey)) || propertyConfig.images[0]
                if (hdFallback) {
                  target.src = hdFallback
                } else {
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect fill="%23ddd" width="1200" height="800"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EProperty Image%3C/text%3E%3C/svg%3E'
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="container-custom px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* More transparent content panel to reveal the HD background */}
            <div className="mx-auto max-w-4xl bg-black/15 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 drop-shadow-2xl">
                {propertyConfig.name}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-lg">
                {propertyConfig.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
                <Link href="/inquiry" className="btn-primary inline-flex items-center gap-2">
                  <Calendar size={20} />
                  Book Directly and Save!
                </Link>
                {propertyConfig.booking?.airbnb && (
                  <a
                    href={propertyConfig.booking.airbnb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#FF5A5F] hover:bg-[#E04A4F] text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center gap-3 text-sm md:text-base"
                  >
                    <Image
                      src="/images/icons/airbnb_icon.jpg"
                      alt="Airbnb"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                    <span>Airbnb</span>
                  </a>
                )}
                {propertyConfig.booking?.bookingCom && (
                  <a
                    href={propertyConfig.booking.bookingCom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#003580] hover:bg-[#002550] text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center gap-3 text-sm md:text-base"
                  >
                    <Image
                      src="/images/icons/booking_icon.jpeg"
                      alt="Booking.com"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain bg-white rounded p-0.5"
                    />
                    <span>Booking.com</span>
                  </a>
                )}
                {propertyConfig.booking?.vrbo && (
                  <a
                    href={propertyConfig.booking.vrbo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#00A699] hover:bg-[#008B7F] text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center gap-3 text-sm md:text-base"
                  >
                    <Image
                      src="/images/icons/vrbo.png"
                      alt="VRBO"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                    <span>VRBO</span>
                  </a>
                )}
                <a
                  href="#gallery"
                  className="btn-secondary text-white border-white hover:bg-white hover:text-luxury-dark"
                >
                  Explore Property
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 right-8 z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  )
}


