import type { Metadata } from 'next'
import Link from 'next/link'

import ProtectedLayout from '@/ctx/protected'
import { findTournament } from '@/components/protected/tournament-experience'
import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface SponsorshipPageProps {
  params: Promise<{ tourId: string }>
}

export async function generateMetadata({ params }: SponsorshipPageProps): Promise<Metadata> {
  const { tourId } = await params
  const tournament = findTournament(tourId)

  return {
    title: `${tournament.title} | Sponsorship`,
    description: tournament.partnerPitch ?? `${tournament.title} sponsor packages and corporate partnership details.`
  }
}

export default async function SponsorshipPage({ params }: SponsorshipPageProps) {
  const { tourId } = await params
  const tournament = findTournament(tourId)
  const tiers = tournament.sponsorshipTiers ?? []
  const primaryTier = tiers[0]

  return (
    <ProtectedLayout>
      <main className='space-y-6 md:space-y-8'>
        <Card className='relative overflow-hidden border-border/70 bg-card'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.14),transparent_62%)]' />
          <CardContent className='relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end'>
            <div className='space-y-5'>
              <Badge variant='secondary' radius='full' className='bg-primary/10 text-primary'>
                Corporate partnership
              </Badge>
              <div className='space-y-3'>
                <h1 className='max-w-4xl font-poly text-3xl font-semibold tracking-tight sm:text-5xl'>
                  {tournament.title}
                </h1>
                <p className='max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base'>
                  {tournament.partnerPitch ??
                    'Sponsor packages, playing access, and brand placement inventory for this tournament.'}
                </p>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Link
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full gap-2 sm:w-auto')}
                  href='#sponsor-confirmation'>
                  Request package
                  <Icon name='arrow-right' className='size-4' />
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}
                  href={`/tournaments/${tournament.id}`}>
                  Back to tournament
                </Link>
              </div>
            </div>

            <div className='grid gap-3 rounded-3xl border border-border/70 bg-background/75 p-4'>
              {[
                { label: 'Venue', value: tournament.venue, icon: 'golf-flag' as const },
                { label: 'Date', value: tournament.dateLabel, icon: 'clock' as const },
                { label: 'Format', value: tournament.formatLabel, icon: 'trophy' as const },
                { label: 'Top package', value: primaryTier?.investmentLabel ?? 'Available', icon: 'coins' as const }
              ].map((metric) => (
                <div key={metric.label} className='flex items-start gap-3 rounded-2xl bg-muted/30 p-3'>
                  <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icon name={metric.icon} className='size-4' />
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>{metric.label}</p>
                    <p className='mt-1 text-sm font-medium'>{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {tournament.overviewFacts?.length ? (
          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Tournament facts sponsors care about</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-3'>
              {tournament.overviewFacts.map((fact) => (
                <div
                  key={fact.label}
                  className='grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-[220px_1fr] sm:items-center'>
                  <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>{fact.label}</p>
                  <p className='font-medium'>{fact.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {tournament.partnerReasons?.length ? (
          <section className='grid gap-4 md:grid-cols-3'>
            {tournament.partnerReasons.map((reason) => (
              <Card key={reason.title} className='border-border/70'>
                <CardContent className='space-y-3 p-5'>
                  <div className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icon name='check' className='size-5' />
                  </div>
                  <h2 className='font-heading text-lg font-semibold'>{reason.title}</h2>
                  <p className='text-sm leading-6 text-muted-foreground'>{reason.description}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}

        <Card className='border-border/70'>
          <CardHeader>
            <CardTitle className='text-xl'>Sponsorship packages and privileges</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {tiers.length ? (
              tiers.map((tier) => (
                <article
                  key={tier.name}
                  className='grid gap-4 rounded-3xl border border-border/70 bg-muted/15 p-4 lg:grid-cols-[180px_170px_170px_1fr]'>
                  <div>
                    <p className='font-heading text-xl font-semibold'>{tier.name}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>Investment</p>
                    <p className='mt-2 font-semibold'>{tier.investmentLabel}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>Playing access</p>
                    <p className='mt-2 font-semibold'>{tier.playingAccess}</p>
                    {tier.accessNote ? <p className='text-sm text-muted-foreground'>{tier.accessNote}</p> : null}
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>Branding benefits</p>
                    <ul className='mt-3 space-y-2 text-sm leading-6 text-muted-foreground'>
                      {tier.benefits.map((benefit) => (
                        <li key={benefit} className='flex gap-2'>
                          <span className='mt-2 size-1.5 shrink-0 rounded-full bg-primary' />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))
            ) : (
              <div className='rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground'>
                Sponsorship packages have not been published for this tournament yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card id='sponsor-confirmation' className='border-border/70'>
          <CardHeader>
            <CardTitle className='text-xl'>Sponsorship confirmation</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <p className='max-w-3xl text-sm leading-7 text-muted-foreground'>
              Capture the same commitment data as the proposal reply block. The lead schema and mutation are ready for
              this form when the client-side Convex provider is introduced.
            </p>
            <div className='grid gap-4 rounded-3xl border border-dashed border-border bg-muted/20 p-5 sm:grid-cols-2'>
              {[
                'Company name',
                'Authorized signatory',
                'Contact number',
                'Preferred tier'
              ].map((label) => (
                <label key={label} className='space-y-2'>
                  <span className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>{label}</span>
                  <input
                    className='h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'
                    placeholder={label}
                    readOnly
                  />
                </label>
              ))}
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Link
                className={cn(buttonVariants({ size: 'lg' }), 'w-full gap-2 sm:w-auto')}
                href={`mailto:${tournament.sponsorContact?.emailLabel ?? 'sponsors@example.com'}?subject=${encodeURIComponent(
                  `${tournament.title} sponsorship inquiry`
                )}`}>
                Email secretariat
                <Icon name='mail' className='size-4' />
              </Link>
              <Link
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}
                href={`/tournaments/${tournament.id}`}>
                Review tournament details
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </ProtectedLayout>
  )
}
