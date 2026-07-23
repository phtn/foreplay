import { Badge } from '@/components/reui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { getFirebaseUserByUid } from '@/lib/firebase/admin'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon, type IconName } from '@/lib/icons'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AccessPanel } from './access-panel'
import { CopyUidButton } from './copy-uid-button'

export const metadata: Metadata = {
  title: 'User Details | Admin',
  description: 'Review a user account, access roles, and tournament activity.'
}

interface UserPageProps {
  params: Promise<{ uid: string }>
}

type Subscription = Doc<'subscriptions'>
type MetricTone = 'amber' | 'emerald' | 'sky' | 'violet'

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'Asia/Manila'
})

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
})

const statusStyles: Record<string, string> = {
  pending_payment: '_bg-amber-500/10 text-orange-700 dark:text-orange-300',
  payment_review: '_bg-sky-500/10 text-sky-700 dark:text-sky-300',
  confirmed: '_bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: '_bg-destructive/10 text-destructive'
}

const metricToneStyles: Record<MetricTone, string> = {
  amber: '_bg-amber-500/10 text-amber-700 dark:text-amber-300',
  emerald: '_bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  sky: '_bg-sky-500/10 text-sky-700 dark:text-sky-300',
  violet: '_bg-violet-500/10 text-violet-700 dark:text-violet-300'
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFirebaseUserNotFound(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/user-not-found'
  )
}

async function getFirebaseUserOrNull(uid: string) {
  try {
    return await getFirebaseUserByUid(uid)
  } catch (error) {
    if (isFirebaseUserNotFound(error)) {
      return null
    }

    throw error
  }
}

