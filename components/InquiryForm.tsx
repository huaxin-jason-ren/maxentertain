'use client'

import { useMemo, useState, FormEvent, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { propertyConfig } from '@/config/property'
import { emailJsConfig } from '@/config/emailjs'
import { useAvailability } from '@/hooks/useAvailability'
import DatePicker from '@/components/DatePicker'

// Note: this component runs client-side. We init EmailJS in an effect to match
// @emailjs/browser v4 API and to ensure it only runs in the browser.

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

  useEffect(() => {
    if (emailJsConfig.publicKey) emailjs.init({ publicKey: emailJsConfig.publicKey })
  }, [])

  useEffect(() => {
    if (!prefill) return
    setFormData((prev) => ({
      ...prev,
      checkIn: prefill.checkIn ?? prev.checkIn,
      checkOut: prefill.checkOut ?? prev.checkOut,
    }))
  }, [prefill?.checkIn, prefill?.checkOut])

  const dateStrToUtcDate = (dateStr: string) => {
    // dateStr: yyyy-MM-dd
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
  }

  const utcDateToDateStr = (date: Date) => {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const nightsBetween = (checkIn: string, checkOut: string) => {
    const a = dateStrToUtcDate(checkIn).getTime()
    const b = dateStrToUtcDate(checkOut).getTime()
    return Math.round((b - a) / 86400000)
  }

  const isRangeAvailable = (checkIn: string, checkOut: string) => {
    // Treat checkout as exclusive. Validate all nights from check-in up to (check-out - 1).
    const start = dateStrToUtcDate(checkIn)
    const endExclusive = dateStrToUtcDate(checkOut)
    for (let cur = new Date(start); cur < endExclusive; cur.setUTCDate(cur.getUTCDate() + 1)) {
      const curStr = utcDateToDateStr(cur)
      if (blockedSet.has(curStr)) return false
    }
    return true
  }

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
      const { serviceId, templateId, publicKey } = emailJsConfig

      if (!serviceId || !templateId || !publicKey) {
        throw new Error(
          'Email service is not configured. Please verify EmailJS configuration and Allowed Origins / Domains.'
        )
      }

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        guests: formData.guests,
        message: formData.message,
        property_name: propertyConfig.name,
        to_email: propertyConfig.contact.email,
      }

      // @emailjs/browser v4: pass publicKey in options (even if init ran)
      await emailjs.send(serviceId, templateId, templateParams, { publicKey })

      // Google Ads conversion: fire only after successful submit.
      trackGoogleAdsLeadConversion()

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
      const err = error as any
      const rawMessage = err?.text || err?.message || ''
      const status = err?.status
      const message =
        status === 403 || /origin|domain|not allowed/i.test(String(rawMessage))
          ? 'Email service blocked this domain. In EmailJS, add your production site URL to Allowed Origins / Domains, then redeploy.'
          : rawMessage || 'Email service unavailable. Please try again later or email us directly.'
      console.error('EmailJS error:', error)
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
                ? 'bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-white/25'
                : 'bg-white rounded-2xl shadow-xl p-8 md:p-12'
            }
          >
            {submitStatus === 'success' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                <h3 className="text-2xl font-serif font-semibold text-luxury-dark mb-2">
                  Thank You!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your inquiry has been sent successfully. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="btn-secondary"
                >
                  Send Another Inquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85`}
                    placeholder="+61 123 456 789"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
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
                      error={errors.checkOut}
                      disabled={availability.isLoading || !formData.checkIn}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Dates are validated against live availability. Unavailable dates are disabled.
                </p>

                <div>
                  <label htmlFor="guests" className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <select
                    id="guests"
                    value={formData.guests}
                    onChange={(e) => handleChange('guests', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.guests ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all bg-white/85`}
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
                    <p className="text-red-500 text-sm mt-1">{errors.guests}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-luxury-gold transition-all resize-none bg-white/85`}
                    placeholder="Tell us about your stay or any special requests..."
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-red-800 font-semibold">Error sending inquiry</p>
                      <p className="text-red-600 text-sm mt-1">
                        {submitErrorMessage || 'Please check your EmailJS configuration or try again later.'}
                      </p>
                      <div className="mt-3">
                        <a
                          href={`mailto:${propertyConfig.contact.email}`}
                          className="inline-flex text-sm font-semibold text-luxury-gold hover:underline"
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
                      <Loader2 className="animate-spin" size={20} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Submit Inquiry
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our privacy policy. We&apos;ll use your information to respond to your inquiry.
                </p>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Or contact us directly:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`mailto:${propertyConfig.contact.email}`}
                className="text-luxury-gold hover:underline font-semibold"
              >
                {propertyConfig.contact.email}
              </a>
              {propertyConfig.contact.phone && (
                <>
                  <span className="text-gray-400">•</span>
                  <a
                    href={`tel:${propertyConfig.contact.phone}`}
                    className="text-luxury-gold hover:underline font-semibold"
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

