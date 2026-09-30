import { EventsList } from '@/components/admin/events-list'
import { Card, CardContent } from '@/components/ui/card'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'

interface ContentProps {
  events: Doc<'tournaments'>[] | undefined
}

export const Content = ({ events }: ContentProps) => {
  const tournamentList = events ?? []

  const counts = tournamentList.reduce(
    (acc, event) => {
      acc.total += 1
      if (event.published === false) {
        acc.drafts += 1
      } else {
        acc.published += 1
      }

      if (event.published !== false && event.slots_limit && event.registered_slots >= event.slots_limit) {
        acc.full += 1
      }

      return acc
    },
    { total: 0, published: 0, drafts: 0, full: 0 }
  )

  return (
    <div className='space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8'>
      <header className='space-y-1'>
        <h1 className='font-poly text-xl text-foreground sm:text-2xl'>Tournaments</h1>
      </header>

      <section aria-label='Tournament overview' className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {[
          { label: 'Events', value: counts.total },
          { label: 'Published', value: counts.published },
          { label: 'Drafts', value: counts.drafts },
          { label: 'Full', value: counts.full }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='min-w-0 rounded-lg bg-card py-4! ring-border/60'>
            <CardContent className='space-y-2 px-4! sm:px-5!'>
              <p className='font-ios text-[11px] uppercase tracking-wider text-muted-foreground'>{stat.label}</p>
              <p className='font-poly text-2xl leading-none tabular-nums sm:text-3xl'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby='events-heading' className='space-y-8'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div className='space-y-1'>
            <h2 id='events-heading' className='font-poly text-xl text-foreground sm:text-2xl'>
              Events
            </h2>
          </div>
          <p className='font-ios text-xs uppercase tracking-wider text-muted-foreground'>
            {counts.total} {counts.total === 1 ? 'event' : 'events'}
          </p>
        </div>

        <Card className='rounded-lg bg-card dark:bg-transparent p-0! ring-0'>
          <CardContent className='px-0!'>
            {tournamentList.length ? (
              <EventsList data={tournamentList} />
            ) : (
              <div className='flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center'>
                <Icon name='trophy-line' className='size-10 text-foreground/50' />
                <div className='space-y-1'>
                  <p className='font-okx text-base'>No tournaments yet</p>
                  <p className='text-sm text-muted-foreground'>Seed or create an event to populate the admin queue.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
