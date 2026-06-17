import { RootProviders } from '@/ctx/root'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
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
  title: 'Foreplay PRO',
  description: 'Pro Web App'
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
