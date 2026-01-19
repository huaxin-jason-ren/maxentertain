'use client'

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { propertyConfig } from '@/config/property'

export default function PhotosGallery() {
  const images = useMemo(() => {
    const thumbs =
      propertyConfig.imagesCompressed && propertyConfig.imagesCompressed.length > 0
        ? propertyConfig.imagesCompressed
        : propertyConfig.images
    return thumbs.length > 0 ? thumbs : propertyConfig.images
  }, [])

  const hdImages = useMemo(() => {
    return propertyConfig.images.length > 0 ? propertyConfig.images : images
  }, [images])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const totalImages = images.length

  const close = () => setActiveIndex(null)
  const prev = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + hdImages.length) % hdImages.length))
  const next = () => setActiveIndex((i) => (i === null ? null : (i + 1) % hdImages.length))

  useEffect(() => {
    const update = () => setIsDesktop(window.matchMedia('(min-width: 768px)').matches)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (activeIndex === null) return
    if (!isDesktop) {
      // Don’t show the full-screen “enlarge” viewer on mobile.
      setActiveIndex(null)
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, hdImages.length, isDesktop])

  return (
    <>
      {/* Mobile: show ALL photos (2 per row) */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {images.map((src, idx) => (
          <div key={idx} className="relative aspect-[4/3] w-full rounded-xl overflow-hidden">
            <Image
              src={src}
              alt={`${propertyConfig.name} - Photo ${idx + 1}`}
              fill
              className="object-cover"
              sizes="50vw"
              loading="lazy"
              quality={70}
              unoptimized={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = hdImages[idx] || '/images/placeholder.jpg'
              }}
            />
          </div>
        ))}
      </div>

      {/* Desktop/tablet: grid (with click-to-enlarge on desktop) */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {images.map((src, idx) => (
          <div
            key={idx}
            className={`relative aspect-[4/3] rounded-xl overflow-hidden ${
              isDesktop ? 'cursor-pointer focus-within:ring-2 focus-within:ring-luxury-gold' : ''
            }`}
            {...(isDesktop
              ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  onClick: () => setActiveIndex(idx),
                  onKeyDown: (e: ReactKeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveIndex(idx)
                  },
                  'aria-label': `Open photo ${idx + 1}`,
                }
              : {})}
          >
            <Image
              src={src}
              alt={`${propertyConfig.name} - Photo ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              quality={70}
              unoptimized={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = hdImages[idx] || '/images/placeholder.jpg'
              }}
            />
          </div>
        ))}
      </div>

      {isDesktop && activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-white/90 hover:text-white p-2"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <button
            type="button"
            onClick={prev}
            className="absolute left-2 md:left-6 text-white/90 hover:text-white p-2"
            aria-label="Previous photo"
          >
            <ChevronLeft size={36} />
          </button>

          <div className="relative w-[92vw] max-w-5xl h-[70vh] md:h-[80vh]">
            <Image
              src={hdImages[activeIndex] || images[activeIndex]}
              alt={`${propertyConfig.name} - Photo ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="92vw"
              priority
            />
          </div>

          <button
            type="button"
            onClick={next}
            className="absolute right-2 md:right-6 text-white/90 hover:text-white p-2"
            aria-label="Next photo"
          >
            <ChevronRight size={36} />
          </button>
        </div>
      )}
    </>
  )
}

