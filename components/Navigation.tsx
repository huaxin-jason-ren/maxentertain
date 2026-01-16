'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Calendar } from 'lucide-react'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    // Match homepage section order
    { href: '#gallery', label: 'Photos' },
    { href: '#details', label: 'Property' },
    { href: '#amenities', label: 'Amenities' },
    { href: '#testimonials', label: 'Reviews' },
    { href: '#local-area', label: 'Nearby' },
    { href: '#calendar', label: 'Availability' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-black/35 backdrop-blur-md border-b border-white/10 shadow-lg'
      }`}
    >
      <div className="container-custom px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className={`inline-flex items-center gap-3 text-2xl font-serif font-bold transition-colors ${
              isScrolled ? 'text-luxury-dark' : 'text-white drop-shadow-lg'
            }`}
          >
            <span className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-full bg-white/90 ring-1 ring-black/5 flex-shrink-0">
              <Image
                src="/images/brand/logo.png"
                alt="Max Entertain logo"
                fill
                className="object-cover scale-110"
                sizes="(max-width: 768px) 36px, 40px"
                priority
              />
            </span>
            <span className="hidden sm:inline">Max Enterain</span>
            <span className="sm:hidden">Max</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium text-sm ${
                  isScrolled
                    ? 'text-gray-700 hover:text-luxury-gold'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/inquiry"
              className="btn-primary text-sm py-2 px-6"
            >
              <Calendar size={16} className="inline mr-2" />
              Inquiry
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors ${
              isScrolled ? 'text-luxury-dark' : 'text-white'
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t shadow-lg"
          >
            <div className="container-custom px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-gray-700 hover:text-luxury-gold transition-colors font-medium py-2"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/inquiry"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-primary w-full text-center"
              >
                <Calendar size={16} className="inline mr-2" />
                Send Inquiry
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}





