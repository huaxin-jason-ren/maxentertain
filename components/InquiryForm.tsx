'use client'

import { useMemo, useState, FormEvent, useEffect } from 'react'
import { motion } from 'framer-motion'
import { propertyConfig } from '@/config/property'
import { useAvailability } from '@/hooks/useAvailability'
import DatePicker from '@/components/DatePicker'
import { trackClick } from '@/lib/analytics'
import { nightsIncludeBlocked } from '@/lib/stay-nights'

interface FormData {
  name: string
  email: string
  phone: string
  checkIn: string
  checkOut: string
  guests: string
  message: string
}

type InquiryFormVariant = 'default' | 'glass'

export default function InquiryForm({
  variant = 'default',
  containerClassName,
  blockedDates: blockedDatesProp,
  prefill,
}: {
  variant?: InquiryFormVariant
  containerClassName?: string
  blockedDates?: string[]
  prefill?: { checkIn?: string; checkOut?: string }
}) {
  const availability = useAvailability({ enabled: blockedDatesProp === undefined })
  const blockedDates = blockedDatesProp ?? availability.blockedDates
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>('')
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const trackGoogleAdsLeadConversion = () => {
    if (typeof window === 'undefined') return
    const gtag = (window as any).gtag as undefined | ((...args: any[]) => void)
    if (typeof gtag !== 'function') return

    gtag('event', 'conversion', {
      send_to: 'AW-17899499107/sDFcCJKR7e4bEOPcktdC',
    })
  }

  const prefillCheckIn = prefill?.checkIn
  const prefillCheckOut = prefill?.checkOut

  useEffect(() => {
    if (!prefillCheckIn && !prefillCheckOut) return
    setFormData((prev) => ({
      ...prev,
      checkIn: prefillCheckIn ?? prev.checkIn,
      checkOut: prefillCheckOut ?? prev.checkOut,
    }))
  }, [prefillCheckIn, prefillCheckOut])

  const dateStrToUtcDate = (dateStr: string) => {
    // dateStr: yyyy-MM-dd
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
  }

  const nightsBetween = (checkIn: string, checkOut: string) => {
    const a = dateStrToUtcDate(checkIn).getTime()
    const b = dateStrToUtcDate(checkOut).getTime()
    return Math.round((b - a) / 86400000)
  }

  const isRangeAvailable = (checkIn: string, checkOut: string) =>
    !nightsIncludeBlocked(checkIn, checkOut, blockedSet)

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // If it starts with +61, format as +61 XXX XXX XXX
    if (cleaned.startsWith('+61')) {
      const digits = cleaned.substring(3).replace(/\D/g, '')
      if (digits.length === 0) return '+61 '
      if (digits.length <= 3) return `+61 ${digits}`
      if (digits.length <= 6) return `+61 ${digits.substring(0, 3)} ${digits.substring(3)}`
      return `+61 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`
    }
    
    // If it starts with 61 (without +), add +
    if (cleaned.startsWith('61') && !cleaned.startsWith('+')) {
      const digits = cleaned.substring(2).replace(/\D/g, '')
      if (digits.length === 0) return '+61 '
      if (digits.length <= 3) return `+61 ${digits}`
      if (digits.length <= 6) return `+61 ${digits.substring(0, 3)} ${digits.substring(3)}`
      return `+61 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`
    }
    
    // If it starts with 0 (Australian format), replace with +61
    if (cleaned.startsWith('0')) {
      const digits = cleaned.substring(1).replace(/\D/g, '')
      if (digits.length === 0) return '+61 '
      if (digits.length <= 3) return `+61 ${digits}`
      if (digits.length <= 6) return `+61 ${digits.substring(0, 3)} ${digits.substring(3)}`
      return `+61 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`
    }
    
    // If user is typing and hasn't started with +61, 61, or 0, assume they want +61 format
    // Only format if there are digits
    const digits = cleaned.replace(/\D/g, '')
    if (digits.length === 0) return ''
    if (!cleaned.includes('+') && digits.length > 0) {
      // User is typing digits, format as +61 XXX XXX XXX
      if (digits.length <= 3) return `+61 ${digits}`
      if (digits.length <= 6) return `+61 ${digits.substring(0, 3)} ${digits.substring(3)}`
      return `+61 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)}`
    }
    
    return value
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces and check if it matches +61 followed by 9 digits
    const cleaned = phone.replace(/\s/g, '')
    return /^\+61\d{9}$/.test(cleaned)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (+61 XXX XXX XXX)'
    }
    if (!formData.checkIn) {
      newErrors.checkIn = 'Check-in date is required'
    }
    if (!formData.checkOut) {
      newErrors.checkOut = 'Check-out date is required'
    }
    if (formData.checkIn && formData.checkOut && new Date(formData.checkIn) >= new Date(formData.checkOut)) {
      newErrors.checkOut = 'Check-out must be after check-in'
    }

    if (formData.checkIn && formData.checkOut && !newErrors.checkOut) {
      const nights = nightsBetween(formData.checkIn, formData.checkOut)
      if (nights < 2) {
        newErrors.checkOut = 'Minimum stay is 2 nights'
      } else if (blockedDates.length > 0 && !isRangeAvailable(formData.checkIn, formData.checkOut)) {
        newErrors.checkIn = 'Selected dates include unavailable nights. Please choose available dates.'
      }
    }
    if (!formData.guests) {
      newErrors.guests = 'Number of guests is required'
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitErrorMessage('')

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          guests: formData.guests,
          message: formData.message,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Could not send inquiry. Please try again.')
      }

      // Google Ads conversion: fire only after successful submit.
      trackGoogleAdsLeadConversion()
      trackClick('Enquiry Submitted', { location: 'Inquiry Form' })

      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '',
        message: '',
      })
      setErrors({})
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Inquiry service unavailable. Please try again later or email us directly.'
      console.error('Inquiry submit error:', error)
      setSubmitErrorMessage(String(message))
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    // Format phone number as user types
    if (field === 'phone') {
      const formatted = formatPhoneNumber(value)
      setFormData((prev) => ({ ...prev, [field]: formatted }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCheckInChange = (next: string) => {
    setFormData((prev) => {
      const shouldClearCheckOut = prev.checkOut && next && prev.checkOut <= next
      return {
        ...prev,
        checkIn: next,
        checkOut: shouldClearCheckOut ? '' : prev.checkOut,
      }
    })
    if (errors.checkIn || errors.checkOut) {
      setErrors((prev) => ({ ...prev, checkIn: undefined, checkOut: undefined }))
    }
  }

  const handleCheckOutChange = (next: string) => {
    setFormData((prev) => ({ ...prev, checkOut: next }))
    if (errors.checkOut || errors.checkIn) {
      setErrors((prev) => ({ ...prev, checkIn: undefined, checkOut: undefined }))
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const isGlass = variant === 'glass'
  const containerClasses = containerClassName ?? 'max-w-2xl mx-auto'

  return (
    <section
      id="inquiry"
      className={isGlass ? 'py-0 bg-transparent' : 'section-padding bg-gradient-to-b from-luxury-light to-white'}
    >
      <div className={isGlass ? '' : 'container-custom'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={containerClasses}
        >
          <div
            className={
              isGlass
                ? 'bg-[#0f0f0f]/82 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-white/10'
                : 'bg-white rounded-2xl shadow-xl p-8 md:p-12'
            }
          >
            {!isGlass && submitStatus !== 'success' ? (
              <div className="mb-8 text-center">
                <span className="section-label">Still Have Questions?</span>
                <h2 className="mt-2 font-serif text-3xl font-bold text-luxury-dark">
                  Send an enquiry to Jason
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600">
                  For custom dates, pets, group fit or special requests, send a note here. Ready to book? Use the calendar above to see live pricing and pay securely.
                </p>
              </div>
            ) : null}

            {submitStatus === 'success' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <span className="material-icons mx-auto text-green-500 mb-4 block text-center" style={{ fontSize: '64px' }}>check_circle</span>
                <h3 className={`text-2xl font-serif font-semibold mb-2 ${isGlass ? 'text-white' : 'text-luxury-dark'}`}>
                  Thank You!
                </h3>
                <p className={`mb-6 ${isGlass ? 'text-white/70' : 'text-gray-600'}`}>
                  Your enquiry has been sent successfully. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="btn-secondary"
                >
                  Send Another Enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className={`block text-base font-semibold mb-2 ${isGlass ? 'text-white/90' : 'text-gray-800'}`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white text-black text-base`}
                    />
                    {errors.name && (
                      <p className="text-red-600 text-base mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className={`block text-base font-semibold mb-2 ${isGlass ? 'text-white/90' : 'text-gray-800'}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white text-black text-base`}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-base mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={`block text-base font-semibold mb-2 ${isGlass ? 'text-white/90' : 'text-gray-800'}`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white text-black text-base`}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-base mt-1">{errors.phone}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <DatePicker
                      id="checkIn"
                      label="Check-in Date"
                      value={formData.checkIn}
                      onChange={handleCheckInChange}
                      blockedSet={blockedSet}
                      minDateStr={todayStr}
                      error={errors.checkIn}
                      disabled={availability.isLoading}
                      forceDarkText={isGlass}
                    />
                  </div>

                  <div>
                    <DatePicker
                      id="checkOut"
                      label="Check-out Date"
                      value={formData.checkOut}
                      onChange={handleCheckOutChange}
                      blockedSet={blockedSet}
                      minDateStr={formData.checkIn || todayStr}
                      minExclusive={Boolean(formData.checkIn)}
                      checkoutCheckIn={formData.checkIn || undefined}
                      error={errors.checkOut}
                      disabled={availability.isLoading || !formData.checkIn}
                      forceDarkText={isGlass}
                    />
                  </div>
                </div>

                <p className={`text-sm md:text-base ${isGlass ? 'text-white/55' : 'text-gray-600'}`}>
                  Dates are validated against live availability. You can check out on the morning another guest arrives.
                </p>

                <div>
                  <label htmlFor="guests" className={`block text-base font-semibold mb-2 ${isGlass ? 'text-white/90' : 'text-gray-800'}`}>
                    Number of Guests *
                  </label>
                  <select
                    id="guests"
                    value={formData.guests}
                    onChange={(e) => handleChange('guests', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.guests ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white text-black text-base`}
                  >
                    <option value="">Select number of guests</option>
                    {Array.from({ length: propertyConfig.maxGuests }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                    <option value={`${propertyConfig.maxGuests}+`}>{propertyConfig.maxGuests}+ Guests</option>
                  </select>
                  {errors.guests && (
                    <p className="text-red-600 text-base mt-1">{errors.guests}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className={`block text-base font-semibold mb-2 ${isGlass ? 'text-white/90' : 'text-gray-800'}`}>
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all resize-none bg-white/85 text-black text-base`}
                  />
                  {errors.message && (
                    <p className="text-red-600 text-base mt-1">{errors.message}</p>
                  )}
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <span className="material-icons text-red-500 flex-shrink-0 mt-0.5" style={{ fontSize: '20px' }}>error</span>
                    <div>
                      <p className="text-red-800 font-semibold">Error sending enquiry</p>
                      <p className="text-red-700 text-base mt-1">
                        {submitErrorMessage || 'Please try again later.'}
                      </p>
                      <div className="mt-3">
                        <a
                          href={`mailto:${propertyConfig.contact.email}`}
                          className="inline-flex text-base font-semibold text-luxury-gold hover:underline"
                        >
                          Email us directly: {propertyConfig.contact.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-icons animate-spin" style={{ fontSize: '20px' }}>autorenew</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="material-icons" style={{ fontSize: '20px' }}>send</span>
                      Submit Enquiry
                    </>
                  )}
                </button>

                <p className={`text-sm text-center leading-relaxed ${isGlass ? 'text-white/45' : 'text-gray-600'}`}>
                  By submitting this form, you agree to our privacy policy. We&apos;ll use your information to respond to your enquiry.
                </p>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="mt-8 text-center">
            <p className={isGlass ? 'text-white/95 mb-4 drop-shadow' : 'text-gray-600 mb-4'}>Or contact us directly:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`mailto:${propertyConfig.contact.email}`}
                className={isGlass ? 'text-luxury-gold hover:underline font-semibold drop-shadow' : 'text-luxury-gold hover:underline font-semibold'}
              >
                {propertyConfig.contact.email}
              </a>
              {propertyConfig.contact.phone && (
                <>
                  <span className={isGlass ? 'text-white/70' : 'text-gray-400'}>•</span>
                  <a
                    href={`tel:${propertyConfig.contact.phone}`}
                    className={isGlass ? 'text-luxury-gold hover:underline font-semibold drop-shadow' : 'text-luxury-gold hover:underline font-semibold'}
                  >
                    {propertyConfig.contact.phone}
                  </a>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

