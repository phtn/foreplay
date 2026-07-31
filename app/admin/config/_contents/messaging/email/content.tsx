'use client'

import { api } from '@/convex/_generated/api'
import { useConvexSnapshotQuery } from '@/hooks/use-convex-snapshot-query'
import { Suspense } from 'react'

const EmailContentInner = () => {
  const { data: templates } = useConvexSnapshotQuery(api.messagingConfigs.q.listMessagingConfigs, {})
  return <div></div>
}

export const EmailContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailContentInner />
    </Suspense>
  )
}
