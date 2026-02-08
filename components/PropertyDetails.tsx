'use client'

import { useMemo, useState } from 'react'
import { Bed, Bath, Users, MapPin } from 'lucide-react'
import { propertyConfig } from '@/config/property'

export default function PropertyDetails() {
  const details = [
    { icon: Bed, label: 'Bedrooms', value: propertyConfig.bedrooms },
    { icon: Bath, label: 'Bathrooms', value: propertyConfig.bathrooms },
    { icon: Users, label: 'Max Guests', value: `${propertyConfig.maxGuests}+` },
  ]

  const [showAllAbout, setShowAllAbout] = useState(false)
  const ABOUT_MAX_LINES = 26

  const aboutLines = useMemo(() => propertyConfig.longDescription.split('\n'), [])
  const visibleAboutLines = useMemo(
    () => (showAllAbout ? aboutLines : aboutLines.slice(0, ABOUT_MAX_LINES)),
    [aboutLines, showAllAbout]
  )

  return (
    <section id="details" className="section-padding bg-white scroll-mt-24 md:scroll-mt-28">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="heading-primary">{propertyConfig.name}</h2>
          <div className="flex items-center justify-center gap-2 text-luxury-accent mb-8">
            <MapPin size={20} />
            <p className="text-xl">{propertyConfig.location}</p>
          </div>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {details.map((detail, index) => {
            const Icon = detail.icon
            return (
              <div
                key={index}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-luxury-light to-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold/10 rounded-full mb-4">
                  <Icon className="text-luxury-gold" size={32} />
                </div>
                <div className="text-4xl font-serif font-bold text-luxury-dark mb-2">
                  {detail.value}
                </div>
                <div className="text-gray-600 font-medium">{detail.label}</div>
              </div>
            )
          })}
        </div>

        {/* Description */}
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-12">
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-luxury-dark mb-4 text-center">
              About This Property
            </h3>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-luxury-gold"></div>
              <div className="w-2 h-2 rounded-full bg-luxury-gold"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-luxury-gold"></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-luxury-light/30 via-white to-luxury-light/20 p-8 md:p-12 rounded-3xl shadow-lg border border-luxury-gold/10">
            <div className="text-gray-700">
              <div className="text-base md:text-lg lg:text-xl font-sans font-light tracking-wide">
                {visibleAboutLines.map((line, index) => {
                  const trimmedLine = line.trim()
                  
                  // Style headings (lines ending with ? or :, or short uppercase lines)
                  if (trimmedLine.endsWith('?') || 
                      (trimmedLine.endsWith(':') && !trimmedLine.startsWith('-')) ||
                      (trimmedLine.length > 0 && 
                       trimmedLine.length < 50 && 
                       !trimmedLine.startsWith('-') &&
                       trimmedLine === trimmedLine.toUpperCase() &&
                       trimmedLine.split(' ').length <= 5)) {
                    return (
                      <h4 key={index} className="text-2xl md:text-3xl font-serif font-semibold text-luxury-dark mt-8 mb-4 first:mt-0">
                        {trimmedLine}
                      </h4>
                    )
                  }
                  // Style bullet points
                  if (trimmedLine.startsWith('-')) {
                    return (
                      <div key={index} className="flex items-start gap-3 pl-2 mb-2">
                        <span className="text-luxury-gold text-xl mt-1 font-bold flex-shrink-0">•</span>
                        <span className="flex-1 leading-relaxed">{trimmedLine.substring(1).trim()}</span>
                      </div>
                    )
                  }
                  // Regular paragraphs
                  if (trimmedLine.length > 0) {
                    return (
                      <p key={index} className="mb-6 leading-relaxed last:mb-0">
                        {trimmedLine}
                      </p>
                    )
                  }
                  // Empty lines for spacing
                  return <div key={index} className="h-4" />
                })}
              </div>
            </div>

            {aboutLines.length > ABOUT_MAX_LINES && (
              <div className="mt-8 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllAbout((v) => !v)}
                  className="btn-secondary"
                  aria-expanded={showAllAbout}
                >
                  {showAllAbout ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Policies */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-2 gap-8">
          <div className="bg-luxury-light p-8 rounded-2xl">
            <h4 className="text-xl font-serif font-semibold mb-4 text-luxury-dark">
              Check-in & Check-out
            </h4>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Check-in:</span> {propertyConfig.policies.checkIn}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Check-out:</span> {propertyConfig.policies.checkOut}
            </p>
          </div>
          <div className="bg-luxury-light p-8 rounded-2xl">
            <h4 className="text-xl font-serif font-semibold mb-4 text-luxury-dark">
              Cancellation Policy
            </h4>
            <p className="text-gray-700">{propertyConfig.policies.cancellation}</p>
          </div>
        </div>

        {/* House Rules */}
        {propertyConfig.policies.houseRules.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <h4 className="text-xl font-serif font-semibold mb-4 text-luxury-dark">
              House Rules
            </h4>
            <ul className="grid md:grid-cols-2 gap-3">
              {propertyConfig.policies.houseRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <span className="text-luxury-gold mt-1">✓</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}





