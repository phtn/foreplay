import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import ProtectedLayout from '@/ctx/protected'
import { statusStyles } from '@/lib/constants'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds } from '@/lib/firebase/server-session'
import { Icon, type IconName } from '@/lib/icons'
import { buildLoginPath } from '@/lib/routing/auth-redirect'
import { cn } from '@/lib/utils'
import { formatPaymentAmount, formatStatus } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View your Foreplay account and tournament activity.'
}

type Subscription = Doc<'subscriptions'>

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'Asia/Manila'
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

const providerLabels: Record<string, string> = {
  password: 'Email and password',
  phone: 'Phone',
  'google.com': 'Google',
  'apple.com': 'Apple',
  'facebook.com': 'Facebook',
  'github.com': 'GitHub'
}

function formatProvider(provider: string | null | undefined) {
  if (!provider) {
    return 'Secure sign-in'
  }

  return providerLabels[provider] ?? provider
}

function formatDate(value: number | null | undefined, includeTime = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Not available'
  }

  return (includeTime ? dateTimeFormatter : dateFormatter).format(value)
}

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

  return initials || 'U'
}

function toCount(value: string) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) && count > 0 ? count : 0
}

function getSubscriptionStatus(subscription: Subscription) {
  if (subscription.status) {
    return subscription.status
  }

  return subscription.payment_status === 'paid' ? 'confirmed' : 'pending_payment'
}

function getSubscriptionHref(subscription: Subscription) {
  const status = getSubscriptionStatus(subscription)

  if (status === 'pending_payment' && subscription.form_id) {
    return `/tournaments/${encodeURIComponent(subscription.tournament_id)}/entry?formId=${encodeURIComponent(
      subscription.form_id
    )}`
  }

  return `/subscriptions/${subscription._id}`
}

function ProfileMetric({
  detail,
  icon,
  label,
  value
}: {
  detail: string
  icon: IconName
  label: string
  value: number
}) {
  return (
    <div className='min-w-0 space-y-1 px-4 py-4 sm:px-5'>
      <div className='flex items-center gap-2 text-white/65'>
        <Icon name={icon} className='size-3.5' />
        <p className='font-ios text-[10px] uppercase tracking-widest'>{label}</p>
      </div>
      <p className='font-poly text-3xl font-medium tabular-nums text-white'>{value}</p>
      <p className='truncate text-xs text-white/60'>{detail}</p>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: IconName; label: string; value: ReactNode }) {
  return (
    <div className='grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 py-3.5'>
      <span className='flex size-10 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground'>
        <Icon name={icon} className='size-4' />
      </span>
      <div className='min-w-0 space-y-1'>
        <dt className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</dt>
        <dd className='wrap-break-word font-okx text-sm text-foreground/85'>{value}</dd>
      </div>
    </div>
  )
}

