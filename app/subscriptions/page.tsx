import { api } from '@/convex/_generated/api'
import ProtectedLayout from '@/ctx/protected'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseTokenIdentifier } from '@/lib/firebase/server-session'
import { fetchQuery } from 'convex/nextjs'
import { Metadata } from 'next'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'Subscriptions',
  description: 'View tournament subscription status and payment review details.',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}

const Page = async () => {
  const session = await getVerifiedFirebaseSession()
  const userId = session ? buildFirebaseTokenIdentifier(session.decodedToken) : ''
  const subscriptions = userId ? await fetchQuery(api.subscriptions.q.listByUserId, { userId }) : []

  return (
    <ProtectedLayout>
      <Content subscriptions={subscriptions} />
    </ProtectedLayout>
  )
}
export default Page
