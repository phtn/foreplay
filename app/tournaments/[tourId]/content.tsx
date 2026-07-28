import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
import TourDetail from './details'
import { Sponsors } from './sponsors'
import { SupportDetails } from './support-details'

interface TourContentProps {
  tourId: string
}

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
