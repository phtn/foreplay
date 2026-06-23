import { Card, CardContent } from '@/components/ui/card'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

type Subscription = Doc<'subscriptions'>

interface ContentProps {
  subscriptions: Subscription[]
}

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
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

const formatCreatedAt = (value: number) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value)
}

export const Content = ({ subscriptions }: ContentProps) => {
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
    <main className='space-y-8'>
      <div className='space-y-2'>
        <p className='font-ios text-xs uppercase tracking-widest text-sky-500'>Subscriptions</p>
        <h1 className='font-heading text-3xl font-bold tracking-tight'>Entries</h1>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Review entry requests, payment status, receipt state, and the next action for each tournament.
        </p>
      </div>

      <div className='grid gap-1 xl:gap-4 grid-cols-5 xl:grid-cols-5'>
        {[
          { label: 'Total', value: counts.total },
          { label: 'Pending', value: counts.pending },
          { label: 'review', value: counts.review },
          { label: 'Confirmed', value: counts.confirmed },
          { label: 'Cancelled', value: counts.cancelled }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='border-border/1 bg-border/10 p-0! rounded-xs md:rounded-lg'>
            <CardContent className='space-y-1 p-2!'>
              <p className='font-ios text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground'>
                {stat.label}
              </p>
              <p className='font-heading text-base md:text-xl font-bold'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='border-border/70 py-0'>
        <CardContent className='p-0'>
          {subscriptions.length ? (
            <div className='divide-y divide-border/70'>
              {subscriptions.map((subscription, index) => {
                const status = subscription.status ?? 'pending_payment'

                return (
                  <Link
                    key={subscription._id}
                    href={`/subscriptions/${subscription._id}`}
                    prefetch={index === 0}
                    className='grid gap-4 p-5 transition-colors hover:bg-muted/30 md:grid-cols-[1.2fr_0.5fr_0.5fr_0.7fr_auto] md:items-center'>
                    <div className='space-y-1'>
                      <p className='font-okx text-base text-foreground'>{subscription.tournament_name}</p>
                      <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>
                        {subscription.txn_ref_no ?? subscription.form_id ?? subscription._id}
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm text-foreground/80'>{subscription.division ?? 'Division pending'}</p>
                      <p className='text-xs text-muted-foreground'>{subscription.total_players} Entries</p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm text-foreground/80'>{'Amount'}</p>
                      <p className='text-xs text-muted-foreground'>{subscription.payment_amount}</p>
                    </div>
                    <div>
                      <p className='text-sm text-foreground/80'>{'Status'}</p>
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 font-ios text-xs uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                        {formatStatus(status)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between gap-3 md:justify-end'>
                      <div>
                        <p className='text-sm text-foreground/80'>{'Date'}</p>
                        <p className='text-xs text-muted-foreground'>{formatCreatedAt(subscription._creationTime)}</p>
                      </div>
                      <Icon name='chevron-right' className='size-4 text-muted-foreground' />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className='flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center'>
              <Icon name='ticket' className='size-10 text-muted-foreground/50' />
              <div className='space-y-1'>
                <p className='font-okx text-base'>No subscriptions yet</p>
                <p className='text-sm text-muted-foreground'>Create an entry request from an open tournament.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
