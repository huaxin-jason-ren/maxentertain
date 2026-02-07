'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { propertyConfig } from '@/config/property'

export default function PhotosGallery() {
  const PLACEHOLDER =
    'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"800\"%3E%3Crect fill=\"%23ddd\" width=\"1200\" height=\"800\"/%3E%3Ctext fill=\"%23999\" font-family=\"sans-serif\" font-size=\"24\" x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\"%3EImage%20unavailable%3C/text%3E%3C/svg%3E'

  const safeSrc = (src: string) => (src.startsWith('data:') ? src : encodeURI(src))

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
  const totalImages = flat.length
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const lockedScrollYRef = useRef<number>(0)

  const close = () => setActiveIndex(null)
  const prev = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + totalImages) % totalImages))
  const next = () => setActiveIndex((i) => (i === null ? null : (i + 1) % totalImages))

  // Lock page scrolling when lightbox is open (iOS-safe).
  useEffect(() => {
    if (activeIndex === null) return

    const body = document.body
    lockedScrollYRef.current = window.scrollY

    const prevOverflow = body.style.overflow
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevWidth = body.style.width

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${lockedScrollYRef.current}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = prevOverflow
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      window.scrollTo(0, lockedScrollYRef.current)
    }
  }, [activeIndex])

  useEffect(() => {
    if (activeIndex === null) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, totalImages])

  return (
    <>
      {/* Jump nav */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-8 lg:-mx-16 px-4 md:px-8 lg:px-16 py-4 mb-6 bg-gray-50/90 backdrop-blur border-b border-black/5">
        <div className="text-xs font-semibold text-gray-700 mb-2">Jump to section</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              className="shrink-0 px-3 py-1.5 rounded-full border bg-white text-xs text-gray-700 hover:text-luxury-gold hover:border-luxury-gold transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sectioned gallery */}
      <div className="space-y-6 md:space-y-8">
        {sections.map((section) => {
          const items = flat.filter((p) => p.sectionId === section.id)
          if (items.length === 0) return null

          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="scroll-mt-24 md:scroll-mt-28 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4 md:p-6"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3 md:mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-luxury-dark">
                    {section.title}
                  </h2>
                  {'description' in section && section.description ? (
                    <div className="mt-1 text-sm text-gray-600">{section.description}</div>
                  ) : null}
                </div>
                <div className="text-xs text-gray-500">{items.length} photos</div>
              </div>

              {/* Mobile: 2 per row */}
              <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((p) => {
                  const globalIndex = flat.findIndex((x) => x.hdSrc === p.hdSrc)
                  const idx = globalIndex >= 0 ? globalIndex : 0

                  return (
                  <div
                    key={p.hdSrc}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveIndex(idx)}
                    onKeyDown={(e: ReactKeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') setActiveIndex(idx)
                    }}
                    aria-label={`Open photo ${idx + 1} (${section.title})`}
                    className="relative aspect-[4/3] w-full rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"
                  >
                    <Image
                      src={safeSrc(p.thumbSrc)}
                      alt={`${propertyConfig.name} - ${section.title}`}
                      fill
                      className="object-cover"
                      sizes="50vw"
                      loading="lazy"
                      quality={70}
                      unoptimized={false}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = safeSrc(p.hdSrc || PLACEHOLDER)
                      }}
                    />
                  </div>
                  )
                })}
              </div>

              {/* Desktop/tablet */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {items.map((p) => {
                  const globalIndex = flat.findIndex((x) => x.hdSrc === p.hdSrc)
                  const idx = globalIndex >= 0 ? globalIndex : 0

                  return (
                    <div
                      key={p.hdSrc}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveIndex(idx)}
                      onKeyDown={(e: ReactKeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') setActiveIndex(idx)
                      }}
                      aria-label={`Open photo ${idx + 1} (${section.title})`}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"
                    >
                      <Image
                        src={safeSrc(p.thumbSrc)}
                        alt={`${propertyConfig.name} - ${section.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1200px) 33vw, 25vw"
                        loading="lazy"
                        quality={70}
                        unoptimized={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = safeSrc(p.hdSrc || PLACEHOLDER)
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

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={close}
          onTouchStart={(e) => {
            const t = e.touches[0]
            touchStartXRef.current = t?.clientX ?? null
            touchStartYRef.current = t?.clientY ?? null
          }}
          onTouchEnd={(e) => {
            const startX = touchStartXRef.current
            const startY = touchStartYRef.current
            touchStartXRef.current = null
            touchStartYRef.current = null

            const t = e.changedTouches[0]
            if (startX === null || startY === null || !t) return

            const dx = t.clientX - startX
            const dy = t.clientY - startY

            // Horizontal swipe (ignore if mostly vertical).
            if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy)) return
            if (dx > 0) prev()
            else next()
          }}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-white/90 hover:text-white p-3 rounded-full bg-black/30 hover:bg-black/40 transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <button
            type="button"
            onClick={prev}
            className="hidden md:inline-flex absolute left-2 md:left-6 text-white/90 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={36} />
          </button>

          <div
            className="relative w-[92vw] max-w-5xl h-[72vh] md:h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={safeSrc(
                flat[activeIndex]?.hdSrc || flat[activeIndex]?.thumbSrc || PLACEHOLDER,
              )}
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
            className="hidden md:inline-flex absolute right-2 md:right-6 text-white/90 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={36} />
          </button>

          {/* Mobile: simple pager + swipe hint (smooth + less clutter) */}
          <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="text-xs text-white/75">Swipe left/right</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                className="px-4 py-2 rounded-full bg-white/10 text-white/90 border border-white/15"
                aria-label="Previous photo"
              >
                Prev
              </button>
              <div className="text-xs text-white/75 tabular-nums">
                {activeIndex + 1} / {totalImages}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                className="px-4 py-2 rounded-full bg-white/10 text-white/90 border border-white/15"
                aria-label="Next photo"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

