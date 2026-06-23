import { Brand } from '@/components/layouts/brand'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import {
  getHostnameFromHostHeader,
  isAdminSubdomainHostname,
  stripAdminSubdomain
} from '@/lib/routing/admin-subdomain'
import { cn } from '@/lib/utils'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Operational access for Foreplay administrators.'
}

async function getAdminRouteContext() {
  const headerStore = await headers()
  const hostHeader = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const hostname = getHostnameFromHostHeader(hostHeader)

  if (!hostHeader) {
    return {
      appHomeHref: '/',
      hostname: null,
      routeMode: 'Path route'
    }
  }

  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  const appUrl = new URL(`${protocol}://${hostHeader}`)
  appUrl.hostname = stripAdminSubdomain(appUrl.hostname)
  appUrl.pathname = '/'
  appUrl.search = ''
  appUrl.hash = ''

  return {
    appHomeHref: appUrl.toString(),
    hostname,
    routeMode: hostname && isAdminSubdomainHostname(hostname) ? 'Admin subdomain' : 'Path route'
  }
}

export default async function AdminPage() {
  const [session, routeContext] = await Promise.all([requireAdminSession(), getAdminRouteContext()])
  const adminIdentity = session.decodedToken.email ?? session.decodedToken.sub

  return (
    <main className='min-h-screen bg-background'>
      <div className='mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8'>
        <header className='flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Brand />
            <div className='space-y-1'>
              <p className='font-ios text-xs uppercase tracking-widest text-sky-500'>Foreplay Admin</p>
              <p className='text-sm text-muted-foreground'>Restricted operations route for verified admin accounts.</p>
            </div>
          </div>

          <div className='flex items-center gap-2 self-start sm:self-center'>
            <ThemeToggle />
            <Link href={routeContext.appHomeHref} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Player app
            </Link>
            <div className='flex h-8 items-center rounded-lg border border-border/70 px-2'>
              <SignOutButton />
            </div>
          </div>
        </header>

        <section className='space-y-2'>
          <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Operations</p>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>Admin Home</h1>
          <p className='max-w-3xl text-sm text-muted-foreground'>
            This route is the admin entry point. On an admin subdomain, the external `/` path is rewritten here. On
            hosts without subdomain handoff, the fallback path is `/admin`.
          </p>
        </section>

        <section className='grid gap-4 md:grid-cols-3'>
          {[
            {
              label: 'Access',
              value: 'Admin session active',
              note: 'Server-side guard is enforcing the route.'
            },
            {
              label: 'Mode',
              value: routeContext.routeMode,
              note: routeContext.hostname ?? 'Hostname unavailable'
            },
            {
              label: 'Identity',
              value: adminIdentity,
              note: 'Derived from the verified Firebase session.'
            }
          ].map((item) => (
            <Card key={item.label} className='border-border/70'>
              <CardContent className='space-y-2 p-5'>
                <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>{item.label}</p>
                <p className='font-heading text-2xl font-bold tracking-tight'>{item.value}</p>
                <p className='text-sm text-muted-foreground'>{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className='grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>What this route does</CardTitle>
              <CardDescription>Establishes the admin-only landing page and the correct routing boundary.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3'>
              {[
                'Requires a verified Firebase session with the admin custom claim.',
                'Works for both the internal `/admin` path and the admin subdomain rewrite.',
                'Keeps a direct escape hatch back to the main player-facing app.'
              ].map((item) => (
                <div key={item} className='flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4'>
                  <div className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icon name='check' className='size-4' />
                  </div>
                  <p className='text-sm text-muted-foreground'>{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className='border-border/70 bg-linear-to-br from-primary/8 via-background to-sky-500/8'>
            <CardHeader>
              <CardTitle className='text-xl'>Next routes</CardTitle>
              <CardDescription>Admin child pages can now be added under `app/admin/*` without changing routing.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {[
                'Subscriptions review queue',
                'Tournament publishing controls',
                'Wallet and payout settings'
              ].map((item) => (
                <div key={item} className='rounded-2xl border border-border/70 bg-card/80 px-4 py-3'>
                  <p className='font-okx text-sm text-foreground/85'>{item}</p>
                </div>
              ))}

              <Link
                href={routeContext.appHomeHref}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'mt-2 w-full justify-center')}>
                Open player app
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
