import { RootProviders } from '@/ctx/root'
import { getInitialFirebaseAuthState } from '@/lib/firebase/server-auth'
import { THEME_SCRIPT } from '@/lib/theme'
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
      rel: 'icon',
      url: '/192.png',
      sizes: '192x192'
    },
    {
      rel: 'icon',
      url: '/512.png',
      sizes: '512x512'
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

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialAuthState = await getInitialFirebaseAuthState()

  return (
    <html
      lang='en'
      data-theme='light'
      data-theme-preference='light'
      suppressHydrationWarning
      style={{ colorScheme: 'light' }}
      className={cn(
        'h-full',
        'light',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        figtree.variable
      )}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className='min-h-full flex flex-col'>
        <RootProviders initialAuthState={initialAuthState}>{children}</RootProviders>
      </body>
    </html>
  )
}
