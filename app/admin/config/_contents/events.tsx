import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import { Content } from '../../content'

export const EventsContent = async () => {
  const fetchedEvents = await fetchQuery(api.tournaments.q.listTournaments)
  return <Content events={fetchedEvents} />
}
