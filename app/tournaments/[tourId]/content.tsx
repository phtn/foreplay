import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
import TourDetail from './details'
import { Sponsors } from './sponsors'
import { SupportDetails } from './support-details'

interface TourContentProps {
  tourId: string
}

// const courseStats = [
//   { label: 'HOLES', value: '18', unit: '' },
//   { label: 'PAR', value: '72', unit: '' },
//   { label: 'START', value: '7AM', unit: '' },
//   { label: '^', value: 'N', unit: '' }
// ]

export async function TourContent({ tourId }: TourContentProps) {
  const tournament = await fetchQuery(api.tournaments.q.getByTournamentId, { id: tourId })

  if (!tournament?.id) {
    notFound()
  }

  return (
    <main>
      <TourDetail tournament={tournament} />
      <Sponsors sponsors={tournament.sponsor_list ?? []} />
      <SupportDetails support={tournament.support} />
    </main>
  )
}
