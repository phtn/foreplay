import { api } from '@/convex/_generated/api'
import { requireGateScannerSession } from '@/lib/firebase/server-auth'
import { formatEventDate } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReportsProvider } from './reports-provider'

export const metadata: Metadata = { title: 'Tournament reports' }

export default async function ReportsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [{ eventId }, session] = await Promise.all([params, requireGateScannerSession()])
  const event = await fetchQuery(api.tournaments.q.getByTournamentId, { id: eventId })
  if (!event) notFound()

  const eventUrl = `/admin/${encodeURIComponent(eventId)}`
  const admin = session.customClaims.admin === true

  return (
    <main className='mx-auto w-full max-w-6xl space-y-7 px-4 pb-16 pt-3 sm:px-6 lg:px-8'>
      <header className='space-y-4'>
        <Link href={admin ? eventUrl : '/admin/scanner'} className='inline-flex min-h-9 items-center gap-2 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:underline'>
          <span aria-hidden='true'>←</span> {admin ? 'Back to tournament' : 'Back to gate scanner'}
        </Link>
        <div>
          <p className='mb-1 text-sm font-medium text-muted-foreground'>Tournament reports</p>
          <h1 className='font-poly text-3xl tracking-tight sm:text-4xl'>{event.title}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            {[formatEventDate(event.gate_open_at, event.event_date), event.venue].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>
      <ReportsProvider eventId={eventId} eventUrl={eventUrl} expectedUid={session.decodedToken.uid} />
    </main>
  )
}
