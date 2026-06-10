import ProtectedLayout from '@/ctx/protected'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LeaderboardCard,
  MetricGrid,
  leaderboardRows,
  recordMetrics,
  SectionTitle
} from '@/components/protected/tournament-experience'
import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

export default function RecordsPage() {
  return (
    <ProtectedLayout>
      <div className='space-y-8'>
        <SectionTitle
          eyebrow='Season records'
          title='Turn performance into something players want to chase'
          description='The records page should feel like a scoreboard, not a spreadsheet.'
        />

        <MetricGrid metrics={recordMetrics} />

        <div className='grid gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
          <LeaderboardCard rows={leaderboardRows} />

          <div className='space-y-4'>
            <Card className='border-border/70 bg-muted/20'>
              <CardHeader>
                <CardTitle className='text-xl'>How the leaderboard is framed</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {[
                  'Show the players who are setting the pace.',
                  'Keep score context visible with club and note.',
                  'Use the board as proof that the tournament has real competitive value.'
                ].map((item) => (
                  <div key={item} className='flex gap-3 rounded-2xl border border-border/60 bg-card p-4'>
                    <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <Icon name='check' className='size-4' />
                    </div>
                    <p className='text-sm text-muted-foreground'>{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className='border-border/70'>
              <CardContent className='space-y-4 p-5'>
                <p className='text-xs uppercase tracking-[0.24em] text-primary/80'>Keep the field active</p>
                <h3 className='font-heading text-2xl font-bold'>Invite players back to the next open event</h3>
                <p className='text-sm text-muted-foreground'>
                  The records screen should funnel players back into registration without losing the premium tone.
                </p>
                <div className='flex flex-wrap gap-3'>
                  <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href='/tournaments'>
                    Browse events
                    <Icon name='arrow-right' className='size-4' />
                  </Link>
                  <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href='/entries'>
                    Check my tickets
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
