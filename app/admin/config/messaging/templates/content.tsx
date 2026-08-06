'use client'

import { api } from '@/convex/_generated/api'
import { useConvexSnapshotQuery } from '@/hooks/use-convex-snapshot-query'
import { Suspense } from 'react'
import { EmailTemplateList } from './email-templates'

const EmailContentInner = () => {
  const { data } = useConvexSnapshotQuery(api.messagingConfigs.q.listMessagingConfigs, {})
  return <EmailTemplateList templates={data} />
}

export const EmailTemplateContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailContentInner />
    </Suspense>
  )
}
