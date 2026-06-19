import { RootProviders } from '@/ctx/root'
import { cn } from '@/lib/utils'
import type { Metadata, Viewport } from 'next'
import { Figtree, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: {
    default: 'Foreplay PRO',
    template: '%s ・ Foreplay'
  },
  description: 'Host events and tournaments.',
  keywords: ['golf', 'tournaments', 'events', 'tickets', 'games', 'fairway'],
  authors: [{ name: 'xpriori' }, { name: 'quimpoi' }],
  creator: 're-up.ph',
  publisher: 're-up.ph',
  applicationName: 'Foreplay PRO',
  appleWebApp: {
    capable: true,
    title: 'Foreplay PRO',
    statusBarStyle: 'default'
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL('https://foreplay.pro'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Foreplay PRO',
    description: 'Host events and tournaments.',
    type: 'website',
    url: 'https://foreplay.pro',
    siteName: 'Foreplay PRO',
    images: [
      {
        url: '/fp-og.webp',
        width: 2700,
        height: 2070,
        alt: 'Foreplay PRO'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foreplay PRO',
    description: 'Host events and tournaments.',
    images: [
      {
        url: '/fp-x-og.webp',
        width: 2700,
        height: 2070,
        alt: 'Foreplay PRO'
      }
    ]
  },
  icons: [
    {
      rel: 'icon',
      url: '/apple-icon.png',
      sizes: '180x180'
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-icon.png'
    }
  ],

  referrer: 'strict-origin-when-cross-origin'
}

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={cn('h-full', 'antialiased', geistSans.variable, geistMono.variable, 'font-sans', figtree.variable)}>
      <body className='min-h-full flex flex-col'>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
