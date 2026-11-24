'use client'

import { api } from '@/convex/_generated/api'
import { Tabs } from '@base-ui/react/tabs'
import { useQuery } from 'convex/react'
import { CloseoutReport } from './closeout-report'
import { FinanceReport } from './finance-report'
import { FollowUpsReport } from './follow-ups-report'
import { OperationsReport } from './operations-report'
import { ReportMessage } from './report-ui'

const tabClass = 'min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-active:bg-card data-active:text-foreground data-active:shadow-sm'
const panelClass = 'mt-5 rounded-xl focus-visible:outline-2 focus-visible:outline-ring'

export function ReportsWorkspace({ eventId, eventUrl }: { eventId: string; eventUrl: string }) {
  const operations = useQuery(api.tournamentReports.q.operations, { tournamentId: eventId })
  if (!operations) return <ReportMessage>Loading tournament reports…</ReportMessage>

  if (!operations.admin) return <OperationsReport eventId={eventId} eventUrl={eventUrl} data={operations} />

  return (
    <Tabs.Root defaultValue='operations'>
      <Tabs.List aria-label='Tournament report views' className='flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-border bg-muted/60 p-1'>
        <Tabs.Tab value='operations' className={tabClass}>Operations</Tabs.Tab>
        {operations.finance ? <Tabs.Tab value='accounting' className={tabClass}>Accounting</Tabs.Tab> : null}
        <Tabs.Tab value='follow-ups' className={tabClass}>Results and follow-ups</Tabs.Tab>
        <Tabs.Tab value='closeout' className={tabClass}>Closeout</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value='operations' className={panelClass}>
        <OperationsReport eventId={eventId} eventUrl={eventUrl} data={operations} />
      </Tabs.Panel>
      {operations.finance ? (
        <Tabs.Panel value='accounting' className={panelClass}><FinanceReport eventId={eventId} /></Tabs.Panel>
      ) : null}
      <Tabs.Panel value='follow-ups' className={panelClass}>
        <FollowUpsReport eventId={eventId} eventUrl={eventUrl} awards={operations.awards} finance={operations.finance} />
      </Tabs.Panel>
      <Tabs.Panel value='closeout' className={panelClass}><CloseoutReport eventId={eventId} finance={operations.finance} /></Tabs.Panel>
    </Tabs.Root>
  )
}
