import ProtectedLayout from '@/ctx/protected'
import Link from 'next/link'

import { EntryCard, SectionTitle, protectedEntries } from '@/components/protected/tournament-experience'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

const entryStats = [
  { label: 'Confirmed', value: '1', note: 'Ready to tee off' },
  { label: 'Pending payment', value: '1', note: 'Awaiting receipt upload' },
  { label: 'Needs verification', value: '1', note: 'Manual review queued' },
  { label: 'Entries total', value: '3', note: 'Across the season' }
]

export default function EntriesPage() {
  return (
    <ProtectedLayout>
      <div className='space-y-8'>
        <SectionTitle
          eyebrow='My entries'
          title='Everything a player needs before the first tee'
          description='Keep the status, payment, and next action visible so the registration never feels uncertain.'
        />

        <div className='grid md:gap-4 grid-cols-4'>
          {entryStats.map((stat) => (
            <Card key={stat.label} size='sm' className='border-border/70'>
              <CardContent className='space-y-2 p-4'>
                <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>{stat.label}</p>
                <p className='font-heading text-3xl font-bold tracking-tight'>{stat.value}</p>
                <p className='text-sm text-muted-foreground'>{stat.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='space-y-4'>
            <Card className='border-border/70 bg-linear-to-br from-primary/8 via-background to-amber-500/5'>
              <CardHeader>
                <CardTitle className='text-2xl'>Your registration queue</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {protectedEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className='space-y-4'>
            <Card className='border-border/70'>
              <CardHeader>
                <CardTitle className='text-xl'>Payment workflow</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {[
                  'Open the entry card and confirm the division.',
                  'Upload the receipt as soon as payment is sent.',
                  'Wait for verification before pairings are released.'
                ].map((step, index) => (
                  <div key={step} className='flex gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4'>
                    <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary'>
                      {index + 1}
                    </div>
                    <p className='text-sm text-muted-foreground'>{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className='border-border/70'>
              <CardContent className='space-y-4 p-5'>
                <p className='text-xs uppercase tracking-[0.24em] text-primary/80'>Need another slot?</p>
                <h3 className='font-heading text-2xl font-bold'>Browse open events and reserve the next tee time</h3>
                <p className='text-sm text-muted-foreground'>Keep the path from interest to confirmation short.</p>
                <div className='flex flex-wrap gap-3'>
                  <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href='/tournaments'>
                    Browse tournaments
                    <Icon name='arrow-right' className='size-4' />
                  </Link>
                  <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href='/records'>
                    View leaderboard
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
