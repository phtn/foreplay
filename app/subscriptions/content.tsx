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
    dateStyle: 'medium'
    // timeStyle: 'short'
  }).format(value)
}

const formatPaymentAmount = (value: number | undefined) => {
  if (typeof value !== 'number') {
    return 'TBD'
  }

  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 0,
    style: 'currency',
    currencyDisplay: 'code'
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
        <h1 className='font-okx font-bold text-lg md:text-xl tracking-wide'>Entries</h1>
        <p className='hidden md:flex max-w-2xl text-sm text-foreground/70'>
          Review entry requests, payment status, receipt state, and the next action for each tournament.
        </p>
      </div>

      <div className='grid grid-cols-4 divide-x divide-slate-200/10 rounded-se-lg'>
        {[
          { label: 'Total', value: counts.total },
          { label: 'Pending', value: counts.pending },
          { label: 'Review', value: counts.review },
          { label: 'Confirmed', value: counts.confirmed }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='rounded-none min-h-18 bg-border/10 p-0! border-none sm:min-h-0'>
            <CardContent className='space-y-1 p-3! sm:p-2! rounded-none border-0'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground md:text-xs'>
                {stat.label}
              </p>
              <p className='font-poly font-medium text-xl md:text-xl'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className=' py-0'>
        <CardContent className='p-0 dark:bg-slate-500/20 border border-slate-400/50 rounded-2xl'>
          {subscriptions.length ? (
            <div className='divide-y divide-slate-500/30'>
              {subscriptions.map((subscription, index) => {
                const status = subscription.status ?? 'pending_payment'
                const route =
                  subscription.status === 'pending_payment'
                    ? `/tournaments/${subscription.tournament_id}/entry?formId=${subscription.form_id}`
                    : `/subscriptions/${subscription._id}`

                return (
                  <Link
                    key={subscription._id}
                    href={route}
                    prefetch={index === 0}
                    className='block px-4 py-8 transition-colors dark:hover:bg-slate-500/25 hover:bg-slate-300/30 sm:p-5 md:grid md:grid-cols-[0.6fr_1.4fr_auto] md:items-center md:gap-4 w-full'>
                    <div className='flex items-start justify-between gap-3 md:block md:space-y-1'>
                      <div className='min-w-0 space-y-1'>
                        <p className='line-clamp-2 font-okx text-lg leading-snug text-foreground md:line-clamp-1'>
                          {subscription.tournament_name}
                        </p>
                        <p className='font-ios text-foreground/70 md:text-xs text-[10px] uppercase tracking-widest'>
                          {subscription.txn_ref_no}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-md px-2 py-1 font-ios text-[10px] uppercase tracking-widest md:hidden ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                        {formatStatus(status)}
                      </span>
                    </div>

                    <div className='mt-8 py-3 grid grid-cols-3 md:grid-cols-4 gap-4 dark:bg-slate-500/10 md:mt-0 md:bg-transparent md:p-0 rounded-lg w-full whitespace-nowrap'>
                      <div className='hidden md:flex flex-col items-center justify-center w-full'>
                        <span
                          className={`inline-flex shrink-0 rounded-md px-2 py-1 font-ios text-sm uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                          {formatStatus(status)}
                        </span>
                      </div>
                      <div className='flex flex-col items-center justify-center w-full'>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-foreground/60'>Entries</p>
                        <p className='font-okx text-sm text-foreground'>{subscription.total_players}</p>
                      </div>

                      <div className='flex flex-col items-center justify-center w-full'>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-foreground/60'>Amount</p>
                        <p className='font-okx text-sm text-foreground'>
                          {formatPaymentAmount(subscription.payment_amount)}
                        </p>
                      </div>

                      <div className='flex flex-col items-center justify-center w-full'>
                        <p className='font-ios text-[10px] uppercase tracking-widest text-foreground/60'>Created</p>
                        <p className='text-sm text-foreground'>{formatCreatedAt(subscription._creationTime)}</p>
                      </div>
                    </div>
                    {/*<div className='mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/10 p-3 md:mt-0 md:block md:space-y-1 md:border-0 md:bg-transparent md:p-0'></div>*/}
                    <div className='hidden'>
                      <p className='md:text-right text-sm text-foreground/80 md:text-sm md:text-foreground'>
                        {formatCreatedAt(subscription._creationTime)}
                      </p>
                      <p className='mt-1 hidden text-xs text-foreground/80 md:block uppercase'>{'Amount'}</p>
                      <p className='hidden text-sm text-muted-foreground md:block'>{subscription.total_players}</p>

                      <p className='text-sm text-foreground/80'>{'Status'}</p>
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 font-ios text-xs uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                        {formatStatus(status)}
                      </span>
                    </div>
                    <div className='hidden md:flex flex-1 items-center justify-between mt-4 gap-3 md:mt-0 md:justify-end'>
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
