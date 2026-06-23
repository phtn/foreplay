import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import type { Metadata } from 'next'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Operational access for Foreplay administrators.'
}

// async function getAdminRouteContext() {
//   const headerStore = await headers()
//   const hostHeader = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
//   const hostname = getHostnameFromHostHeader(hostHeader)

//   if (!hostHeader) {
//     return {
//       appHomeHref: '/',
//       hostname: null,
//       routeMode: 'Path route'
//     }
//   }

//   const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
//   const appUrl = new URL(`${protocol}://${hostHeader}`)
//   appUrl.hostname = stripAdminSubdomain(appUrl.hostname)
//   appUrl.pathname = '/'
//   appUrl.search = ''
//   appUrl.hash = ''

//   return {
//     appHomeHref: appUrl.toString(),
//     hostname,
//     routeMode: hostname && isAdminSubdomainHostname(hostname) ? 'Admin subdomain' : 'Path route'
//   }
// }

export default async function AdminPage() {
  // const [session, routeContext] = await Promise.all([requireAdminSession(), getAdminRouteContext()])
  // const adminIdentity = session.decodedToken.email ?? session.decodedToken.sub
  const fetchedEvents = await fetchQuery(api.tournaments.q.listTournaments)

  return (
    <main className='min-h-screen bg-background'>
      <Content events={fetchedEvents} />
    </main>
  )
}
