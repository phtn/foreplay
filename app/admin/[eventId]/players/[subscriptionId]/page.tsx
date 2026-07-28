import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RegistrationEditor, type RegistrationEditorEntry, type RegistrationEditorPlayer } from './registration-editor'

export const metadata: Metadata = {
  title: 'Edit Player Registration | Admin',
  description: 'Correct tournament entry and player registration details.'
}

interface RegistrationDetailsPageProps {
  params: Promise<{
    eventId: string
    subscriptionId: string
  }>
}

const nonEmpty = (value: string | undefined): value is string => Boolean(value?.trim())

export default async function RegistrationDetailsPage({ params }: RegistrationDetailsPageProps) {
  const [{ eventId, subscriptionId }] = await Promise.all([params, requireAdminSession()])
  const [event, details] = await Promise.all([
    fetchQuery(api.tournaments.q.getByTournamentId, { id: eventId }),
    fetchQuery(api.subscriptions.q.getRegistrationDetailsForAdmin, {
      subscriptionId,
      tournamentId: eventId
    })
  ])

  if (!event || !details) {
    notFound()
  }

  const reference = details.subscription.txn_ref_no ?? details.subscription.form_id ?? details.subscription._id
  const entry: RegistrationEditorEntry = {
    subscriptionId: details.subscription._id,
    teamName: details.subscription.team_name ?? '',
    contactEmail: details.subscription.contact_email ?? '',
    contactPhone: details.subscription.contact_phone ?? '',
    handicapIndex: details.subscription.handicap_index ?? '',
    division: details.subscription.division ?? ''
  }
  const players: RegistrationEditorPlayer[] = details.registrations
    .toSorted((left, right) => left._creationTime - right._creationTime)
    .map((registration) => ({
      registrationId: registration._id,
      playerName: registration.player_name,
      playerEmail: registration.player_email ?? '',
      playerPhone: registration.player_phone ?? '',
      handicapIndex: registration.handicap_index ?? '',
      division: registration.division ?? '',
      shirtSize: registration.shirt_size
    }))
  const divisionOptions = Array.from(
    new Set(
      [
        ...(event.divisions ?? []),
        details.subscription.division,
        ...details.registrations.map((registration) => registration.division)
      ].filter(nonEmpty)
    )
  )

  return (
    <main className='mx-auto w-full max-w-5xl space-y-5 px-2 py-5 pb-24 md:py-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='min-w-0 space-y-3'>
          <Link
            href={`/admin/${encodeURIComponent(eventId)}`}
            className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dotted dark:hover:decoration-sky-400 md:tracking-wider hover:text-sky-700 dark:hover:text-foreground'>
            <Icon
              name='chevron-right'
              className='size-4 rotate-90 -mb-0.5 text-sky-500 group-hover:text-sky-700 dark:group-hover:text-sky-300'
            />
            <span>Players</span>
          </Link>
          <div>
            <p className='font-ios text-[10px] uppercase tracking-widest text-sky-700 dark:text-sky-400'>
              {event.title}
            </p>
            <h1 className='truncate font-poly text-xl font-medium sm:text-2xl'>
              <span className='font-normal opacity-70'>Player</span> {entry.teamName}
            </h1>
          </div>
        </div>

        <Card size='sm' className='shrink-0 gap-0 rounded-xl py-0 sm:min-w-56'>
          <CardContent className='flex items-center justify-between gap-5'>
            <div>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Reference</p>
              <p className='font-mono text-sm font-medium'>{reference}</p>
            </div>
            <div className='text-right'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Players</p>
              <p className='font-poly text-lg'>{players.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <RegistrationEditor divisionOptions={divisionOptions} entry={entry} eventId={eventId} players={players} />
    </main>
  )
}
