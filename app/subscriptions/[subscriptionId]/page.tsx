import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import ProtectedLayout from '@/ctx/protected'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseTokenIdentifier } from '@/lib/firebase/server-session'
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
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-destructive/10 text-destructive'
}

const formatStatus = (value: string | undefined) => {
  return (value ?? 'pending_payment')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className='space-y-1'>
    <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{label}</p>
    <p className='font-okx text-sm text-foreground/85'>{value || 'Not provided'}</p>
  </div>
)

const Page = async ({ params }: PageProps) => {
  const [{ subscriptionId }, session] = await Promise.all([params, getVerifiedFirebaseSession()])

  if (!session) {
    notFound()
  }

  const userId = buildFirebaseTokenIdentifier(session.decodedToken)
  const typedSubscriptionId = subscriptionId as Id<'subscriptions'>
  const [subscription, registrations] = await Promise.all([
    fetchQuery(api.subscriptions.q.getByIdForUser, {
      subscriptionId: typedSubscriptionId,
      userId
    }),
    fetchQuery(api.registrations.q.listBySubscriptionIdForUser, {
      subscriptionId: typedSubscriptionId,
      userId
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
    <ProtectedLayout>
      <main className='space-y-8'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-8'>
            <Link
              href='/subscriptions'
              prefetch='auto'
              className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'>
              <Icon name='arrow-left' className='size-4' />
              Subscriptions
            </Link>
            <div className='space-y-1'>
              <h1 className='font-heading text-3xl font-bold tracking-tight'>{subscription.tournament_name}</h1>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            {/*<span
              className={`inline-flex w-fit rounded-md px-3 py-1.5 font-ios text-xs uppercase tracking-widest ${statusStyles.pending_payment}`}>
              {subscription.total_players} Entries
            </span>*/}
            <span
              className={`inline-flex w-fit rounded-md px-3 py-1.5 font-ios text-xs uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
              {formatStatus(status)}
            </span>
          </div>
        </div>
        {status === 'confirmed' && (
          <RegistrationSection
            subscriptionId={typedSubscriptionId}
            registrations={registrations}
            maxEntries={maxEntries}
            defaultDivision={subscription.division}
          />
        )}
        <div className='grid gap-5 lg:grid-cols-[1.1fr_0.9fr]'>
          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Entry Details</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-5 sm:grid-cols-2'>
              <DetailRow label='Team name' value={subscription.team_name} />
              <DetailRow label='Division' value={subscription.division} />
              <DetailRow label='Players' value={subscription.total_players} />
              <DetailRow label='Checked in' value={subscription.total_checked_in} />
              <DetailRow label='Handicap' value={subscription.handicap_index} />
              <DetailRow label='Tournament ID' value={subscription.tournament_id} />
            </CardContent>
          </Card>

          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Contact</CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              <DetailRow label='Email' value={subscription.contact_email} />
              <DetailRow label='Phone' value={subscription.contact_phone} />
            </CardContent>
          </Card>

          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Payment</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-5 sm:grid-cols-2'>
              <DetailRow label='Payment status' value={formatStatus(subscription.payment_status)} />
              <DetailRow label='Transaction reference' value={subscription.txn_ref_no} />
              <DetailRow label='QR payload' value={subscription.payment_qrcode ? 'Stored' : 'Not stored'} />
              <DetailRow label='Receipt storage ID' value={subscription.receipt_image_url} />
            </CardContent>
          </Card>

          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Next Step</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
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
                    size='xl'
                    className={cn(buttonVariants({ variant: 'default' }), 'bg-foreground w-full justify-center')}>
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
      </main>
    </ProtectedLayout>
  )
}

export default Page
