import ProtectedLayout from '@/ctx/protected'

import { featuredTournament, TournamentHero } from '@/components/protected/tournament-experience'
import { UpcomingTournaments } from './upcoming-tournaments'

export default function TournamentsPage() {
  return (
    <ProtectedLayout>
      <div className='space-y-4 md:space-y-8'>
        <TournamentHero
          eyebrow='Open Entry'
          title={featuredTournament.title}
          description={featuredTournament.description}
          venueLabel={featuredTournament.venue}
          primaryHref={`/tournaments/${featuredTournament.id}`}
          primaryLabel='View Tournament'
          secondaryLabel=''
          teeTimeAt={featuredTournament.teeTimeAt}
          teeTimeLabel={featuredTournament.teeTimeLabel}
          prizes={featuredTournament.prizes}
          events={featuredTournament.events}
          specialGuests={featuredTournament.specialGuests}
          metrics={[
            { label: 'Fields live', value: '3', icon: 'flag-line' },
            { label: 'Entry window', value: '48h', icon: 'lock' },
            { label: 'Players queued', value: '132', icon: 'golf-flag' }
          ]}
        />

        <UpcomingTournaments />
      </div>
    </ProtectedLayout>
  )
}
