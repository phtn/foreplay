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

const formatPaymentAmount = (value: number | undefined) => {
  if (typeof value !== 'number') {
    return 'Pending'
  }

  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 0,
    style: 'currency'
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
    <main className='space-y-6 md:space-y-8'>
      <div className='space-y-1 md:space-y-2'>
        <p className='font-ios text-[11px] md:text-xs uppercase tracking-widest dark:text-sky-500 text-sky-600'>
          Subscriptions
        </p>
        <h1 className='font-okx font-bold text-lg md:text-xl tracking-wide'>Entries</h1>
        <p className='hidden md:flex max-w-2xl text-sm text-muted-foreground'>
          Review entry requests, payment status, receipt state, and the next action for each tournament.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-2 sm:grid-cols-5 xl:gap-4'>
        {[
          { label: 'Total', value: counts.total },
          { label: 'Pending', value: counts.pending },
          { label: 'Review', value: counts.review },
          { label: 'Confirmed', value: counts.confirmed },
          { label: 'Cancelled', value: counts.cancelled }
        ].map((stat) => (
          <Card
            key={stat.label}
            size='sm'
            className='min-h-18 rounded-lg border-border/70 bg-border/10 p-0! sm:min-h-0'>
            <CardContent className='space-y-1 p-3! sm:p-2!'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:text-xs'>
                {stat.label}
              </p>
              <p className='font-heading text-xl font-bold md:text-xl'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='rounded-xl border-border/80 py-0'>
        <CardContent className='p-0'>
          {subscriptions.length ? (
            <div className='divide-y divide-border/35'>
              {subscriptions.map((subscription, index) => {
                const status = subscription.status ?? 'pending_payment'

                return (
                  <Link
                    key={subscription._id}
                    href={`/subscriptions/${subscription._id}`}
                    prefetch={index === 0}
                    className='block p-4 transition-colors hover:bg-muted/30 sm:p-5 md:grid md:grid-cols-[1.2fr_0.5fr_0.5fr_0.7fr_auto] md:items-center md:gap-4'>
                    <div className='flex items-start justify-between gap-3 md:block md:space-y-1'>
                      <div className='min-w-0 space-y-1'>
                        <p className='line-clamp-2 font-okx text-base leading-snug text-foreground md:line-clamp-1'>
                          {subscription.tournament_name}
                        </p>
                        <p className='break-all font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:text-xs'>
                          {subscription.txn_ref_no ?? subscription.form_id ?? subscription._id}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-md px-2 py-1 font-ios text-[10px] uppercase tracking-widest md:hidden ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                        {formatStatus(status)}
                      </span>
                    </div>
                    <div className='mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/10 p-3 md:mt-0 md:block md:space-y-1 md:border-0 md:bg-transparent md:p-0'>
                      <div>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:hidden'>
                          Division
                        </p>
                        <p className='mt-1 text-sm text-foreground/80 md:mt-0'>
                          {subscription.division ?? 'Division pending'}
                        </p>
                      </div>
                      <div>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:hidden'>
                          Entries
                        </p>
                        <p className='mt-1 text-sm text-foreground/80 md:hidden'>{subscription.total_players}</p>
                        <p className='hidden text-xs text-muted-foreground md:block'>
                          {subscription.total_players} Entries
                        </p>
                      </div>
                    </div>
                    <div className='mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/10 p-3 md:mt-0 md:block md:space-y-1 md:border-0 md:bg-transparent md:p-0'>
                      <div>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:hidden'>
                          Amount
                        </p>
                        <p className='mt-1 hidden text-sm text-foreground/80 md:block'>{'Amount'}</p>
                      </div>
                      <p className='self-end text-right text-sm text-foreground/80 md:text-left md:text-xs md:text-muted-foreground'>
                        {formatPaymentAmount(subscription.payment_amount)}
                      </p>
                    </div>
                    <div className='hidden md:block'>
                      <p className='text-sm text-foreground/80'>{'Status'}</p>
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 font-ios text-xs uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                        {formatStatus(status)}
                      </span>
                    </div>
                    <div className='mt-4 flex items-center justify-between gap-3 md:mt-0 md:justify-end'>
                      <div>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:text-sm md:normal-case md:tracking-normal md:text-foreground/80'>
                          {'Date'}
                        </p>
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
