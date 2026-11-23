import ProtectedLayout from '@/ctx/protected'
import { formatRegistrationFee } from '@/utils/formatters'
import { Metadata } from 'next'
import { loadTournamentDetails, TourContent } from './content'

interface TPageProps {
  params: Promise<{ tourId: string }>
}

export async function generateMetadata({ params }: TPageProps): Promise<Metadata> {
  const { tourId } = await params
  const details = await loadTournamentDetails(tourId)
  const tournament = details?.event

  return {
    title: tournament ? `${tournament.title} | Tournament` : 'Tournament',
    description: tournament
      ? `${tournament.venue} • ${tournament.event_date} • ${formatRegistrationFee(tournament.registration_fee)}`
      : undefined,
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