export default async function ProfilePage() {
  const session = await getVerifiedFirebaseSession()

  if (!session) {
    redirect(buildLoginPath('/profile'))
  }

  const { decodedToken } = session
  const userIds = buildFirebaseSubscriptionUserIds(decodedToken)
  const [user, subscriptions] = await Promise.all([
    fetchQuery(api.users.q.getUserBySubject, { subject: decodedToken.sub }),
    fetchQuery(api.subscriptions.q.listByUserIds, { userIds })
  ])

  const displayName =
    decodedToken.name ?? user?.name ?? user?.preferredUsername ?? decodedToken.email ?? user?.email ?? 'Foreplay player'
  const email = decodedToken.email ?? user?.email ?? null
  const phone = decodedToken.phone_number ?? user?.phone ?? null
  const pictureUrl = decodedToken.picture ?? user?.pictureUrl ?? null
  const emailVerified = decodedToken.email_verified ?? user?.emailVerified ?? false
  const provider = formatProvider(decodedToken.firebase?.sign_in_provider ?? user?.nickname)
  const joinedAt = user?.createdAt ?? null
  const updatedAt = user?.updatedAt ?? decodedToken.iat * 1000
  const activeEntries = subscriptions.filter((subscription) => getSubscriptionStatus(subscription) !== 'cancelled')
  const confirmedEntries = subscriptions.filter((subscription) => {
    return getSubscriptionStatus(subscription) === 'confirmed' || subscription.payment_status === 'paid'
  })
  const playerCount = subscriptions.reduce((total, subscription) => total + toCount(subscription.total_players), 0)
  const checkedInCount = subscriptions.reduce(
    (total, subscription) => total + toCount(subscription.total_checked_in),
    0
  )
  const recentSubscriptions = subscriptions.slice(0, 4)

  return (
    <ProtectedLayout>
      <div className='space-y-5 pb-8 md:space-y-6'>
        <section
          aria-labelledby='profile-heading'
          className='relative isolate overflow-hidden rounded-[2rem] bg-[#1d2824] px-5 py-6 text-white shadow-[0_24px_70px_rgba(17,31,25,0.18)] sm:px-7 sm:py-8 lg:px-9'>
          <div
            className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_88%_82%,rgba(251,146,60,0.16),transparent_30%)]'
            aria-hidden='true'
          />
          <div
            className='pointer-events-none absolute -right-24 -top-28 -z-10 size-72 rounded-full border border-white/8'
            aria-hidden='true'
          />

          <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.78fr)] lg:items-end'>
            <div className='flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center'>
              <Avatar className='size-20 ring-1 ring-white/10 sm:size-24'>
                {pictureUrl ? <AvatarImage src={pictureUrl} alt='' /> : null}
                <AvatarFallback className='bg-white/10 font-poly text-2xl text-white'>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className='min-w-0 space-y-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-ios text-[10px] uppercase tracking-widest text-white/55'>
                    Joined {formatDate(joinedAt)}
                  </span>
                </div>

                <div className='min-w-0'>
                  <h1
                    id='profile-heading'
                    className='text-balance font-poly text-3xl font-medium tracking-tight sm:text-4xl'>
                    {displayName}
                  </h1>
                  <p className='mt-2 break-all text-sm text-white/65'>{email ?? 'No email address available'}</p>
                </div>

                <div className='flex flex-wrap gap-2 font-okx'>
                  <Link
                    href='/subscriptions'
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'rounded-full bg-white text-[#1d2824] transition-transform active:scale-[0.96] hover:bg-white/90'
                    )}>
                    View my entries
                    <Icon name='chevron-right' className='size-3.5' />
                  </Link>
                  <Link
                    href='/tournaments/som-2026'
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'rounded-full border-white/15 bg-white/8 text-white transition-transform active:scale-[0.96] hover:bg-white/14 hover:text-white'
                    )}>
                    Browse tournament
                  </Link>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl bg-white/7 ring-1 ring-white/10 backdrop-blur'>
              <ProfileMetric
                label='Entries'
                value={subscriptions.length}
                detail={`${activeEntries.length} active`}
                icon='ticket'
              />
              <ProfileMetric
                label='Confirmed'
                value={confirmedEntries.length}
                detail='Ready to play'
                icon='circle-check-line'
              />
              <ProfileMetric label='Players' value={playerCount} detail='Across all entries' icon='person-multiple' />
            </div>
          </div>
        </section>

        <div className='grid lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.72fr)] lg:items-start lg:divide-x lg:divide-border border'>
          <Card className='gap-0 py-0 ring-foreground/8 rounded-none'>
            <CardHeader className='border-b border-border/60 py-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <CardTitle>
                    <h2 className='font-okx text-base'>Recent activity</h2>
                  </CardTitle>
                  <CardDescription>Your latest tournament entries and payment progress.</CardDescription>
                </div>
                {subscriptions.length ? (
                  <Link
                    href='/subscriptions'
                    className='inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'>
                    View all
                    <Icon name='chevron-right' className='size-4' />
                  </Link>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className='px-0 '>
              {recentSubscriptions.length ? (
                <div className='divide-y divide-border/50'>
                  {recentSubscriptions.map((subscription, index) => {
                    const status = getSubscriptionStatus(subscription)
                    const playerTotal = toCount(subscription.total_players)

                    return (
                      <Link
                        key={subscription._id}
                        href={getSubscriptionHref(subscription)}
                        prefetch={index === 0}
                        className='group grid gap-4 px-4 py-4 transition-colors hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6'>
                        <div className='flex min-w-0 items-center gap-3'>
                          <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background'>
                            <Icon name='trophy-line' className='size-4' />
                          </span>
                          <div className='min-w-0'>
                            <p className='truncate font-okx text-sm text-foreground'>{subscription.tournament_name}</p>
                            <p className='mt-1 text-xs text-muted-foreground'>
                              {formatDate(subscription._creationTime)} · {playerTotal}{' '}
                              {playerTotal === 1 ? 'player' : 'players'}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center justify-between gap-4 ps-14 sm:justify-end sm:ps-0'>
                          <div className='text-start sm:text-end'>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 font-ios text-[9px] uppercase tracking-widest ${
                                statusStyles[status] ?? statusStyles.pending_payment
                              }`}>
                              {formatStatus(status)}
                            </span>
                            <p className='mt-1.5 text-xs text-muted-foreground'>
                              {formatPaymentAmount(subscription.payment_amount)}
                            </p>
                          </div>
                          <Icon
                            name='chevron-right'
                            className='size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground'
                          />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className='flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-10 text-center'>
                  <span className='flex size-12 items-center justify-center text-foreground/40'>
                    <Icon name='ticket-diagonal' className='size-8 rotate-8' />
                  </span>
                  <div className='max-w-sm'>
                    <p className='font-okx text-base opacity-70'>You have no entries yet.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <aside className='h-full ring-none'>
            <Card className='gap-4 py-5 rounded-none'>
              <CardContent className='space-y-4 h-full'>
                <div className='flex items-start gap-3'>
                  <span className='flex size-6 shrink-0 items-center justify-center rounded-xl bg-background text-emerald-600 ring-1 ring-foreground/8 dark:text-emerald-400'>
                    <Icon name={emailVerified ? 'verified' : 'lock'} className='size-5' />
                  </span>
                  <div className='min-w-0 space-y-1'>
                    <h2 className='font-okx font-medium text-base'>Account Security</h2>
                    <p className='text-pretty text-sm leading-5 text-muted-foreground'>
                      {emailVerified
                        ? 'Valid for entry confirmations and tournament updates.'
                        : 'Verify your email with your sign-in provider to receive account and tournament updates.'}
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 rounded-xl bg-background p-3 ring-1 ring-foreground/8'>
                  <div>
                    <p className='font-ios text-[9px] uppercase tracking-widest text-muted-foreground'>Email</p>
                    <p className='mt-1 font-okx text-xs'>{emailVerified ? 'Verified' : 'Not verified'}</p>
                  </div>
                  <div>
                    <p className='font-ios text-[9px] uppercase tracking-widest text-muted-foreground'>Check-ins</p>
                    <p className='mt-1 font-okx text-xs tabular-nums'>
                      {checkedInCount} of {playerCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </ProtectedLayout>
  )
}

interface AccountDetailsProps {
  email: string
  emailVerified: boolean
  phone: string
  checkedInCount: number
  playerCount: number
  updatedAt: number
  joinedAt: number
  provider: string
}
const AccountDetails = ({
  email,
  emailVerified,
  phone,
  checkedInCount,
  playerCount,
  provider,
  updatedAt,
  joinedAt
}: AccountDetailsProps) => {
  return (
    <aside aria-label='Account details' className='space-y-5'>
      <Card className='gap-0 py-0 ring-foreground/8'>
        <CardHeader className='border-b border-border/60 py-5'>
          <CardTitle>
            <h2 className='font-okx text-base'>Personal details</h2>
          </CardTitle>
          <CardDescription>Information connected to your sign-in account.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className='divide-y divide-border/45'>
            <DetailRow
              icon='mail'
              label='Email'
              value={
                email ? (
                  <a href={`mailto:${email}`} className='break-all underline-offset-4 hover:underline'>
                    {email}
                  </a>
                ) : (
                  'Not provided'
                )
              }
            />
            <DetailRow
              icon='phone-accept'
              label='Phone'
              value={
                phone ? (
                  <a href={`tel:${phone}`} className='underline-offset-4 hover:underline'>
                    {phone}
                  </a>
                ) : (
                  'Not provided'
                )
              }
            />
            <DetailRow icon='user' label='Sign-in method' value={provider} />
            <DetailRow icon='calendar' label='Member since' value={formatDate(joinedAt)} />
            <DetailRow icon='clock' label='Profile synced' value={formatDate(updatedAt, true)} />
          </dl>
        </CardContent>
      </Card>
    </aside>
  )
}
