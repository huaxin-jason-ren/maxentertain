import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { propertyConfig } from '@/config/property'
import { getSiteUrl } from '@/lib/site'

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
  metadataBase: new URL(getSiteUrl()),
  title: `${propertyConfig.name} - Luxury Property Rental`,
  description: propertyConfig.description,
  keywords: 'luxury rental, vacation rental, property rental, luxury accommodation',
  authors: [{ name: propertyConfig.name }],
  openGraph: {
    title: `${propertyConfig.name} - Luxury Property Rental`,
    description: propertyConfig.description,
    type: 'website',
    url: '/',
    images: [{ url: '/opengraph-image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${propertyConfig.name} - Luxury Property Rental`,
    description: propertyConfig.description,
    images: ['/twitter-image'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const iconHref = encodeURI('/Airbnb picture/icons_files/Icon.png')

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href={iconHref} type="image/png" />
        <link rel="icon" href="/favicon.ico" />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17899499107"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17899499107');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}





