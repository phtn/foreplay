'use client'

import { Button } from '@/components/ui/button'
import { useFirebaseConvexAuth } from '@/hooks/use-firebase-convex-auth'
import { auth } from '@/lib/firebase/config'
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth } from 'convex/react'
import { signInWithCustomToken } from 'firebase/auth'
import { useCallback, useState } from 'react'
import { ReportsWorkspace } from './reports-workspace'
import { Panel, ReportMessage } from './report-ui'

const reportsClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

type Props = { eventId: string; eventUrl: string; expectedUid: string }

export function ReportsProvider(props: Props) {
  const firebaseAuth = useFirebaseConvexAuth(props.expectedUid)
  const useAuth = useCallback(() => firebaseAuth, [firebaseAuth])

  return (
    <ConvexProviderWithAuth client={reportsClient} useAuth={useAuth}>
      <AuthenticatedReports {...props} />
    </ConvexProviderWithAuth>
  )
}

function AuthenticatedReports({ eventId, eventUrl }: Props) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setConnecting(true)
    setError('')
    try {
      if (!auth) throw new Error('Firebase unavailable')
      const response = await fetch('/api/auth/admin-client-token', { method: 'POST' })
      if (!response.ok) throw new Error('Session unavailable')
      const { token } = await response.json() as { token: string }
      await signInWithCustomToken(auth, token)
    } catch {
      setError('Unable to connect. Refresh the page or sign in again.')
    } finally {
      setConnecting(false)
    }
  }

  if (isLoading) return <ReportMessage>Connecting to tournament reports…</ReportMessage>

  if (!isAuthenticated) {
    return (
      <Panel title='Connect your session'>
        <p className='mb-3 text-sm text-muted-foreground'>Connect the account you used to open this tournament.</p>
        <Button type='button' disabled={connecting} onClick={() => void connect()}>Connect session</Button>
        <p role='status' className='text-sm text-destructive'>{error}</p>
      </Panel>
    )
  }

  return <ReportsWorkspace eventId={eventId} eventUrl={eventUrl} />
}
