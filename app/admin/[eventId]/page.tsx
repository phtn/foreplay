import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { fetchQuery } from 'convex/nextjs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { confirmSubscription } from './actions'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeZone: 'Asia/Manila'
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila'
})

const createdAtFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

const subscriptionStatusStyles: Record<string, string> = {
  pending_payment: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  payment_review: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-destructive/10 text-destructive'
}

const paymentStatusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
}

function formatEventDate(timestamp: number, fallback: string) {
  return fallback || dateFormatter.format(new Date(timestamp))
}

function formatGateOpenTime(timestamp: number) {
  return timeFormatter.format(new Date(timestamp))
}

function formatCreatedAt(timestamp: number) {
  return createdAtFormatter.format(timestamp)
}

function formatRegistrationFee(value: number) {
  if (value <= 0) {
    return 'Sponsor-driven event'
  }

  return pesoFormatter.format(value)
}

function formatSlotsLabel(registeredSlots: number, slotsLimit?: number) {
  if (slotsLimit) {
    return `${registeredSlots}/${slotsLimit}`
  }

  return `${registeredSlots}`
}

function getPublicationLabel(published: boolean | undefined) {
  return published === false ? 'Draft' : 'Published'
}

function formatCommission(type: string, value?: number) {
  if (value === undefined) {
    return 'Not configured'
  }

  return `${type} · ${value}`
}

function formatStatus(value: string | undefined) {
  return (value ?? 'pending_payment')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='font-okx text-sm text-foreground/85'>{value}</p>
    </div>
  )
}

