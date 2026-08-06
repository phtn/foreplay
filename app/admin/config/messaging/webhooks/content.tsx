'use client'

import { Badge, type BadgeProps } from '@/components/reui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useCopy } from '@/hooks/use-copy'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { trackedResendWebhookEventTypes, type TrackedResendWebhookEventType } from '@/lib/resend/webhooks/events'
import { cn } from '@/lib/utils'
import { ConvexHttpClient } from 'convex/browser'
import type { User } from 'firebase/auth'
import Link from 'next/link'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'

type WebhookEvent = Doc<'resendWebhookEvents'>
type EventTypeFilter = 'all' | TrackedResendWebhookEventType

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const pageSize = 30
const emptyEvents: WebhookEvent[] = []

const eventTypeLabels: Record<TrackedResendWebhookEventType, string> = {
  'email.sent': 'Sent',
  'email.delivered': 'Delivered',
  'email.opened': 'Opened',
  'email.failed': 'Failed',
  'email.bounced': 'Bounced'
}

const eventTypeFilters: { label: string; value: EventTypeFilter }[] = [
  { label: 'All events', value: 'all' },
  ...trackedResendWebhookEventTypes.map((eventType) => ({
    label: eventTypeLabels[eventType],
    value: eventType
  }))
]

const attentionEventTypes = new Set(['email.bounced', 'email.failed'])

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

function formatDate(value: number | string) {
  const date = typeof value === 'number' ? new Date(value) : new Date(value)

  return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : 'Unknown date'
}

