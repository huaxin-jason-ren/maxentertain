'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react'
import { propertyConfig } from '@/config/property'

export default function Footer() {
  return (
    <footer className="bg-luxury-dark text-white py-12">
      <div className="container-custom px-4 md:px-8 lg:px-16">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Property Info */}
          <div>
            <h3 className="text-2xl font-serif font-bold mb-4 text-luxury-gold">
              {propertyConfig.name}
            </h3>
            <p className="text-gray-300 mb-4">{propertyConfig.description}</p>
            <div className="flex items-center gap-2 text-gray-300 mb-2">
              <MapPin size={18} />
              <span>{propertyConfig.location}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#details" className="text-gray-300 hover:text-luxury-gold transition-colors">
                  Property Details
                </Link>
              </li>
              <li>
                <Link href="#inquiry" className="text-gray-300 hover:text-luxury-gold transition-colors">
                  Book Your Stay
                </Link>
              </li>
              <li>
                <a href={`mailto:${propertyConfig.contact.email}`} className="text-gray-300 hover:text-luxury-gold transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${propertyConfig.contact.email}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-luxury-gold transition-colors"
                >
                  <Mail size={18} />
                  <span>{propertyConfig.contact.email}</span>
                </a>
              </li>
              {propertyConfig.contact.phone && (
                <li>
                  <a
                    href={`tel:${propertyConfig.contact.phone}`}
                    className="flex items-center gap-2 text-gray-300 hover:text-luxury-gold transition-colors"
                  >
                    <Phone size={18} />
                    <span>{propertyConfig.contact.phone}</span>
                  </a>
                </li>
              )}
              {propertyConfig.socialMedia && (
                <li className="flex gap-4 mt-4">
                  {propertyConfig.socialMedia.instagram && (
                    <a
                      href={propertyConfig.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-luxury-gold transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram size={20} />
                    </a>
                  )}
                  {propertyConfig.socialMedia.facebook && (
                    <a
                      href={propertyConfig.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-luxury-gold transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={20} />
                    </a>
                  )}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {propertyConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}





