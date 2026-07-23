import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import {
  toRegistrationTicketData,
  type RegistrationTicketData
} from '@/lib/tickets/registration-ticket'
import {
  formatCommission,
  formatEventDate,
  formatGateOpenTime,
  formatRegistrationFee,
  formatSlotsLabel,
  getPublicationLabel
} from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  type EventSubscriptionTableRow,
  PlayersDataTable
} from './players-data-table'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='font-okx text-sm text-foreground/85'>{value}</p>
    </div>
  )
}

const toCount = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : 0
}

export default async function EventPage({ params }: EventPageProps) {
  const [{ eventId }] = await Promise.all([params, requireAdminSession()])
  const [event, subscriptions, registrations] = await Promise.all([
    fetchQuery(api.tournaments.q.getByTournamentId, { id: eventId }),
    fetchQuery(api.subscriptions.q.listByTournamentId, { tournamentId: eventId }),
    fetchQuery(api.registrations.q.listByTournamentId, {
      tournamentId: eventId
    })
  ])

  if (!event) {
    notFound()
  }

  // const publicHref = event.id ? `/tournaments/${event.id}` : null
  // const entryHref = event.id ? `/tournaments/${event.id}/entry` : null
  // const sponsorshipHref = event.id ? `/tournaments/${event.id}/sponsorship` : null
  const eventDateLabel = formatEventDate(event.gate_open_at, event.event_date)
  const gateOpenTimeLabel = formatGateOpenTime(event.gate_open_at)
  const slotsLabel = formatSlotsLabel(event.registered_slots, event.slots_limit)
  const ticketsBySubscription = new Map<
    string,
    RegistrationTicketData[]
  >()

  for (const registration of registrations) {
    if (!registration.subscription_id) continue

    const tickets =
      ticketsBySubscription.get(registration.subscription_id) ?? []
    tickets.push(
      toRegistrationTicketData(
        registration,
        `Player ${tickets.length + 1}`
      )
    )
    ticketsBySubscription.set(registration.subscription_id, tickets)
  }

  const playerRows: EventSubscriptionTableRow[] = subscriptions.map(
    (subscription) => ({
      subscriptionId: subscription._id,
      createdAt: subscription._creationTime,
      reference:
        subscription.txn_ref_no ??
        subscription.form_id ??
        subscription._id,
      contactEmail: subscription.contact_email ?? null,
      teamName: subscription.team_name ?? 'Team pending',
      totalPlayers: toCount(subscription.total_players),
      totalCheckedIn: toCount(subscription.total_checked_in),
      paymentAmount: subscription.payment_amount ?? null,
      paymentStatus: subscription.payment_status,
      subscriptionStatus:
        subscription.status ?? 'pending_payment',
      confirmer:
        subscription.confirmed_by_name ??
        subscription.confirmed_by_email ??
        subscription.confirmed_by_id ??
        null,
      confirmedAt: subscription.confirmed_at ?? null,
      receiptUrl: subscription.receiptImageUrl,
      canUndo: Boolean(subscription.admin_status_change_id),
      tickets:
        ticketsBySubscription.get(subscription._id) ?? [],
      adminRemarks: subscription.admin_remarks ?? ''
    })
  )
  // const sponsorshipTiers = event.sponsorship_tiers ?? []

  return (
    <main className='space-y-0 md:space-y-4'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between px-4 pb-2 md:pb-0'>
        <div className='space-y-4 mt-4 md:mt-0 w-full'>
          <Link
            href='/admin'
            prefetch='auto'
            className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dashed md:tracking-wider hover:text-sky-600'>
            <Icon name='chevron-down' className='size-4 rotate-45 text-sky-500 group-hover:text-sky-600' />
            Events
          </Link>

          <div className='space-y-2 w-full flex items-center justify-between'>
            <h1 className='font-poly font-medium text-xl md:text-xl'>{event.title}</h1>
            <Link href={`/admin/${eventId}/pairings`} className='flex items-center space-x-1 md:space-x-2'>
              <span className='font-poly flex items-center gap-1'>Pairings</span>
              <Icon name='document' className='size-4 opacity-80' />
            </Link>
          </div>
        </div>
      </div>

      <div className='grid gap-0 md:gap-4 grid-cols-4 px-4'>
        {[
          { label: 'Date', value: eventDateLabel },
          { label: 'Gate open', value: gateOpenTimeLabel },
          { label: 'Entry fee', value: formatRegistrationFee(event.registration_fee) },
          { label: 'Slots', value: slotsLabel }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='border-[0.33px] py-1! rounded-xs md:rounded-lg'>
            <CardContent className='space-y-1 ps-3! pe-0!'>
              <p className='font-ios text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground'>
                {stat.label}
              </p>
              <p className='font-heading text-base font-bold'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlayersDataTable eventId={eventId} rows={playerRows} />

      <EventDetails event={event} />
    </main>
  )
}

interface EventDetailsProps {
  event: Doc<'tournaments'>
}
const EventDetails = ({ event }: EventDetailsProps) => {
  const publishedLabel = getPublicationLabel(event.published)
  const overviewFacts = event.overview_facts ?? []
  const divisions = event.divisions ?? []
  const publicHref = event.id ? `/tournaments/${event.id}` : null
  const entryHref = event.id ? `/tournaments/${event.id}/entry` : null
  const sponsorshipHref = event.id ? `/tournaments/${event.id}/sponsorship` : null
  const eventDateLabel = formatEventDate(event.gate_open_at, event.event_date)
  const gateOpenTimeLabel = formatGateOpenTime(event.gate_open_at)
  const slotsLabel = formatSlotsLabel(event.registered_slots, event.slots_limit)
  const sponsorshipTiers = event.sponsorship_tiers ?? []

  return (
    <div className='grid gap-5 lg:grid-cols-[1.1fr_0.9fr]'>
      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Event setup</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-5 sm:grid-cols-2'>
          <DetailRow label='Public event ID' value={event.id ?? 'Missing'} />
          <DetailRow label='Document ID' value={event._id} />
          <DetailRow label='Venue' value={event.venue} />
          <DetailRow label='Event date' value={eventDateLabel} />
          <DetailRow label='Gate open' value={gateOpenTimeLabel} />
          <DetailRow label='Publication' value={publishedLabel} />
          <DetailRow label='Field size' value={slotsLabel} />
          <DetailRow label='Registered slots' value={String(event.registered_slots)} />
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Commercial</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-5 sm:grid-cols-2'>
          <DetailRow label='Entry fee' value={formatRegistrationFee(event.registration_fee)} />
          <DetailRow label='Commission' value={formatCommission(event.commission_type, event.commission_value)} />
          <DetailRow label='Sponsor phone' value={event.sponsor_contact_phone ?? 'Not provided'} />
          <DetailRow label='Sponsor email' value={event.sponsor_contact_email ?? 'Not provided'} />
          <DetailRow label='Primary color' value={event.ticket_primary_color ?? 'Not set'} />
          <DetailRow label='Secondary color' value={event.ticket_secondary_color ?? 'Not set'} />
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Description</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm leading-7 text-muted-foreground'>
            {event.description ?? 'No event description has been added yet.'}
          </p>

          {event.bank_details_text ? (
            <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
              <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Payment instructions</p>
              <p className='mt-2 text-sm leading-6 text-foreground/80'>{event.bank_details_text}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Player-facing routes</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[
            { label: 'Public event page', href: publicHref },
            { label: 'Entry page', href: entryHref },
            { label: 'Sponsorship page', href: sponsorshipHref }
          ].map((item) => (
            <div
              key={item.label}
              className='flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4'>
              <div>
                <p className='font-okx text-sm text-foreground/85'>{item.label}</p>
                <p className='mt-1 text-xs text-muted-foreground'>{item.href ?? 'Unavailable until event ID is set'}</p>
              </div>

              {item.href ? (
                <Link className={buttonVariants({ variant: 'default', size: 'sm' })} href={item.href}>
                  Open
                </Link>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Divisions</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          {divisions.length ? (
            divisions.map((division) => (
              <Badge key={division} variant='outline' size='xl' radius='full'>
                {division}
              </Badge>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>No divisions configured.</p>
          )}
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='text-xl'>Overview facts</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {overviewFacts.length ? (
            overviewFacts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{fact.label}</p>
                <p className='mt-2 text-sm text-foreground/85'>{fact.value}</p>
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>No overview facts configured.</p>
          )}
        </CardContent>
      </Card>

      <Card className='border-border/70 lg:col-span-2'>
        <CardHeader>
          <CardTitle className='text-xl'>Sponsorship tiers</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {sponsorshipTiers.length ? (
            sponsorshipTiers.map((tier) => (
              <div key={tier.name} className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-okx text-sm text-foreground/85'>{tier.name}</p>
                    <p className='mt-1 text-xs text-muted-foreground'>{tier.playing_access}</p>
                  </div>
                  <Badge variant='secondary' size='lg' radius='full'>
                    {tier.investment_label}
                  </Badge>
                </div>

                {tier.access_note ? <p className='mt-3 text-sm text-muted-foreground'>{tier.access_note}</p> : null}

                <div className='mt-4 space-y-2'>
                  {tier.benefits.map((benefit) => (
                    <div key={benefit} className='flex items-start gap-2 text-sm text-foreground/80'>
                      <Icon name='check' className='mt-0.5 size-4 text-primary' />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>No sponsorship tiers configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
