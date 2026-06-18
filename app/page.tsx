'use client'

import { Brand } from '@/components/layouts/brand'
import { Navbar, NavItem } from '@/components/layouts/navbar'
import { featuredTournament, SectionTitle, TournamentCard } from '@/components/protected/tournament-experience'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const landingMetrics = [
  { label: 'Players waiting', value: '132', note: 'Ready to convert into paid entries' },
  { label: 'Open fields', value: '3', note: 'Active events with live inventory' },
  { label: 'Sponsor value', value: 'Premium', note: 'Built to look and feel exclusive' }
]

const sellingPoints = [
  {
    icon: 'golf-flag' as const,
    title: 'Events that feel worth joining',
    description: 'Present the purse, venue, and format up front so golfers know the event is serious before they click.'
  },
  {
    icon: 'ticket' as const,
    title: 'Registration that stays simple',
    description: 'Move from interest to entry without bouncing through extra pages or unclear account flows.'
  },
  {
    icon: 'trophy' as const,
    title: 'A better reason to come back',
    description:
      'Keep the tournament, leaderboard, and follow-up entry path in one place so the experience feels connected.'
  }
]

export default function HomePage() {
  const GUEST_NAV_ITEMS: NavItem[] = [
    { value: '/events', label: 'Events', icon: 'home-line' },
    { value: '/tournaments', label: 'Tournaments', icon: 'flag-line' },
    { value: '/winners', label: 'Winners', icon: 'trophy-line' }
  ]
  const pathname = usePathname()
  return (
    <div className='relative isolate min-h-dvh overflow-hidden bg-background'>
      <header className='relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8'>
        <Brand />

        <Navbar pathname={pathname} items={GUEST_NAV_ITEMS} />

        <div className='flex items-center space-x-2'>
          <ThemeToggle />
          <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2 px-4')} href='/auth'>
            Sign in
            <Icon name='arrow-right' className='size-4' />
          </Link>
        </div>
      </header>

      <main className='relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pb-24'>
        <section className='grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
          <div className='space-y-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-primary'>
              <span className='size-2 rounded-full bg-primary' />
              Public entry experience
            </div>

            <div className='space-y-5'>
              <h1 className='max-w-3xl font-poly text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl'>
                A landing page that sells the event before sign-in.
              </h1>
              <p className='max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg'>
                Foreplay gives golfers a clear reason to register, a cleaner path into the event, and a better way to
                understand what they are joining. The home page stays public. Auth only opens when a player chooses to
                sign in.
              </p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row'>
              <Link className={cn(buttonVariants({ size: 'xl' }), 'gap-2 px-6')} href='/auth'>
                Sign in
                <Icon name='arrow-right' className='size-4' />
              </Link>
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'px-6')} href='/tournaments'>
                Explore tournaments
              </Link>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              {landingMetrics.map((metric) => (
                <Card key={metric.label} className='border-border/70 bg-card/80 shadow-sm backdrop-blur'>
                  <CardContent className='space-y-2 p-5'>
                    <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>{metric.label}</p>
                    <p className='font-poly text-3xl font-semibold tracking-tight text-foreground'>{metric.value}</p>
                    <p className='text-sm leading-6 text-muted-foreground'>{metric.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className='relative overflow-hidden border-border/70 bg-card/95 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.65)]'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.14),transparent_55%)]' />
            <div className='absolute inset-0 bg-[url("/noise.svg")] opacity-10' />
            <CardContent className='relative space-y-6 p-6 sm:p-8'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>Featured event</p>
                  <p className='mt-2 font-poly text-2xl font-semibold tracking-tight'>{featuredTournament.title}</p>
                </div>
                <div className='rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary'>
                  Open now
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                {[
                  { label: 'Venue', value: featuredTournament.venue },
                  { label: 'Date', value: featuredTournament.dateLabel },
                  { label: 'Format', value: featuredTournament.formatLabel },
                  { label: 'Fee', value: featuredTournament.feeLabel }
                ].map((item) => (
                  <div key={item.label} className='rounded-2xl border border-border/60 bg-background/70 p-4'>
                    <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>{item.label}</p>
                    <p className='mt-2 font-medium text-foreground'>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className='space-y-3 rounded-3xl border border-border/60 bg-background/70 p-4'>
                {['Clear registration', 'Visible inventory', 'Premium presentation'].map((item) => (
                  <div key={item} className='flex items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <Icon name='check' className='size-4' />
                    </div>
                    <p className='text-sm text-muted-foreground'>{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className='mt-16 space-y-6 lg:mt-24'>
          <SectionTitle
            eyebrow='Why it works'
            title='The page introduces the product before it asks for a login'
            description='That keeps the first touch public, gives context to the event, and leaves auth as an intentional next step.'
          />

          <div className='grid gap-4 lg:grid-cols-3'>
            {sellingPoints.map((point) => (
              <Card key={point.title} className='border-border/70 bg-card/90'>
                <CardContent className='space-y-4 p-6'>
                  <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                    <Icon name={point.icon} className='size-6' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='font-heading text-xl font-semibold tracking-tight'>{point.title}</h2>
                    <p className='text-sm leading-6 text-muted-foreground'>{point.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className='mt-16 space-y-6 lg:mt-24'>
          <SectionTitle
            eyebrow='Current inventory'
            title='Keep the current event visible on the public home page'
            description='Visitors can review the featured tournament, then decide whether they want to sign in and continue.'
          />
          <TournamentCard tournament={featuredTournament} />
        </section>

        <section className='mt-16 rounded-4xl border border-border/70 bg-card/90 p-6 sm:p-8 lg:mt-24 lg:p-10'>
          <div className='grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center'>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-[0.24em] text-primary/80'>Ready to continue</p>
              <h2 className='font-poly text-3xl font-semibold tracking-tight sm:text-4xl'>
                Sign in when you are ready to register.
              </h2>
              <p className='max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base'>
                Everything else stays visible without forcing an auth round-trip. That gives the landing page a real
                purpose and keeps the entry flow focused.
              </p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row'>
              <Link className={cn(buttonVariants({ size: 'lg' }), 'gap-2 px-5')} href='/auth'>
                Sign in
                <Icon name='arrow-right' className='size-4' />
              </Link>
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-5')} href='/records'>
                View scorecard
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
