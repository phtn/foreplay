import { CreateEventForm } from '@/app/admin/config/_contents/create-event-form'
import { api } from '@/convex/_generated/api'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface EditEventPageProps {
  params: Promise<{ eventId: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const [{ eventId }] = await Promise.all([params, requireAdminSession()])
  const eventDetails = await fetchQuery(api.tournaments.q.getForEditing, { id: eventId })

  if (!eventDetails?.event.id) notFound()

  const { event, coverPhotoUrl, ticketLogoUrl } = eventDetails
  const initialEvent = {
    _id: event._id,
    id: eventId,
    title: event.title,
    venue: event.venue,
    gate_open_at: event.gate_open_at,
    registration_fee: event.registration_fee,
    slots_limit: event.slots_limit,
    divisions: event.divisions,
    description: event.description,
    published: event.published,
    ticket_logo_url: event.ticket_logo_url,
    cover_photo_url: event.cover_photo_url
  }

  return (
    <main className='space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8'>
      <header className='space-y-2'>
        <Link href={`/admin/${encodeURIComponent(eventId)}`} className='text-sm text-muted-foreground underline-offset-4 hover:underline'>
          Back to event
        </Link>
        <div>
          <h1 className='font-poly text-2xl sm:text-3xl'>Edit {event.title}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>Update event details, registration settings, and images.</p>
        </div>
      </header>
      <CreateEventForm event={initialEvent} initialCoverUrl={coverPhotoUrl} initialLogoUrl={ticketLogoUrl} />
    </main>
  )
}
