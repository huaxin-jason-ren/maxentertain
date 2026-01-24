'use client'

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { propertyConfig } from '@/config/property'

export default function PhotosGallery() {
  const sections = useMemo(() => {
    const defined = propertyConfig.photoSections
    if (defined && defined.length > 0) return defined
    return [{ id: 'all', title: 'All Photos', images: propertyConfig.images }]
  }, [])

  const compressedSet = useMemo(() => new Set(propertyConfig.imagesCompressed ?? []), [])

  const toThumb = (src: string) => {
    if (!propertyConfig.imagesCompressed || propertyConfig.imagesCompressed.length === 0) return src
    const candidate = src.replace('/images/', '/images/compressed/')
    return compressedSet.has(candidate) ? candidate : src
  }

  const flat = useMemo(() => {
    const photos: Array<{
      sectionId: string
      sectionTitle: string
      hdSrc: string
      thumbSrc: string
    }> = []

    const seen = new Set<string>()
    for (const section of sections) {
      for (const hdSrc of section.images) {
        if (!hdSrc || seen.has(hdSrc)) continue
        seen.add(hdSrc)
        photos.push({
          sectionId: section.id,
          sectionTitle: section.title,
          hdSrc,
          thumbSrc: toThumb(hdSrc),
        })
      }
    }

    for (const hdSrc of propertyConfig.images) {
      if (!hdSrc || seen.has(hdSrc)) continue
      seen.add(hdSrc)
      photos.push({
        sectionId: 'other',
        sectionTitle: 'Other',
        hdSrc,
        thumbSrc: toThumb(hdSrc),
      })
    }

    return photos
  }, [sections])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const totalImages = flat.length

  const close = () => setActiveIndex(null)
  const prev = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + totalImages) % totalImages))
  const next = () => setActiveIndex((i) => (i === null ? null : (i + 1) % totalImages))

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
  }, [activeIndex, totalImages, isDesktop])

  return (
    <>
      {/* Jump nav */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-700 mb-3">Jump to section</div>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              className="px-3 py-2 rounded-full border text-sm text-gray-700 hover:text-luxury-gold hover:border-luxury-gold transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sectioned gallery */}
      <div className="space-y-10">
        {sections.map((section) => {
          const items = flat.filter((p) => p.sectionId === section.id)
          if (items.length === 0) return null

          return (
            <section key={section.id} id={`section-${section.id}`}>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-luxury-dark mb-4">
                {section.title}
              </h2>

              {/* Mobile: 2 per row */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                {items.map((p) => (
                  <div key={p.hdSrc} className="relative aspect-[4/3] w-full rounded-xl overflow-hidden">
                    <Image
                      src={p.thumbSrc}
                      alt={`${propertyConfig.name} - ${section.title}`}
                      fill
                      className="object-cover"
                      sizes="50vw"
                      loading="lazy"
                      quality={70}
                      unoptimized={false}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = p.hdSrc || '/images/placeholder.jpg'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Desktop/tablet */}
              <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {items.map((p) => {
                  const globalIndex = flat.findIndex((x) => x.hdSrc === p.hdSrc)
                  const idx = globalIndex >= 0 ? globalIndex : 0

                  return (
                    <div
                      key={p.hdSrc}
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
                            'aria-label': `Open photo ${idx + 1} (${section.title})`,
                          }
                        : {})}
                    >
                      <Image
                        src={p.thumbSrc}
                        alt={`${propertyConfig.name} - ${section.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1200px) 33vw, 25vw"
                        loading="lazy"
                        quality={70}
                        unoptimized={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = p.hdSrc || '/images/placeholder.jpg'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
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
              src={flat[activeIndex]?.hdSrc || flat[activeIndex]?.thumbSrc || '/images/placeholder.jpg'}
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

