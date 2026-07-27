import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { statusStyles } from '@/lib/constants'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds } from '@/lib/firebase/server-session'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatEventDate, formatStatus } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cancelSubscription } from '../actions'
import { RegistrationSection } from './registration-section'

export const metadata: Metadata = {
  title: 'Subscription Details',
  description: 'Tournament subscription status and payment details.'
}

interface PageProps {
  params: Promise<{ subscriptionId: string }>
}

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className='space-y-1 rounded-lg border border-border/50 bg-muted/10 p-3 sm:border-0 sm:bg-transparent sm:p-0'>
    <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs'>{label}</p>
    <p className='wrap-break-word font-okx text-sm text-foreground/85'>{value || 'Not provided'}</p>
  </div>
)

const SessionRequired = () => (
  <section className='mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center'>
    <div className='flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
      <Icon name='lock' className='size-5' />
    </div>
    <div className='space-y-2'>
      <h1 className='font-poly text-2xl text-foreground'>Sign in required</h1>
      <p className='text-sm leading-6 text-muted-foreground'>
        Your session is no longer valid. Sign in again to view this entry.
      </p>
    </div>
    <Link href='/auth/login' className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}>
      Sign in
      <Icon name='chevron-right' className='size-4' />
    </Link>
  </section>
)