export default async function EventPage({ params }: EventPageProps) {
  const [{ eventId }] = await Promise.all([params, requireAdminSession()])
  const [event, subscriptions] = await Promise.all([
    fetchQuery(api.tournaments.q.getByTournamentId, { id: eventId }),
    fetchQuery(api.subscriptions.q.listByTournamentId, { tournamentId: eventId })
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
  // const sponsorshipTiers = event.sponsorship_tiers ?? []

  return (
    <main className='space-y-8 px-2'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-4 mt-4 md:mt-0'>
          <Link
            href='/admin'
            className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'>
            <Icon name='arrow-left' className='size-4' />
            Events
          </Link>

          <div className='space-y-2'>
            <h1 className='font-heading text-3xl font-bold tracking-tight'>{event.title}</h1>
          </div>
        </div>

        {/*<div className='flex flex-wrap gap-3'>
          {publicHref ? (
            <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={publicHref}>
              Public page
            </Link>
          ) : null}

          {entryHref ? (
            <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={entryHref}>
              Entry flow
            </Link>
          ) : null}

          {sponsorshipHref ? (
            <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href={sponsorshipHref}>
              Sponsor page
              <Icon name='arrow-right' className='size-4' />
            </Link>
          ) : null}
        </div>*/}
      </div>

      <div className='grid gap-4 grid-cols-4'>
        {[
          { label: 'Date', value: eventDateLabel },
          { label: 'Gate open', value: gateOpenTimeLabel },
          { label: 'Entry fee', value: formatRegistrationFee(event.registration_fee) },
          { label: 'Slots', value: slotsLabel }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='border-border/1 bg-border/10 p-0! rounded-xs md:rounded-lg'>
            <CardContent className='space-y-1 md:p-2'>
              <p className='font-ios text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground'>
                {stat.label}
              </p>
              <p className='font-heading text-sm md:text-base font-semibold'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EventSubscriptions eventId={eventId} subscriptions={subscriptions} />

      <EventDetails event={event} />
    </main>
  )
}

interface EventSubscriptionsProps {
  eventId: string
  subscriptions: Doc<'subscriptions'>[]
}

const EventSubscriptions = ({ eventId, subscriptions }: EventSubscriptionsProps) => {
  const counts = subscriptions.reduce(
    (acc, subscription) => {
      const status = subscription.status ?? 'pending_payment'
      acc.total += 1

      if (status === 'payment_review') {
        acc.review += 1
      } else if (status === 'cancelled') {
        acc.cancelled += 1
      } else if (subscription.payment_status === 'paid' || status === 'confirmed') {
        acc.confirmed += 1
      } else {
        acc.pending += 1
      }

      return acc
    },
    { total: 0, pending: 0, review: 0, confirmed: 0, cancelled: 0 }
  )

  return (
    <Card className='border-border/70 bg-slate-400/10 dark:bg-slate-400/20'>
      <CardHeader>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-1'>
            <CardTitle className='font-okx text-xl'>Entries</CardTitle>
            <p className='text-sm text-muted-foreground'>
              Entry requests, payment state, and receipt workflow for this event.
            </p>
          </div>

          <div className='grid grid-cols-5 gap-2 sm:grid-cols-5'>
            {[
              { label: 'Total', value: counts.total },
              { label: 'Pending', value: counts.pending },
              { label: 'Review', value: counts.review },
              { label: 'Confirmed', value: counts.confirmed },
              { label: 'Cancelled', value: counts.cancelled }
            ].map((stat) => (
              <div
                key={stat.label}
                className='rounded-lg md:rounded-xl border border-border/60 bg-muted/0 px-1.5 md:px-3 md:py-2 py-1'>
                <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{stat.label}</p>
                <p className='mt-1 font-heading text-lg font-semibold'>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-0 bg-slate-400/15 dark:bg-slate-600/10'>
        {subscriptions.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-245 text-sm'>
              <thead>
                <tr className='border-y border-border/50 bg-muted/20 text-left whitespace-nowrap'>
                  {[
                    'Reference',
                    'Team',
                    'Entries',
                    'Amount (₱)',
                    'Payment',
                    'Receipt',
                    'Status',
                    'Created',
                    'Action'
                  ].map((label) => (
                    <th
                      key={label}
                      className='px-6 py-3 font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => {
                  const status = subscription.status ?? 'pending_payment'

                  return (
                    <tr key={subscription._id} className='border-b border-border/60 align-top'>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <p className='font-okx text-foreground/90'>
                            {subscription.txn_ref_no ?? subscription.form_id ?? subscription._id}
                          </p>
                          <p className='text-xs text-muted-foreground'>{subscription.contact_email ?? 'No email'}</p>
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='space-y-1'>
                          <p className='font-okx text-foreground/90'>{subscription.team_name ?? 'Team pending'}</p>
                          <p className='text-xs text-muted-foreground'>{subscription.contact_phone ?? 'No phone'}</p>
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='space-y-1'>
                          <p className='text-foreground/85'>{subscription.total_players} entries</p>
                          <p className='text-xs text-muted-foreground'>{subscription.total_checked_in} checked in</p>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-foreground/85'>{subscription.payment_amount?.toLocaleString()}</td>
                      <td className='px-5 py-4'>
                        <div className='space-y-2'>
                          <span
                            className={cn(
                              'inline-flex rounded-sm px-1.5 py-1 font-ios text-[10px] uppercase tracking-widest',
                              paymentStatusStyles[subscription.payment_status] ?? paymentStatusStyles.pending
                            )}>
                            {formatStatus(subscription.payment_status)}
                          </span>
                        </div>
                      </td>

                      <td className='px-6 py-4 text-muted-foreground text-xs'>
                        {subscription.receipt_image_url ? 'View' : 'N/A'}
                      </td>

                      <td className='px-4 py-4'>
                        <span
                          className={cn(
                            'inline-flex rounded-sm px-1.5 py-1 font-ios text-[10px] uppercase tracking-widest whitespace-nowrap',
                            subscriptionStatusStyles[status] ?? subscriptionStatusStyles.pending_payment
                          )}>
                          {formatStatus(status)}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-muted-foreground text-xs'>
                        {formatCreatedAt(subscription._creationTime)}
                      </td>
                      <td className='px-6 py-4 text-xs'>
                        {status === 'confirmed' && subscription.payment_status === 'paid' ? (
                          <span className='text-emerald-700 dark:text-emerald-300'>Confirmed</span>
                        ) : (
                          <form action={confirmSubscription}>
                            <input type='hidden' name='subscriptionId' value={subscription._id} />
                            <input type='hidden' name='eventId' value={eventId} />
                            <button type='submit' className='text-sky-700 transition-colors hover:text-sky-600'>
                              Confirm
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='flex min-h-44 flex-col items-center justify-center gap-3 p-8 text-center'>
            <Icon name='ticket' className='size-10 text-muted-foreground/50' />
            <div className='space-y-1'>
              <p className='font-okx text-base'>No subscriptions yet</p>
              <p className='text-sm text-muted-foreground'>This event does not have any entry requests yet.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={item.href}>
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
