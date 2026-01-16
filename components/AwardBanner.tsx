'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { propertyConfig } from '@/config/property'

export default function AwardBanner({ embedded = false }: { embedded?: boolean }) {
  const award = propertyConfig.awards?.[0]
  if (!award?.image) return null

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-900 border border-yellow-200 shadow-sm mb-5">
        <span className="text-sm font-semibold tracking-wide uppercase">Award recognition</span>
      </div>

      <div className="relative w-full max-w-xl">
        <div className="relative w-full h-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-white/70 bg-white">
          <Image
            src={award.image}
            alt={`${award.title} ${award.year} - ${award.category}`}
            width={900}
            height={650}
            className="w-full h-auto object-contain"
            quality={95}
            priority={!embedded}
          />
        </div>

        {/* Subtle sparkles */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-300 rounded-full animate-ping opacity-60" />
        <div
          className="absolute -bottom-3 -left-3 w-6 h-6 bg-yellow-300 rounded-full animate-ping opacity-60"
          style={{ animationDelay: '0.6s' }}
        />
      </div>
    </motion.div>
  )

  if (embedded) return content

  return (
    <section id="award" className="py-10 md:py-14 bg-gradient-to-b from-white to-luxury-light/30">
      <div className="container-custom px-4">{content}</div>
    </section>
  )
}

