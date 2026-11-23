import { api } from '@/convex/_generated/api'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds } from '@/lib/firebase/server-session'
import { fetchQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import TourDetail from './details'
import { getTournamentRegistrationAction } from './registration-action'
import { Sponsors } from './sponsors'
import { SupportDetails } from './support-details'

interface TourContentProps {
  tourId: string
}

export const loadTournamentDetails = cache((id: string) => fetchQuery(api.tournaments.q.getForEditing, { id }))

export async function TourContent({ tourId }: TourContentProps) {
  const tournamentPromise = loadTournamentDetails(tourId)
  const registrationsPromise = getVerifiedFirebaseSession().then((session) => {
    if (!session) {
      return []
    }

    return fetchQuery(api.subscriptions.q.listByTournamentIdForUserIds, {
      tournamentId: tourId,
      userIds: buildFirebaseSubscriptionUserIds(session.decodedToken)
    })
  })
  const [tournamentDetails, registrations] = await Promise.all([tournamentPromise, registrationsPromise])

  if (!tournamentDetails?.event.id) {
    notFound()
  }

  const { event: tournament, ticketLogoUrl, coverPhotoUrl } = tournamentDetails
  const registrationAction = getTournamentRegistrationAction(tourId, registrations)

  return (
    <main>
      <TourDetail
        tournament={tournament}
        ticketLogoUrl={ticketLogoUrl}
        coverPhotoUrl={coverPhotoUrl}
        registrationAction={registrationAction}
      />
      <Sponsors sponsors={tournament.sponsor_list ?? []} />
      <SupportDetails support={tournament.support} />
    </main>
  )
}
