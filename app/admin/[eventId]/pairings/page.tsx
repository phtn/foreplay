import { api } from '@/convex/_generated/api'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import { Metadata } from 'next'
import { PairingsTable } from './pairings-table'

export const metadata: Metadata = {
  title: 'title',
  description: 'description',
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
  const registrations = await fetchQuery(api.registrations.q.listByTournamentId, {
    tournamentId: eventId
  })

  return (
    <>
      <PairingsTable eventId={eventId} registrations={registrations} />
    </>
  )
}
export default Page
