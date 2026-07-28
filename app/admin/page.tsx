import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Operational access for Foreplay administrators.'
}

export default async function AdminPage() {
  const fetchedEvents = await fetchQuery(api.tournaments.q.listTournaments)

  return (
    <main className='min-h-screen bg-background'>
      <Content events={fetchedEvents} />
    </main>
  )
}
