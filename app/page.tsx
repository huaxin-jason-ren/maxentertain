import Hero from '@/components/Hero'
import Navigation from '@/components/Navigation'
import PropertyDetails from '@/components/PropertyDetails'
import Amenities from '@/components/Amenities'
import Testimonials from '@/components/Testimonials'
import LocalArea from '@/components/LocalArea'
import ImageGallery from '@/components/ImageGallery'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import AvailabilityInquirySync from '@/components/AvailabilityInquirySync'
import { propertyConfig } from '@/config/property'
import { getSiteUrl } from '@/lib/site'

export default function Home() {
  const siteUrl = getSiteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: propertyConfig.name,
    description: propertyConfig.description,
    url: siteUrl,
    image: propertyConfig.images.slice(0, 8).map((p) => `${siteUrl}${p}`),
    address: {
      '@type': 'PostalAddress',
      streetAddress: propertyConfig.location,
      addressLocality: 'Tootgarook',
      addressRegion: 'VIC',
      postalCode: '3941',
      addressCountry: 'AU',
    },
    email: propertyConfig.contact.email,
    petsAllowed: propertyConfig.amenities.some((a) => /pet/i.test(a)),
    checkinTime: propertyConfig.policies.checkIn,
    checkoutTime: propertyConfig.policies.checkOut,
    amenityFeature: propertyConfig.amenities.slice(0, 12).map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
    sameAs: [
      propertyConfig.booking?.airbnb,
      propertyConfig.booking?.bookingCom,
      propertyConfig.booking?.vrbo,
    ].filter(Boolean),
  }

  return (
    <main className="min-h-screen">
      <JsonLd data={jsonLd} />
      <Navigation />
      <Hero />
      <ImageGallery />
      <PropertyDetails />
      <Amenities />
      <Testimonials />
      <LocalArea />
      <AvailabilityInquirySync />
      <Footer />
    </main>
  )
}