const SupportContactDetails = ({ support }: { support: Doc<'tournaments'>['support'] }) => {
  const name = support?.name?.trim()
  const title = support?.title?.trim()
  const email = support?.email?.trim()
  const phone = support?.phone?.trim()
  const hasSupportDetails = Boolean(name || title || email || phone)

  return (
    <aside aria-label='Organizer support' className='mt-5 rounded-lg bg-muted/60 p-4 font-okx'>
      <div className='flex items-start gap-3'>
        <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-sky-600'>
          <Icon name='service' className='size-6' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Organizer support</p>
          {hasSupportDetails ? (
            <div className='mt-2 space-y-2 text-sm'>
              {name || title ? (
                <div>
                  {name ? <p className='font-medium text-foreground capitalize'>{name}</p> : null}
                  {title ? <p className='font-ios text-xs text-muted-foreground'>{title}</p> : null}
                </div>
              ) : null}
              {email || phone ? (
                <address className='flex flex-col items-start gap-1.5 not-italic mt-1'>
                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      className='inline-flex min-w-0 items-center gap-2 text-foreground/80 hover:text-sky-600 hover:underline'>
                      <Icon name='mail' className='size-3.5 opacity-80' />
                      <span className='wrap-break-word min-w-0 font-ios'>{email}</span>
                    </a>
                  ) : null}
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      className='inline-flex items-center gap-2 text-foreground/80 hover:text-sky-600 hover:underline'>
                      <Icon name='phone-accept' className='size-3.5 opacity-80' />
                      <span className='font-ios tracking-wider'>{phone}</span>
                    </a>
                  ) : null}
                </address>
              ) : null}
            </div>
          ) : (
            <p className='mt-2 text-sm leading-5 text-muted-foreground'>
              Organizer support details are not available yet.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

const Page = async ({ params }: PageProps) => {
  const [{ subscriptionId }, session] = await Promise.all([params, getVerifiedFirebaseSession()])

  if (!session) {
    return <SessionRequired />
  }

  const userIds = buildFirebaseSubscriptionUserIds(session.decodedToken)
  const typedSubscriptionId = subscriptionId as Id<'subscriptions'>
  const subscriptionPromise = fetchQuery(api.subscriptions.q.getByIdForUser, {
    subscriptionId: typedSubscriptionId,
    userIds
  })
  const registrationsPromise = fetchQuery(api.registrations.q.listBySubscriptionIdForUser, {
    subscriptionId: typedSubscriptionId,
    userIds
  })
  const tournamentPromise = subscriptionPromise.then((subscription) => {
    const status = subscription?.status ?? 'pending_payment'
    if (!subscription || (status !== 'confirmed' && status !== 'payment_review' && status !== 'cancelled')) {
      return null
    }

    return fetchQuery(api.tournaments.q.getByTournamentId, { id: subscription.tournament_id })
  })
  const [subscription, registrations, tournament] = await Promise.all([
    subscriptionPromise,
    registrationsPromise,
    tournamentPromise
  ])

  if (!subscription) {
    notFound()
  }

  const status = subscription.status ?? 'pending_payment'
  const maxEntries = Math.max(1, Number.parseInt(subscription.total_players, 10) || 1)
  const canCancel =
    status !== 'cancelled' &&
    status !== 'confirmed' &&
    subscription.payment_status !== 'paid' &&
    subscription.status !== 'payment_review'

  return (
    <div className='space-y-4 md:space-y-8'>
      <div className='flex gap-4 items-end sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-2 md:space-y-6 w-full'>
          <Link
            href='/subscriptions'
            prefetch='auto'
            className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dashed md:tracking-wider hover:text-sky-600'>
            <Icon name='chevron-down' className='size-4 rotate-45 text-sky-500 group-hover:text-sky-600' />
            Entries
          </Link>
          <div className='flex items-center space-x-4 w-full'>
            <h1 className='font-okx font-semibold text-xl leading-tight md:text-2xl space-x-2 whitespace-nowrap overflow-hidden'>
              <span className=''>{subscription.tournament_name}</span>
            </h1>
            <span className='hidden md:flex opacity-50 font-ios text-base uppercase tracking-widest'>
              {subscription.txn_ref_no}
            </span>
          </div>
        </div>
        <div className='flex items-center gap-2 sm:justify-end whitespace-nowrap'>
          <span className='inline-flex w-fit rounded-md bg-muted px-3 py-1.5 font-ios text-xs uppercase tracking-wider text-foreground'>
            {subscription.total_players} Entries
          </span>
          <span
            className={`inline-flex w-fit rounded-md px-3 py-1.5 font-ios text-xs uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
            {formatStatus(status)}
          </span>
        </div>
      </div>
      {status === 'confirmed' ? (
        <RegistrationSection
          subscriptionId={typedSubscriptionId}
          registrations={registrations}
          maxEntries={maxEntries}
          defaultDivision={subscription.division}
          eventDate={tournament ? formatEventDate(tournament.gate_open_at, tournament.event_date) : 'Date TBA'}
          eventSupportPhone={tournament?.support?.phone}
          tournamentName={subscription.tournament_name}
          venue={tournament?.venue ?? 'Venue TBA'}
        />
      ) : status === 'payment_review' ? (
        <Card className='font-okx'>
          <CardHeader className='border-b border-border/50 border-dashed'>
            <p className='font-ios text-muted-foreground'>Entry ID: {subscriptionId}</p>
          </CardHeader>
          <CardContent>
            <div className='text-lg font-medium'>
              <div className='flex items-center space-x-2'>
                <Icon name='circle-dash-line' className='size-4.5 text-sky-600' />
                <p>Payment verification is currently under review.</p>
              </div>
              <div className='flex items-center text-sm mt-2'>
                <Icon name='arrow-drop-down' className='size-6 -rotate-45 opacity-60' />
                <span className='text-muted-foreground font-ios'>Estimated completion: within 24 hours</span>
              </div>
            </div>
            <SupportContactDetails support={tournament?.support} />
          </CardContent>
          <CardFooter className='border-t border-border/50 border-dashed'>
            <div className='flex items-center text-xs space-x-1'>
              <Icon name='clock' className='size-3.5 opacity-60' />
              <span className='text-muted-foreground font-ios'>
                Last updated: {formatEventDate(subscription.updatedAt ?? 0, '')}
              </span>
            </div>
          </CardFooter>
        </Card>
      ) : status === 'cancelled' ? (
        <Card className='font-okx'>
          <CardHeader className=' border-b border-border/50 border-dashed'>
            <p className='font-ios text-muted-foreground'>Entry ID: {subscriptionId}</p>
          </CardHeader>
          <CardContent>
            <div className='text-lg font-medium'>
              <div className='flex items-center space-x-2'>
                <Icon name='alert-triangle' className='size-5 text-rose-600' />
                <p>Your entry has been cancelled by the organizer.</p>
              </div>
            </div>
            <SupportContactDetails support={tournament?.support} />
          </CardContent>
          <CardFooter className='border-t border-border/50 border-dashed'>
            <div className='flex items-center text-xs space-x-1'>
              <Icon name='clock' className='size-3.5 opacity-60' />
              <span className='text-muted-foreground font-ios'>
                Last updated: {formatEventDate(subscription.updatedAt ?? 0, '')}
              </span>
            </div>
          </CardFooter>
        </Card>
      ) : null}
      <div className='hidden _grid gap-5 lg:grid-cols-[1.1fr_0.9fr]'>
        <Card className='rounded-xl border-border/70'>
          <CardHeader className='px-4 sm:px-6'>
            <CardTitle className='text-xl'>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6'>
            <DetailRow label='Team name' value={subscription.team_name} />
            <DetailRow label='Division' value={subscription.division} />
            <DetailRow label='Players' value={subscription.total_players} />
            <DetailRow label='Checked in' value={subscription.total_checked_in} />
            <DetailRow label='Handicap' value={subscription.handicap_index} />
            <DetailRow label='Tournament ID' value={subscription.tournament_id} />
          </CardContent>
        </Card>

        <Card className='rounded-xl border-border/70'>
          <CardHeader className='px-4 sm:px-6'>
            <CardTitle className='text-xl'>Contact</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3 px-4 sm:px-6'>
            <DetailRow label='Email' value={subscription.contact_email} />
            <DetailRow label='Phone' value={subscription.contact_phone} />
          </CardContent>
        </Card>

        <Card className='rounded-xl border-border/70'>
          <CardHeader className='px-4 sm:px-6'>
            <CardTitle className='text-xl'>Payment</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6'>
            <DetailRow label='Payment status' value={formatStatus(subscription.payment_status)} />
            <DetailRow label='Transaction reference' value={subscription.txn_ref_no} />
            <DetailRow label='QR payload' value={subscription.payment_qrcode ? 'Stored' : 'Not stored'} />
            <DetailRow label='Receipt storage ID' value={subscription.receipt_image_url} />
          </CardContent>
        </Card>

        <Card className='rounded-xl border-border/70'>
          <CardHeader className='px-4 sm:px-6'>
            <CardTitle className='text-xl'>Next Step</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 px-4 sm:px-6'>
            <p className='text-sm text-muted-foreground'>
              {status === 'payment_review'
                ? 'Your receipt is uploaded and waiting for manual verification.'
                : status === 'pending_payment'
                  ? 'Upload your payment receipt from the entry payment step to start verification.'
                  : status === 'cancelled'
                    ? 'This subscription has been cancelled.'
                    : 'No action is required right now.'}
            </p>
            <div className='grid gap-2'>
              {/*{status !== 'cancelled' ? (
                  <Link
                    href={`/tournaments/${subscription.tournament_id}/entry?formId=${subscription.form_id ?? subscription.txn_ref_no ?? ''}`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}>
                    Open entry payment
                  </Link>
                ) : null}*/}

              <form action={undefined}>
                <input type='hidden' name='subscriptionId' value={subscription._id} />
                <Button
                  type='submit'
                  size='lg'
                  className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center bg-foreground')}>
                  Check for updates
                </Button>
              </form>

              {canCancel ? (
                <form action={cancelSubscription}>
                  <input type='hidden' name='subscriptionId' value={subscription._id} />
                  <button
                    type='submit'
                    className={cn(buttonVariants({ variant: 'destructive' }), 'w-full justify-center')}>
                    Cancel subscription
                  </button>
                </form>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Page
