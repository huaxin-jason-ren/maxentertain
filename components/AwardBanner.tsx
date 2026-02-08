'use client'

import Image from 'next/image'
import { propertyConfig } from '@/config/property'

export default function AwardBanner({ embedded = false }: { embedded?: boolean }) {
  const awards = (propertyConfig.awards ?? []).filter((a) => Boolean(a.image)).slice(0, 2)
  if (awards.length === 0) return null

  const content = (
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-900 border border-yellow-200 shadow-sm mb-5">
            <span className="text-sm font-semibold tracking-wide uppercase">Award recognition</span>
          </div>

          <div className="relative w-full max-w-5xl">
            <div className={`grid gap-6 ${awards.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
              {awards.map((award, idx) => {
                const isBooking = /booking/i.test(award.title) || idx === 1
                // Keep these class names static so Tailwind includes them.
                const frameBg = isBooking ? 'bg-[#003580]' : 'bg-white'
                const innerBg = isBooking ? 'bg-[#003580]' : 'bg-white'
                const sparkleBg = isBooking ? 'bg-blue-300' : 'bg-yellow-300'

                return (
                  <div key={`${award.title}-${award.year}-${idx}`} className="relative">
                    <div className={`relative w-full h-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-white/70 ${frameBg}`}>
                      <div className={`relative w-full aspect-[4/3] ${innerBg}`}>
                      <Image
                        src={award.image!}
                        alt={`${award.title} ${award.year} - ${award.category}`}
                        fill
                        className="object-contain p-2"
                        quality={95}
                        sizes={awards.length > 1 ? '(min-width: 768px) 50vw, 100vw' : '100vw'}
                        priority={!embedded && idx === 0}
                      />
                    </div>
                  </div>

                  {/* Subtle sparkles */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 ${sparkleBg} rounded-full animate-ping opacity-60`} />
                  <div
                    className={`absolute -bottom-3 -left-3 w-6 h-6 ${sparkleBg} rounded-full animate-ping opacity-60`}
                    style={{ animationDelay: '0.6s' }}
                  />
                </div>
                )
              })}
            </div>
          </div>
        </div>
  )

  if (embedded) return content

  return (
    <section id="award" className="py-10 md:py-14 bg-gradient-to-b from-white via-[#003580]/5 to-luxury-light/30 scroll-mt-24 md:scroll-mt-28">
      <div className="container-custom px-4">{content}</div>
    </section>
  )
}

