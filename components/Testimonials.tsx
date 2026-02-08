'use client'

import { useState } from 'react'
import { Star, Quote } from 'lucide-react'
import { propertyConfig } from '@/config/property'
import AwardBanner from '@/components/AwardBanner'

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlightedText(text: string, keywords?: string[]) {
  const cleaned = (keywords ?? [])
    .map((k) => k.trim())
    .filter(Boolean)

  if (cleaned.length === 0) return text

  // Longer keywords first to avoid partial matches pre-empting longer phrases.
  const sorted = [...cleaned].sort((a, b) => b.length - a.length)
  const pattern = sorted.map(escapeRegExp).join('|')
  const re = new RegExp(`(${pattern})`, 'gi')

  const parts = text.split(re)
  return parts.map((part, i) => {
    const isHit = sorted.some((k) => k.toLowerCase() === part.toLowerCase())
    return isHit ? (
      <span key={i} className="font-semibold text-gray-900 not-italic">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  })
}

export default function Testimonials() {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false)
  const testimonials = propertyConfig.testimonials
  const firstFour = testimonials.slice(0, 4)
  const rest = testimonials.slice(4)

  const ReviewCard = ({ testimonial, index }: { testimonial: (typeof testimonials)[number]; index: number }) => (
    <div
      key={`${testimonial.name}-${testimonial.date}-${index}`}
      className="bg-gradient-to-br from-luxury-light to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
    >
      <Quote className="text-luxury-gold mb-4" size={32} />
      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="fill-luxury-gold text-luxury-gold" size={20} />
        ))}
      </div>
      <p className="text-gray-700 mb-6 leading-relaxed italic">
        &ldquo;{renderHighlightedText(testimonial.comment, testimonial.highlight)}&rdquo;
      </p>
      <div className="border-t pt-4">
        <p className="font-semibold text-luxury-dark">{testimonial.name}</p>
        <p className="text-sm text-gray-500">{testimonial.date}</p>
      </div>
    </div>
  )

  return (
    <section id="testimonials" className="section-padding bg-gradient-to-b from-white via-[#003580]/[0.03] to-white scroll-mt-24 md:scroll-mt-28">
      <div className="container-custom">
        {/* Keep #award anchor working, but visually combine Award + Reviews */}
        <div id="award" className="mb-16">
          <AwardBanner embedded />
        </div>

        <div className="text-center mb-16">
          <h2 className="heading-primary">Guest Reviews</h2>
          <p className="text-luxury text-gray-600">
            See what our guests have to say about their stay
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {firstFour.map((testimonial, index) => (
            <ReviewCard key={`${testimonial.name}-${testimonial.date}-${index}`} testimonial={testimonial} index={index} />
          ))}

          {/* Desktop always shows all reviews; mobile shows the rest when expanded */}
          <div className={isExpandedMobile ? 'contents' : 'hidden md:contents'}>
            {rest.map((testimonial, index) => (
              <ReviewCard
                key={`${testimonial.name}-${testimonial.date}-${index + 4}`}
                testimonial={testimonial}
                index={index + 4}
              />
            ))}
          </div>
        </div>

        {/* Mobile: fold extra reviews behind a toggle */}
        {rest.length > 0 && (
          <div className="mt-10 md:hidden flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpandedMobile((v) => !v)}
              className="btn-secondary px-8 py-3"
              aria-expanded={isExpandedMobile}
            >
              {isExpandedMobile ? 'Show fewer reviews' : `Show ${rest.length} more reviews`}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

