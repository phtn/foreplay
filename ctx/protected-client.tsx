'use client'

import { PropsWithChildren } from 'react'

import { TopbarWithGoogleOneTap } from '@/components/one-tap'

export default function ProtectedClient({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen bg-background'>
      <TopbarWithGoogleOneTap />
      <main className='mx-auto max-w-7xl px-3 pb-4 sm:px-4 sm:py-6 md:px-6'>{children}</main>
    </div>
  )
}
