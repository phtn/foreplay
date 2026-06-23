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
      acc.registeredSlots += event.registered_slots

      if (event.published === false) {
        acc.drafts += 1
      } else {
        acc.published += 1
      }

      if (event.slots_limit && event.registered_slots >= event.slots_limit) {
        acc.full += 1
      }

      return acc
    },
    { total: 0, published: 0, drafts: 0, full: 0, registeredSlots: 0 }
  )

  return (
    <main className='space-y-8'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
        {[
          { label: 'Total', value: counts.total },
          { label: 'Published', value: counts.published },
          { label: 'Drafts', value: counts.drafts },
          { label: 'Full fields', value: counts.full },
          { label: 'Registered slots', value: counts.registeredSlots }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='border-border/70 bg-border/10 p-0'>
            <CardContent className='space-y-1 p-0'>
              <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{stat.label}</p>
              <p className='font-heading text-2xl font-bold'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='border-border/70 p-0'>
        <CardContent>
          {tournamentList.length ? (
            <EventsList data={tournamentList} />
          ) : (
            <div className='flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center'>
              <Icon name='trophy-line' className='size-10 text-muted-foreground/50' />
              <div className='space-y-1'>
                <p className='font-okx text-base'>No tournaments yet</p>
                <p className='text-sm text-muted-foreground'>Seed or create an event to populate the admin queue.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
