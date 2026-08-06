'use client'

import { SectionTitle } from '@/components/layouts/title'
import { api } from '@/convex/_generated/api'
import { useConvexSnapshotQuery } from '@/hooks/use-convex-snapshot-query'
import { Icon } from '@/lib/icons'
import { AnimatePresence, motion } from 'motion/react'
import { Suspense } from 'react'

const BroadcastContentInner = () => {
  const { data } = useConvexSnapshotQuery(api.messagingConfigs.q.listMessagingConfigs, {})
  if (data === undefined) {
    return (
      <div className='flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex items-center gap-3 opacity-50'>
          <Icon name='spinner-ring' className='size-5' />
          Loading Broadcasting Form...
        </motion.div>
      </div>
    )
  }
  return (
    <div className='min-h-screen'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-8 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl' />
      </div>

      <main className='relative px-2 sm:px-3 lg:px-4 space-y-4'>
        <AnimatePresence mode='wait'>
          {data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='rounded-sm h-auto bg-slate-100 dark:bg-zinc-800 border border-foreground/20 sm:p-4 p-4'>
              <div className='flex items-center gap-4'>
                <Icon name='e-mail' className='size-8 md:size-9 opacity-60' />
                <SectionTitle title='Broadcasting' eyebrow='Messaging' />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}

export const BroadcastContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BroadcastContentInner />
    </Suspense>
  )
}
