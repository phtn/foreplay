import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds } from '@/lib/firebase/server-session'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
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

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-orange-500/10 text-orange-700 dark:text-orange-200',
  payment_review: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  confirmed: 'bg-emerald-500/5 text-emerald-800 dark:text-emerald-300',
  cancelled: 'bg-destructive/10 text-destructive'
}

const formatStatus = (value: string | undefined) => {
  return (value ?? 'pending_payment')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

const Page = async ({ params }: PageProps) => {
  const [{ subscriptionId }, session] = await Promise.all([params, getVerifiedFirebaseSession()])

  if (!session) {
    return <SessionRequired />
  }

  const userIds = buildFirebaseSubscriptionUserIds(session.decodedToken)
  const typedSubscriptionId = subscriptionId as Id<'subscriptions'>
  const [subscription, registrations] = await Promise.all([
    fetchQuery(api.subscriptions.q.getByIdForUser, {
      subscriptionId: typedSubscriptionId,
      userIds
    }),
    fetchQuery(api.registrations.q.listBySubscriptionIdForUser, {
      subscriptionId: typedSubscriptionId,
      userIds
    })
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
          />
        ) : (
          <Card className='font-okx'>
            <CardHeader className=''>
              <p className='opacity-70 font-ios'>Entry ID: {subscriptionId}</p>
            </CardHeader>
            <CardContent>
              <p className='text-lg font-semibold'>Payment verification is currently under review. </p>
              <p className='opacity-70 flex items-center mt-2'>
                <Icon name='arrow-drop-down' className='size-6 -rotate-45 opacity-50' />
                <span>Estimated completion: within 24 hours.</span>
              </p>
            </CardContent>
          </Card>
        )}
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
