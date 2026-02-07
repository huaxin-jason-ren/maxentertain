import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PhotosGallery from '@/components/PhotosGallery'

export default function PhotosPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="py-10 md:py-12 px-4 md:px-8 lg:px-16">
        <div className="container-custom">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-luxury-accent hover:text-luxury-gold mb-5 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>

          <div className="flex items-end justify-between gap-6 mb-5">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-luxury-dark mb-1">
                Photos
              </h1>
              <p className="text-gray-600">Browse by section</p>
            </div>
          </div>

          <PhotosGallery />
        </div>
      </div>
    </main>
  )
}

