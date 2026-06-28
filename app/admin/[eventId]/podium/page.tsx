import { api } from '@/convex/_generated/api'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import { Metadata } from 'next'
import { PodiumTable } from './podium-table'

export const metadata: Metadata = {
  title: 'Podium',
  description: 'Tournament podium and awards',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}

interface PageProps {
  params: Promise<{ eventId: string }>
}

const Page = async ({ params }: PageProps) => {
  const [{ eventId }] = await Promise.all([params, requireAdminSession()])
  const [event, registrations, podiumAwards] = await Promise.all([
    fetchQuery(api.tournaments.q.getByTournamentId, { id: eventId }),
    fetchQuery(api.registrations.q.listByTournamentId, {
      tournamentId: eventId
    }),
    fetchQuery(api.podiumAwards.q.listByTournamentId, {
      tournamentId: eventId
    })
  ])

  return <PodiumTable eventId={eventId} eventName={event?.title} podiumAwards={podiumAwards} registrations={registrations} />
}

export default Page
