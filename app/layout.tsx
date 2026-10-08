import type { Metadata, Viewport } from 'next'
import { Josefin_Sans, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { propertyConfig } from '@/config/property'
import { getSiteUrl } from '@/lib/site'
import MobileBookingBar from '@/components/MobileBookingBar'
import ThemeProvider from '@/components/ThemeProvider'
import JsonLd from '@/components/JsonLd'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import AttributionCapture from '@/components/AttributionCapture'

const josefin = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-josefin',
  weight: ['300', '400', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const SEO_TITLE = 'Mornington Peninsula Beachfront Retreat | MAX Entertain'
const SEO_DESCRIPTION =
  'Award-winning beachfront retreat on the Mornington Peninsula. 6 bedrooms, heated pool & spa, home theatre, 10 m from beach. Book direct & save.'

// viewportFit: 'cover' exposes the device safe-area insets (notch, home bar)
// so we can pad content away from system UI on mobile.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f0f0d',
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords:
    'Mornington Peninsula beachfront retreat, luxury vacation rental, family holiday house, heated pool spa, Tootgarook accommodation, ' +
    'large group accommodation Mornington Peninsula, accommodation for 18 people, accommodation for 20 people, house that sleeps 20, ' +
    '6 bedroom holiday house Victoria, big holiday house near Melbourne, whole house rental large group, ' +
    'multi-generational family holiday, three generation family accommodation, extended family beach house, family reunion accommodation Victoria, ' +
    'Christmas holiday house Mornington Peninsula, school holidays beach house, milestone birthday accommodation, 50th birthday weekend house, ' +
    'wedding guest accommodation Mornington Peninsula, corporate retreat near Melbourne, team offsite accommodation Victoria, ' +
    'golf group accommodation Mornington Peninsula, Moonah Links accommodation, The Dunes Rye accommodation, ' +
    'holiday house with heated pool and spa, house with home theatre, house with games room, pet friendly large holiday house, ' +
    'Rye holiday house, Rosebud accommodation, Capel Sound holiday rental, near Peninsula Hot Springs accommodation, ' +
    'beach house Port Phillip Bay, luxury accommodation southern Mornington Peninsula',
  authors: [{ name: propertyConfig.name }],
  alternates: {
    canonical: '/',
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: '/',
    images: [{ url: '/opengraph-image', alt: 'MAX Entertain beachfront retreat exterior — Mornington Peninsula' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: ['/twitter-image'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const iconHref = encodeURI('/Airbnb picture/icons_files/Icon.png')
  const chatEnabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true'

  return (
    <html lang="en" className={`${josefin.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* Anti-flash: reads localStorage before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add('dark');localStorage.setItem('theme','dark')}catch(e){}})()`,
          }}
        />
        <link rel="icon" href={iconHref} type="image/png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
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
        <AttributionCapture />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:bg-luxury-gold focus:text-black focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: propertyConfig.name,
            url: getSiteUrl(),
          }}
        />
        <ThemeProvider>
          <div className="relative z-[1]">
            {children}
          </div>
        </ThemeProvider>
        <MobileBookingBar />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
