import Hero from '@/components/Hero'
import Navigation from '@/components/Navigation'
import PropertyDetails from '@/components/PropertyDetails'
import Amenities from '@/components/Amenities'
import Calendar from '@/components/Calendar'
import Testimonials from '@/components/Testimonials'
import LocalArea from '@/components/LocalArea'
import ImageGallery from '@/components/ImageGallery'
import InquiryForm from '@/components/InquiryForm'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <ImageGallery />
      <PropertyDetails />
      <Amenities />
      <Testimonials />
      <LocalArea />
      <Calendar />
      <InquiryForm />
      <Footer />
    </main>
  )
}