function toTimestamp(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function formatDate(value: number | string | null | undefined, short = false) {
  const timestamp = toTimestamp(value)

  if (timestamp === null) {
    return 'Not available'
  }

  return (short ? shortDateFormatter : dateTimeFormatter).format(timestamp)
}

function toCount(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function getSubscriptionStatus(subscription: Subscription) {
  if (subscription.status) {
    return subscription.status
  }

  return subscription.payment_status === 'paid' ? 'confirmed' : 'pending_payment'
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatProvider(providerId: string) {
  const knownProviders: Record<string, string> = {
    password: 'Email & password',
    phone: 'Phone',
    'google.com': 'Google',
    'apple.com': 'Apple',
    'facebook.com': 'Facebook',
    'github.com': 'GitHub'
  }

  return knownProviders[providerId] ?? providerId
}

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')

  return initials.toUpperCase() || 'U'
}

function MetricCard({
  detail,
  icon,
  label,
  tone,
  value
}: {
  detail: string
  icon: IconName
  label: string
  tone: MetricTone
  value: string | number
}) {
  return (
    <Card size='sm' className='gap-3 py-4 ring-foreground/8'>
      <CardContent className='flex items-start justify-between gap-3'>
        <div className='min-w-0 space-y-1'>
          <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</p>
          <p className='font-poly text-2xl font-medium tracking-tight'>{value}</p>
          <p className='truncate text-xs text-muted-foreground'>{detail}</p>
        </div>
        <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${metricToneStyles[tone]}`}>
          <Icon name={icon} className='size-4' />
        </div>
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='grid gap-1 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start sm:gap-4'>
      <dt className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 wrap-break-word font-okx text-sm text-foreground/85 sm:text-right'>{value}</dd>
    </div>
  )
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1.5 rounded-xl border border-border/60 bg-muted/15 p-3.5'>
      <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='break-all font-mono text-xs leading-5 text-foreground/80'>{value}</p>
    </div>
  )
}

export default async function UserPage({ params }: UserPageProps) {
  const [{ uid: routeUid }, adminSession] = await Promise.all([params, requireAdminSession()])
  const uid = routeUid.trim()

  if (!uid) {
    notFound()
  }

  const [firebaseUser, convexUser] = await Promise.all([
    getFirebaseUserOrNull(uid),
    fetchQuery(api.users.q.getUserBySubject, { subject: uid })
  ])

  if (!firebaseUser && !convexUser) {
    notFound()
  }

  const subscriptionUserIds = Array.from(new Set([uid, convexUser?.tokenIdentifier].filter(isNonEmptyString)))
  const subscriptions = await fetchQuery(api.subscriptions.q.listByUserIds, {
    userIds: subscriptionUserIds
  })

  const displayName =
    firebaseUser?.displayName ??
    convexUser?.name ??
    convexUser?.preferredUsername ??
    firebaseUser?.email ??
    convexUser?.email ??
    `User ${uid.slice(0, 8)}`
  const email = firebaseUser?.email ?? convexUser?.email ?? null
  const phone = firebaseUser?.phoneNumber ?? convexUser?.phone ?? null
  const photoUrl = firebaseUser?.photoURL ?? convexUser?.pictureUrl ?? null
  const emailVerified = firebaseUser?.emailVerified ?? convexUser?.emailVerified ?? false
  const claims: Record<string, unknown> = firebaseUser?.customClaims ?? {}
  const isCurrentAdmin = adminSession.decodedToken.sub === uid
  const providerIds = Array.from(
    new Set(
      [...(firebaseUser?.providerData.map((provider) => provider.providerId) ?? []), convexUser?.nickname].filter(
        isNonEmptyString
      )
    )
  )
  const providerSummary = providerIds.length ? providerIds.map(formatProvider).join(', ') : 'Custom authentication'
  const activeEntries = subscriptions.filter((subscription) => getSubscriptionStatus(subscription) !== 'cancelled')
  const playerCount = subscriptions.reduce((total, subscription) => total + toCount(subscription.total_players), 0)
  const checkedInCount = subscriptions.reduce(
    (total, subscription) => total + toCount(subscription.total_checked_in),
    0
  )
  const paidAmount = subscriptions.reduce((total, subscription) => {
    if (subscription.payment_status !== 'paid' && getSubscriptionStatus(subscription) !== 'confirmed') {
      return total
    }

    return total + (subscription.payment_amount ?? 0)
  }, 0)
  const recentSubscriptions = subscriptions.slice(0, 6)
  const createdAt = firebaseUser?.metadata.creationTime ?? convexUser?.createdAt
  const updatedAt = firebaseUser?.metadata.lastRefreshTime ?? convexUser?.updatedAt
  const lastSignInAt = firebaseUser?.metadata.lastSignInTime

  return (
    <main className='mx-auto w-full max-w-7xl space-y-5 px-3 pb-10 pt-2 sm:px-4 md:space-y-6 md:px-0 md:pt-0'>
      <Link
        href='/admin/config'
        className='group inline-flex items-center gap-1 rounded-full py-2 pl-2 font-okx text-sm text-muted-foreground transition-colors hover:text-foreground'>
        <Icon name='chevron-right' className='-rotate-90 text-sky-500 size-4' />
        User Directory
      </Link>

      <section className='relative overflow-hidden rounded-3xl border border-foreground/10 bg-card px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:px-7 sm:py-8'>
        <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-sky-500/10' />
        <div className='pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border border-foreground/5 bg-background/30' />
        <div className='pointer-events-none absolute -bottom-32 right-24 size-52 rounded-full border border-foreground/5 bg-background/30' />

        <div className='relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.75fr)] lg:items-end'>
          <div className='flex min-w-0 gap-5 items-center'>
            <Avatar className='size-12 shadow-xl ring-4 ring-background sm:size-24'>
              {photoUrl ? <AvatarImage src={photoUrl} alt={displayName} /> : null}
              <AvatarFallback className='bg-foreground font-poly text-xl text-background sm:text-2xl'>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className='min-w-0 space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge
                  variant={
                    !firebaseUser ? 'warning-light' : firebaseUser.disabled ? 'destructive-light' : 'success-outline'
                  }
                  size='lg'>
                  <span className='mr-0.5 size-1.5 rounded-full bg-current' />
                  {!firebaseUser ? 'Auth missing' : firebaseUser.disabled ? 'Suspended' : 'Active'}
                </Badge>
                <Badge variant={emailVerified ? 'success-outline' : 'success-outline'} size='lg'>
                  {emailVerified ? 'Email verified' : 'Email unverified'}
                </Badge>
                {claims.admin === true ? (
                  <Badge variant='info' size='lg'>
                    Admin
                  </Badge>
                ) : claims.staff === true ? (
                  <Badge variant='info-outline' size='lg'>
                    Staff
                  </Badge>
                ) : null}
              </div>

              <div className='min-w-0'>
                <p className='hidden md:flex mb-1 font-ios text-[10px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300'>
                  User profile
                </p>
                <h1 className='truncate font-poly text-2xl font-medium tracking-tight sm:text-3xl'>{displayName}</h1>
                <p className='mt-1 truncate text-sm text-muted-foreground'>{email ?? 'No email address'}</p>
              </div>

              <div className='hidden md:flex flex-wrap items-center gap-2'>
                <CopyUidButton uid={uid} />
              </div>
            </div>
          </div>

          <div className='grid grid-cols-3 divide-x divide-border/60 overflow-hidden rounded-2xl border border-foreground/10 bg-background/65 shadow-sm backdrop-blur'>
            <div className='min-w-0 p-3.5 sm:p-4'>
              <p className='font-ios text-[9px] uppercase tracking-widest text-muted-foreground'>Joined</p>
              <p className='mt-1 truncate font-okx text-xs sm:text-sm'>{formatDate(createdAt, true)}</p>
            </div>
            <div className='min-w-0 p-3.5 sm:p-4'>
              <p className='font-ios text-[9px] uppercase tracking-widest text-muted-foreground'>Last sign-in</p>
              <p className='mt-1 truncate font-okx text-xs sm:text-sm'>{formatDate(lastSignInAt, true)}</p>
            </div>
            <div className='min-w-0 p-3.5 sm:p-4'>
              <p className='font-ios text-[9px] uppercase tracking-widest text-muted-foreground'>Provider</p>
              <p className='mt-1 truncate font-okx text-xs sm:text-sm' title={providerSummary}>
                {providerSummary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!firebaseUser ? (
        <div className='flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200'>
          <Icon name='alert-triangle' className='mt-0.5 size-4 shrink-0' />
          <div>
            <p className='font-medium'>Firebase account unavailable</p>
            <p className='mt-1 text-xs leading-5 opacity-80'>
              This historical Convex profile remains available, but authentication controls cannot be changed.
            </p>
          </div>
        </div>
      ) : null}

      <section aria-label='User activity summary' className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <MetricCard
          label='Entry requests'
          value={subscriptions.length}
          detail={`${activeEntries.length} currently active`}
          icon='ticket'
          tone='sky'
        />
        <MetricCard
          label='Players'
          value={playerCount}
          detail='Across all requests'
          icon='person-multiple'
          tone='violet'
        />
        <MetricCard
          label='Checked in'
          value={checkedInCount}
          detail={playerCount ? `${Math.round((checkedInCount / playerCount) * 100)}% attendance` : 'No player records'}
          icon='check'
          tone='emerald'
        />
        <MetricCard
          label='Paid'
          value={currencyFormatter.format(paidAmount)}
          detail='Confirmed payments'
          icon='cash'
          tone='amber'
        />
      </section>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.75fr)] lg:items-start'>
        <div className='space-y-5'>
          <Card className='gap-0 py-0'>
            <CardHeader className='border-b border-border/60 py-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <CardTitle className='font-okx text-base'>Activity</CardTitle>
                  <CardDescription>Recent entries and payment progress for this user.</CardDescription>
                </div>
                <Badge variant='outline' size='lg'>
                  {subscriptions.length} total
                </Badge>
              </div>
            </CardHeader>

            <CardContent className='px-0'>
              {recentSubscriptions.length ? (
                <div className='divide-y divide-border/50'>
                  {recentSubscriptions.map((subscription, index) => {
                    const status = getSubscriptionStatus(subscription)
                    const reference = subscription.txn_ref_no ?? subscription.form_id ?? subscription._id

                    return (
                      <Link
                        key={subscription._id}
                        href={`/admin/${encodeURIComponent(subscription.tournament_id)}`}
                        prefetch={index === 0}
                        className='group grid gap-4 px-4 py-4 transition-colors hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6'>
                        <div className='flex min-w-0 items-center gap-3'>
                          <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background'>
                            <Icon name='trophy-line' className='size-4' />
                          </div>
                          <div className='min-w-0'>
                            <p className='truncate font-okx text-sm text-foreground'>{subscription.tournament_name}</p>
                            <p className='mt-1 truncate font-mono text-[10px] text-muted-foreground'>{reference}</p>
                          </div>
                        </div>

                        <div className='flex items-center gap-3 pl-13 sm:justify-end sm:pl-0'>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 font-ios text-[9px] uppercase tracking-widest ${statusStyles[status] ?? statusStyles.pending_payment}`}>
                            {formatStatus(status)}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            {toCount(subscription.total_players)}{' '}
                            {toCount(subscription.total_players) === 1 ? 'player' : 'players'}
                          </span>
                        </div>

                        <div className='flex items-center justify-between gap-4 pl-13 sm:min-w-28 sm:justify-end sm:pl-0'>
                          <div className='sm:text-right'>
                            <p className='font-okx text-xs text-foreground'>
                              {typeof subscription.payment_amount === 'number'
                                ? currencyFormatter.format(subscription.payment_amount)
                                : 'Amount TBD'}
                            </p>
                            <p className='mt-1 text-[10px] text-muted-foreground'>
                              {formatDate(subscription._creationTime, true)}
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

                  {subscriptions.length > recentSubscriptions.length ? (
                    <p className='px-6 py-3 text-center text-xs text-muted-foreground'>
                      {subscriptions.length - recentSubscriptions.length} older{' '}
                      {subscriptions.length - recentSubscriptions.length === 1 ? 'entry' : 'entries'} not shown
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className='flex min-h-52 flex-col items-center justify-center gap-3 px-6 py-10 text-center'>
                  <div className='flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                    <Icon name='ticket' className='size-5' />
                  </div>
                  <div className='space-y-1'>
                    <p className='font-okx text-sm'>No Activity</p>
                    <p className='text-xs text-muted-foreground'>This user has not submitted an entry request yet.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='gap-0 py-0'>
            <CardHeader className='border-b border-border/60 py-5'>
              <CardTitle className='font-okx text-base'>Identity references</CardTitle>
              <CardDescription>Identifiers shared by Firebase and Convex.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3 py-5 sm:grid-cols-2'>
              <IdentityRow label='Firebase UID' value={uid} />
              <IdentityRow label='Convex user ID' value={convexUser?._id ?? 'No linked Convex profile'} />
              <IdentityRow label='Token identifier' value={convexUser?.tokenIdentifier ?? 'Not available'} />
              <IdentityRow label='Issuer' value={convexUser?.issuer ?? 'Not available'} />
            </CardContent>
          </Card>
        </div>

        <aside className='space-y-5'>
          <Card className='gap-0 py-0'>
            <CardHeader className='border-b border-border/60 py-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <CardTitle className='font-okx text-base'>Account Details</CardTitle>
                  <CardDescription className='text-sm'>Contact and authentication metadata.</CardDescription>
                </div>
                <div className='flex size-6 shrink-0 items-center justify-center rounded-full _bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'>
                  <Icon name='user' className='size-4' />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl>
                <DetailRow
                  label='Email'
                  value={
                    email ? (
                      <a href={`mailto:${email}`} className='underline-offset-4 hover:underline'>
                        {email}
                      </a>
                    ) : (
                      'Not provided'
                    )
                  }
                />
                <DetailRow
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
                <DetailRow label='Provider' value={providerSummary} />
                <DetailRow label='Created' value={formatDate(createdAt)} />
                <DetailRow label='Last sign-in' value={formatDate(lastSignInAt)} />
                <DetailRow label='Last refreshed' value={formatDate(updatedAt)} />
              </dl>
            </CardContent>
          </Card>

          {firebaseUser ? <AccessPanel claims={claims} isCurrentAdmin={isCurrentAdmin} uid={uid} /> : null}
        </aside>
      </div>
    </main>
  )
}
