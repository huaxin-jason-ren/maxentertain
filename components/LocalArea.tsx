'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt } from 'react-icons/fa'
import { 
  FaUtensils,
  FaCamera,
  FaUmbrellaBeach,
  FaShoppingBag,
  FaHiking,
  FaSpa,
  FaWineGlass,
  FaGolfBall,
  FaSwimmingPool
} from 'react-icons/fa'
import { MdLocalDining, MdAttractions, MdShoppingCart, MdBeachAccess } from 'react-icons/md'
import { propertyConfig } from '@/config/property'

const attractionIcons: Record<string, any> = {
  restaurant: FaUtensils,
  attraction: FaCamera,
  activity: FaHiking,
  beach: FaUmbrellaBeach,
  shopping: FaShoppingBag,
}

function formatKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  const rounded = Math.round(km * 10) / 10
  return `${rounded} km`
}

export default function LocalArea() {
  const attractions = propertyConfig.localArea.attractions

  return (
    <section id="local-area" className="section-padding bg-gradient-to-b from-luxury-light to-white scroll-mt-24 md:scroll-mt-28">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="heading-primary">{propertyConfig.localArea.title}</h2>
          <p className="text-luxury text-gray-600 max-w-2xl mx-auto">
            {propertyConfig.localArea.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {attractions.map((attraction, index) => {
            const Icon = attractionIcons[attraction.type] || FaMapMarkerAlt
            const driveMin = attraction.drive?.durationMin
            const driveKm = attraction.drive?.distanceKm
            const distanceLabel =
              typeof driveMin === 'number' && typeof driveKm === 'number'
                ? `${driveMin} min drive • ${formatKm(driveKm)}`
                : attraction.distance

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                {attraction.image && (
                  <div className="relative w-full aspect-[16/10]">
                    <Image
                      src={attraction.image}
                      alt={attraction.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority={index < 3}
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-luxury-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="text-luxury-gold" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-luxury-dark mb-1">{attraction.name}</h3>
                      {distanceLabel && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <FaMapMarkerAlt size={14} />
                          {distanceLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Interactive Google Maps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="w-full h-96 relative">
            {/* Google Maps Embed - Works without API key for basic embeds */}
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(propertyConfig.location)}&output=embed&zoom=14`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="Property Location Map"
            />
            {/* Link to open in Google Maps */}
            <div className="absolute bottom-4 right-4 z-10">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(propertyConfig.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-sm font-semibold text-luxury-dark hover:text-luxury-gold flex items-center gap-2"
              >
                <FaMapMarkerAlt size={16} />
                Open in Google Maps
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}





