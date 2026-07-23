import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatStatus, nanoCreatedAt } from '@/utils/formatters'
import { confirmSubscription, updateSubscriptionRemarks } from './actions'
import { ReceiptDrawer } from './receipt-drawer'
import { StatHeader } from './stat-header'

interface EventSubscriptionsProps {
  eventId: string
  subscriptions: EventSubscription[]
}

type EventSubscription = Doc<'subscriptions'> & {
  receiptImageUrl: string | null
}

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

export const EventSubscriptions = ({ eventId, subscriptions }: EventSubscriptionsProps) => {
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
    <Card className='gap-y-0 rounded-md md:rounded-2xl border-border/70 bg-slate-400/10 dark:bg-slate-400/20 p-0'>
      <StatHeader counts={counts} />
      <CardContent className='p-0! dark:bg-slate-600/10 m-0'>
        {subscriptions.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-300 text-sm'>
              <thead>
                <tr className='border-y border-border/50 bg-slate-400/15 text-left whitespace-nowrap'>
                  {[
                    'Created',
                    'Reference',
                    'Entries',
                    'Amount(₱)',
                    'Payment',
                    'Status',
                    'Receipt',
                    'Action',
                    'Confirmed At',
                    'Remarks'
                  ].map((label) => (
                    <th
                      key={label}
                      className='px-5 py-3 font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => {
                  const status = subscription.status ?? 'pending_payment'
                  const confirmer =
                    subscription.confirmed_by_name ?? subscription.confirmed_by_email ?? subscription.confirmed_by_id
                  const confirmedAtLabel = subscription.confirmed_at && nanoCreatedAt(subscription.confirmed_at)

                  return (
                    <tr key={subscription._id} className='border-b border-border/60 align-top'>
                      <td className='font-okx px-6 py-4 text-muted-foreground text-xs block'>
                        {nanoCreatedAt(subscription._creationTime)
                          .split(',')
                          .map((part, index) => (
                            <p className='whitespace-nowrap' key={index}>
                              {part}
                            </p>
                          ))}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <p className='font-okx text-foreground/90'>
                            {subscription.txn_ref_no ?? subscription.form_id ?? subscription._id}
                          </p>
                          <p className='text-xs text-muted-foreground'>{subscription.contact_email ?? 'No email'}</p>
                        </div>
                      </td>
                      {/*<td className='px-4 py-4'>
                        <div className='space-y-1'>
                          <p className='font-okx text-foreground/90'>{subscription.team_name ?? 'Team pending'}</p>
                          <p className='text-xs text-muted-foreground'>{subscription.contact_phone ?? 'No phone'}</p>
                        </div>
                      </td>*/}
                      <td className='px-4 py-4'>
                        <div className='space-y-1'>
                          <p className='text-foreground/85'>
                            <span className='font-okx'>{subscription.total_players}</span> entries
                          </p>
                          <p className='text-xs text-muted-foreground whitespace-nowrap'>
                            <span className='font-okx'>{subscription.total_checked_in}</span> checked in
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4 font-okx text-foreground/85'>
                        {subscription.payment_amount?.toLocaleString()}
                      </td>
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

                      <td className='px-4 py-4'>
                        <div className='space-y-1.5'>
                          <span
                            className={cn(
                              'inline-flex rounded-sm px-1.5 py-1 font-ios text-[10px] uppercase tracking-widest whitespace-nowrap',
                              subscriptionStatusStyles[status] ?? subscriptionStatusStyles.pending_payment
                            )}>
                            {formatStatus(status)}
                          </span>
                          {status === 'confirmed' && confirmer ? (
                            <div className='max-w-44 space-y-0.5 text-xs text-muted-foreground'>
                              <p className='truncate'>{confirmer}</p>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className='px-6 py-4 text-xs'>
                        <ReceiptDrawer
                          amount={subscription.payment_amount}
                          contactEmail={subscription.contact_email}
                          receiptUrl={subscription.receiptImageUrl}
                          reference={subscription.txn_ref_no ?? subscription.form_id ?? subscription._id}
                          status={formatStatus(subscription.payment_status)}
                          teamName={subscription.team_name ?? 'Team pending'}
                          uploadedAt={subscription._creationTime}
                        />
                      </td>
                      <td className='px-6 py-4 text-xs text-center'>
                        {status === 'confirmed' && subscription.payment_status === 'paid' ? (
                          <span className='text-emerald-700 dark:text-emerald-300'>Confirmed</span>
                        ) : (
                          <form action={confirmSubscription}>
                            <input type='hidden' name='subscriptionId' value={subscription._id} />
                            <input type='hidden' name='eventId' value={eventId} />
                            <button
                              type='submit'
                              className='font-semibold text-sky-600 dark:text-sky-500 transition-colors hover:text-sky-500'>
                              Update
                            </button>
                          </form>
                        )}
                      </td>
                      <td className='px-5 py-4 text-xs text-center text-muted-foreground'>
                        {confirmedAtLabel ? (
                          confirmedAtLabel.split(',').map((part, index) => (
                            <p className='whitespace-nowrap' key={index}>
                              {part}
                            </p>
                          ))
                        ) : status === 'confirmed' ? (
                          <span>N/A</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-xs'>
                        <form action={updateSubscriptionRemarks} className='grid min-w-52 gap-2'>
                          <input type='hidden' name='subscriptionId' value={subscription._id} />
                          <input type='hidden' name='eventId' value={eventId} />
                          <div className='flex items-center justify-center space-x-1'>
                            <textarea
                              name='remarks'
                              defaultValue={subscription.admin_remarks ?? ''}
                              placeholder='Add admin notes'
                              className='min-h-10 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-transparent'
                            />
                            <Button
                              type='submit'
                              variant={'ghost'}
                              className='justify-self-start text-xs text-sky-600 transition-colors hover:text-sky-500'>
                              Save
                            </Button>
                          </div>
                        </form>
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
