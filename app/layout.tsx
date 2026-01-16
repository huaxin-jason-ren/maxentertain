import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { propertyConfig } from '@/config/property'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: `${propertyConfig.name} - Luxury Property Rental`,
  description: propertyConfig.description,
  keywords: 'luxury rental, vacation rental, property rental, luxury accommodation',
  authors: [{ name: propertyConfig.name }],
  openGraph: {
    title: `${propertyConfig.name} - Luxury Property Rental`,
    description: propertyConfig.description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${propertyConfig.name} - Luxury Property Rental`,
    description: propertyConfig.description,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/images/brand/logo.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}