function formatEventType(value: string) {
  return value
    .split('.')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).replaceAll('_', ' ')}`)
    .pop()
}

function getEventVariant(eventType: string): BadgeProps['variant'] {
  if (eventType === 'email.delivered' || eventType === 'email.sent') {
    return 'success-light'
  }

  if (attentionEventTypes.has(eventType)) {
    return 'destructive-light'
  }

  if (eventType === 'email.opened' || eventType === 'email.clicked') {
    return 'info-light'
  }

  return 'outline'
}

async function queryWebhookPage(user: User, eventType: EventTypeFilter, cursor: string | null) {
  if (!convexUrl) {
    throw new Error('Convex is not configured for this deployment.')
  }

  const token = await user.getIdToken()
  const client = new ConvexHttpClient(convexUrl, { logger: false })
  client.setAuth(token)

  return await client.query(api.resendWebhooks.q.list, {
    paginationOpts: { cursor, numItems: pageSize },
    ...(eventType === 'all' ? {} : { eventType })
  })
}

export const Content = () => {
  const { hasAdminClaim, isLoading: isAuthLoading, user } = useFirebaseUser()
  const [eventType, setEventType] = useState<EventTypeFilter>('all')
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const authError =
    !isAuthLoading && (!user || !hasAdminClaim)
      ? 'Your admin session could not be verified. Sign in again and retry.'
      : null
  const visibleEvents = authError ? emptyEvents : events

  useEffect(() => {
    if (isAuthLoading || !user || !hasAdminClaim) {
      return
    }

    let cancelled = false

    void queryWebhookPage(user, eventType, null)
      .then((result) => {
        if (cancelled) {
          return
        }

        setEvents(result.page)
        setIsDone(result.isDone)
        setNextCursor(result.isDone ? null : result.continueCursor)
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load webhook events.')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [eventType, hasAdminClaim, isAuthLoading, refreshKey, user])

  const filteredEvents = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase()

    if (!query) {
      return visibleEvents
    }

    return visibleEvents.filter((event) =>
      [event.detail, event.eventType, event.resourceId, event.source, event.subject, event.target, event.webhookId]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(query)
    )
  }, [deferredSearchQuery, visibleEvents])

  const attentionCount = visibleEvents.filter((event) => attentionEventTypes.has(event.eventType)).length
  const deliveredCount = visibleEvents.filter((event) => event.eventType === 'email.delivered').length
  const latestReceivedAt = visibleEvents[0]?.receivedAt

  const refresh = () => {
    setEvents([])
    setError(null)
    setIsDone(true)
    setIsLoading(true)
    setNextCursor(null)
    setRefreshKey((current) => current + 1)
  }

  const selectEventType = (nextEventType: EventTypeFilter) => {
    if (nextEventType === eventType) {
      return
    }

    setEvents([])
    setError(null)
    setIsDone(true)
    setIsLoading(true)
    setNextCursor(null)
    setEventType(nextEventType)
  }

  const loadMore = async () => {
    if (!user || isDone || !nextCursor || isLoadingMore) {
      return
    }

    setError(null)
    setIsLoadingMore(true)

    try {
      const result = await queryWebhookPage(user, eventType, nextCursor)

      setEvents((current) => {
        const knownIds = new Set(current.map((event) => event._id))
        const nextEvents = result.page.filter((event) => !knownIds.has(event._id))

        return [...current, ...nextEvents]
      })
      setIsDone(result.isDone)
      setNextCursor(result.isDone ? null : result.continueCursor)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load more webhook events.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <main className='mx-auto w-full max-w-6xl'>
      {/* space-y-0 px-3 py-0 sm:px-5 sm:py-0 lg:px-6*/}
      <section className='relative overflow-hidden md:rounded-md rounded-b-none dark:bg-zinc-500/5 bg-zinc-600 px-4 py-6 text-white shadow-[0_24px_70px_rgba(18,32,27,0.18)] sm:px-6 sm:py-8'>
        <div className='pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-zinc-400/15 blur-3xl' />
        <div className='pointer-events-none absolute -bottom-36 left-1/3 size-72 rounded-full bg-neutral-300/10 blur-3xl' />

        <div className='relative space-y-7'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-2'>
              <Link
                href='/admin/config?tab=messaging'
                className={cn(
                  buttonVariants({ size: 'sm', variant: 'ghost' }),
                  '-ms-2 w-fit text-white/65 hover:bg-white/10 hover:text-white'
                )}>
                <Icon name='chevron-right' className='size-4 -rotate-90' />
                Messaging
              </Link>
              <div className='space-y-2'>
                <div className='flex items-center space-x-4'>
                  <h2 className='font-poly text-xl font-medium tracking-tight sm:text-2xl'>Resend Activity</h2>
                  <Button
                    type='button'
                    size='icon-xs'
                    variant='secondary'
                    disabled={isLoading || isAuthLoading}
                    onClick={refresh}
                    className='group rounded-full w-6 border-white hover:border-white/50 hover:border-dashed bg-white text-zinc-500 hover:text-white hover:bg-white/14'>
                    <div className=' -scale-x-100'>
                      <Icon
                        name={isLoading ? 'spinner-ring' : 'refresh'}
                        className={cn('size-5 -rotate-60 group-hover:-rotate-50 transition-transform duration-300', {})}
                      />
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2 font-ios text-[11px] uppercase tracking-[0.2em] text-sky-300'>
              <span>Email Delivery Service</span>
              <Icon name='send' className='size-3.5' />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-2'>
            <Metric label='Loaded' value={isLoading ? '—' : String(visibleEvents.length)} />
            <Metric label='Delivered' value={isLoading ? '—' : String(deliveredCount)} />
            <Metric
              label='Alerts'
              value={isLoading ? '—' : String(attentionCount)}
              valueClassName={attentionCount > 0 ? 'text-orange-300' : undefined}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby='webhook-inbox-heading'
        className='overflow-hidden rounded-md rounded-t-none bg-card border-t-[0.5px] md:border border-foreground/30'>
        <div className='space-y-5 px-4 py-5 sm:px-6 sm:py-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center justify-between space-x-4'>
              <h2 id='webhook-inbox-heading' className='flex items-center gap-1 font-poly text-base'>
                <Icon name='webhook' className='' />
                <span className='opacity-80'>Recents</span>
              </h2>
              <p className='font-ios text-xs text-muted-foreground'>
                {latestReceivedAt ? `Latest ${formatDate(latestReceivedAt)}` : 'Waiting for the first event'}
              </p>
            </div>

            <div className='relative w-full lg:max-w-sm'>
              <Input
                type='search'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Search events'
                aria-label='Search webhook events'
                className='h-10 rounded-xl ps-4'
              />
            </div>
          </div>

          <div className='-mx-1 overflow-x-auto px-1 pb-1'>
            <div className='flex min-w-max gap-2' role='group' aria-label='Filter webhook events by event type'>
              {eventTypeFilters.map((filter) => {
                const active = filter.value === eventType

                return (
                  <button
                    key={filter.value}
                    type='button'
                    aria-pressed={active}
                    disabled={isLoading}
                    onClick={() => selectEventType(filter.value)}
                    className={cn(
                      'h-9 rounded-full px-3.5 font-okx text-sm transition-[color,background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
                      active
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}>
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div aria-live='polite' aria-busy={isLoading || isAuthLoading}>
          {isAuthLoading ? (
            <WebhookListSkeleton />
          ) : authError ? (
            <ErrorState message={authError} onRetry={refresh} />
          ) : isLoading ? (
            <WebhookListSkeleton />
          ) : error && visibleEvents.length === 0 ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : filteredEvents.length === 0 ? (
            <EmptyState hasSearch={Boolean(deferredSearchQuery.trim())} />
          ) : (
            <div>
              {filteredEvents.map((event) => (
                <WebhookEventRow key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>

        {error && visibleEvents.length > 0 ? (
          <div
            className='mx-4 mb-4 rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive sm:mx-6'
            role='alert'>
            {error}
          </div>
        ) : null}

        {!isLoading && visibleEvents.length > 0 && !isDone ? (
          <div className='flex justify-center border-t border-border/60 px-4 py-5'>
            <Button type='button' variant='outline' onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore ? <Icon name='refresh' className='size-4 animate-spin' /> : null}
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function Metric({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className='rounded-xs bg-white/7 px-4 py-3 ring-1 ring-white/8 backdrop-blur-sm'>
      <p className='font-ios text-[10px] uppercase tracking-[0.16em] text-white/45'>{label}</p>
      <p className={cn('mt-2 font-poly text-xl tabular-nums text-white', valueClassName)}>{value}</p>
    </div>
  )
}

function WebhookEventRow({ event }: { event: WebhookEvent }) {
  const { copy, copiedLabel } = useCopy({ timeout: 2000 })
  const handleCopy = useCallback((label: string, text: string) => () => copy(label, text), [copy])
  return (
    <details className='group border-t border-border/60 first:border-t'>
      <summary className='grid cursor-pointer list-none gap-3 px-4 py-4 transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(1,0.6fr)_minmax(1,0.4fr)_auto_auto] sm:items-center sm:px-6 [&::-webkit-details-marker]:hidden'>
        <div className='flex items-center justify-between'>
          <Badge
            variant={getEventVariant(event.eventType)}
            size='lg'
            radius='full'
            className='flex items-center gap-1 select-none'>
            <span className='font-poly text-sm tracking-wide'>{formatEventType(event.eventType)}</span>
          </Badge>
          <time
            dateTime={new Date(event.receivedAt).toISOString()}
            className='font-ios text-xs tabular-nums text-muted-foreground'>
            {formatDate(event.receivedAt)}
          </time>
        </div>
        <div className='min-w-0 space-y-2'>
          <p className='truncate font-okx font-medium text-foreground text-sm'>
            {event.subject ?? event.target ?? event.resourceId}
          </p>
        </div>

        <div className='flex items-center justify-between gap-4 sm:justify-end'>
          <div className='min-w-0 text-sm'>
            <p className='truncate text-foreground/75'>{event.target ?? 'No recipient recorded'}</p>
          </div>
          <span className='flex size-8 shrink-0 items-center justify-center text-muted-foreground'>
            <Icon name='chevron-right' className='size-4 transition-transform duration-150 group-open:rotate-45' />
          </span>
        </div>
      </summary>

      <div className='bg-zinc-200 dark:bg-zinc-800 pt-1'>
        <dl className='grid bg-background/75 ring-1 ring-foreground/8 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-border/50'>
          <EventDetail
            label='Webhook ID'
            value={event.webhookId}
            mono
            copyFn={handleCopy('Webhook ID', event.webhookId)}
            copied={copiedLabel === 'Webhook ID'}
          />
          <EventDetail
            label='Resource ID'
            value={event.resourceId}
            mono
            copyFn={handleCopy('Resource ID', event.resourceId)}
            copied={copiedLabel === 'Resource ID'}
          />
          <EventDetail
            label='Event time'
            value={formatDate(event.eventCreatedAt)}
            copyFn={handleCopy('Event time', formatDate(event.eventCreatedAt))}
            copied={copiedLabel === 'Event time'}
          />
          <EventDetail
            label='Source'
            value={event.source ?? 'Not provided'}
            copyFn={handleCopy('Source', event.source ?? 'Not provided')}
            copied={copiedLabel === 'Source'}
          />
          <EventDetail
            label='Target'
            value={event.target ?? 'Not provided'}
            copyFn={handleCopy('Target', event.target ?? 'Not provided')}
            copied={copiedLabel === 'Target'}
          />
          <EventDetail
            label='Recipients'
            value={event.recipientCount === undefined ? 'Not applicable' : String(event.recipientCount)}
          />
          {event.detail ? <EventDetail label='Event detail' value={event.detail} /> : null}
        </dl>
      </div>
    </details>
  )
}

interface EventDetailProps {
  label: string
  mono?: boolean
  value: string
  copyFn?: VoidFunction
  copied?: boolean
}

function EventDetail({ label, mono, value, copyFn, copied }: EventDetailProps) {
  return (
    <button
      onClick={copyFn}
      className='min-w-0 space-y-1 hover:bg-slate-200/80  hover:dark:bg-zinc-900 py-4 px-6 text-left'>
      <dt className='font-ios text-[10px] uppercase tracking-[0.16em] text-muted-foreground'>
        {label} <span className='font-medium text-blue-600 opacity-100 text-[11px]'>{copied && ' ✓'}</span>
      </dt>
      <dd className={cn('wrap-break-word text-sm text-foreground/80', { 'font-mono text-xs': mono })}>{value}</dd>
    </button>
  )
}

function WebhookListSkeleton() {
  return (
    <div className='border-t border-border/60' aria-label='Loading webhook events'>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className='grid gap-3 border-b border-border/50 px-4 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] sm:px-6'>
          <div className='space-y-3'>
            <div className='h-5 w-32 animate-pulse rounded-full bg-muted' />
            <div className='h-4 w-3/4 animate-pulse rounded bg-muted' />
          </div>
          <div className='space-y-2'>
            <div className='h-4 w-40 animate-pulse rounded bg-muted' />
            <div className='h-3 w-28 animate-pulse rounded bg-muted' />
          </div>
          <div className='h-4 w-28 animate-pulse rounded bg-muted' />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className='flex min-h-72 flex-col items-center justify-center border-t border-border/60 px-5 py-14 text-center'>
      <div className='flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500'>
        <Icon name={hasSearch ? 'search' : 'webhook'} className='size-5' />
      </div>
      <h3 className='mt-4 font-poly text-base font-medium'>
        {hasSearch ? 'No matching events' : 'No webhooks received yet'}
      </h3>
      <p className='mt-2 max-w-sm text-sm leading-6 text-muted-foreground'>
        {hasSearch
          ? 'Try another email, subject, event type, or webhook ID.'
          : 'Verified Resend events will appear here as soon as they reach the webhook endpoint.'}
      </p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className='flex min-h-72 flex-col items-center justify-center border-t border-border/60 px-5 py-14 text-center'
      role='alert'>
      <div className='flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
        <Icon name='close' className='size-5' />
      </div>
      <h3 className='mt-4 font-poly text-base font-medium'>Webhook events could not be loaded</h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>{message}</p>
      <Button type='button' variant='outline' size='sm' onClick={onRetry} className='mt-5'>
        <Icon name='refresh' className='size-4' />
        Try again
      </Button>
    </div>
  )
}
