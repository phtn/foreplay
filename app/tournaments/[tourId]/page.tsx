import ProtectedLayout from '@/ctx/protected'
import { Metadata } from 'next'
import { findTournament } from '@/components/protected/tournament-experience'
import { TourContent } from './content'

interface TPageProps {
  params: Promise<{ tourId: string }>
}

export async function generateMetadata({ params }: TPageProps): Promise<Metadata> {
  const { tourId } = await params
  const tournament = findTournament(tourId)

  return {
    title: `${tournament.title} | Tournament`,
    description: `${tournament.venue} • ${tournament.dateLabel} • ${tournament.feeLabel}`,
    icons: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: '32x32',
        url: '/favicon-32x32.svg'
      }
    ]
  }
}

export default async function TPage({ params }: TPageProps) {
  const tourId = (await params).tourId
  return (
    <ProtectedLayout>
      <TourContent tourId={tourId} />
    </ProtectedLayout>
  )
}
