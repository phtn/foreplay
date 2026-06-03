import ProtectedLayout from '@/ctx/protected'
import { Metadata } from 'next'
import { TourContent } from './content'

export const metadata: Metadata = {
  title: 'Tournament',
  description: 'tid',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}

interface TPageProps {
  params: Promise<{ tourId: string }>
}

export default async function TPage({ params }: TPageProps) {
  const tourId = (await params).tourId
  return (
    <ProtectedLayout>
      <TourContent tourId={tourId} />
    </ProtectedLayout>
  )
}
