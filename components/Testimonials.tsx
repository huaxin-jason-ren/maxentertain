'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { propertyConfig } from '@/config/property'
import AwardBanner from '@/components/AwardBanner'

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-white">
      <div className="container-custom">
        {/* Keep #award anchor working, but visually combine Award + Reviews */}
        <div id="award" className="mb-16">
          <AwardBanner embedded />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading-primary">Guest Reviews</h2>
          <p className="text-luxury text-gray-600">
            See what our guests have to say about their stay
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {propertyConfig.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gradient-to-br from-luxury-light to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Quote className="text-luxury-gold mb-4" size={32} />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="fill-luxury-gold text-luxury-gold"
                    size={20}
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                &ldquo;{testimonial.comment}&rdquo;
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-luxury-dark">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

