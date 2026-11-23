import ProtectedLayout from '@/ctx/protected'

import { TournamentHero } from '@/components/protected/tournament-experience'
import { api } from '@/convex/_generated/api'
import { formatEventDate, formatGateOpenTime } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import { connection } from 'next/server'
import { UpcomingTournaments } from './upcoming-tournaments'

async function loadTournamentOverview() {
  await connection()
  const tournaments = await fetchQuery(api.tournaments.q.listTournaments)
  const published = tournaments.flatMap((tournament) =>
    tournament.id && tournament.published !== false ? [{ ...tournament, id: tournament.id }] : []
  )
  // Convex returns these records in creation order. Publication has no timestamp.
  const featuredTournament = published.at(-1)
  const now = Date.now()
  const upcoming = published
    .filter(
      (tournament) =>
        tournament._id !== featuredTournament?._id &&
        Number.isFinite(tournament.gate_open_at) &&
        tournament.gate_open_at >= now
    )
    .sort((left, right) => left.gate_open_at - right.gate_open_at)
  const assets =
    featuredTournament && (featuredTournament.ticket_logo_url || featuredTournament.cover_photo_url)
      ? await fetchQuery(api.tournaments.q.getForEditing, { id: featuredTournament.id })
      : null

  return { featuredTournament, upcoming, assets }
}

export default async function TournamentsPage() {
  const { featuredTournament, upcoming, assets } = await loadTournamentOverview()

  return (
    <ProtectedLayout>
      <div className='space-y-4 md:space-y-8'>
        {featuredTournament ? (
          <TournamentHero
            eyebrow='Featured Tournament'
            title={featuredTournament.title}
            description={featuredTournament.description}
            venueLabel={featuredTournament.venue}
            primaryHref={`/tournaments/${encodeURIComponent(featuredTournament.id)}`}
            primaryLabel='View Tournament'
            heroLogoSrc={assets?.ticketLogoUrl}
            coverPhotoSrc={assets?.coverPhotoUrl}
            teeTimeLabel={
              Number.isFinite(featuredTournament.gate_open_at)
                ? `${formatEventDate(featuredTournament.gate_open_at, featuredTournament.event_date)} at ${formatGateOpenTime(featuredTournament.gate_open_at)}`
                : featuredTournament.event_date
            }
          />
        ) : null}

        <UpcomingTournaments upcoming={upcoming} />
      </div>
    </ProtectedLayout>
  )
}
