import { EventsList } from '@/components/admin/events-list'
import { Card, CardContent } from '@/components/ui/card'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

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
    <main className='md:space-y-8'>
      <div className='grid xl:gap-4 grid-cols-4 xl:grid-cols-4'>
        {[
          { label: 'Events', value: counts.total },
          { label: 'Published', value: counts.published },
          { label: 'Drafts', value: counts.drafts },
          { label: 'Slots', value: counts.registeredSlots }
        ].map((stat) => (
          <Card key={stat.label} size='sm' className='bg-border/10 border-[0.33px] p-0! rounded-xs md:rounded-lg'>
            <CardContent className='space-y-1 p-2!'>
              <p className='font-ios text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground'>
                {stat.label}
              </p>
              <p className='font-heading text-base md:text-xl font-bold'>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex justify-end py-3 md:py-0'>
        <Link
          href='/admin/scanner'
          className='inline-flex h-10 items-center gap-2 rounded-lg border border-border/70 bg-background px-3 font-okx text-sm transition-colors hover:bg-muted'>
          <Icon name='ticket' className='size-4' />
          Gate scanner
        </Link>
      </div>

      <Card className='p-0 md:py-1 bg-border/10 rounded-xs md:rounded-xl'>
        <CardContent className='px-0 rounded-xs md:rounded-xl border-0'>
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
