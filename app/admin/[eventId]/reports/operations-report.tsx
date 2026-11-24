'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { exportEntries, exportRoster } from './report-export'
import { entryTypeLabel, readable, reportDate, type OperationsData } from './report-format'
import { Field, linkClass, MetricGrid, Panel, ReportTable, selectClass } from './report-ui'

type OperationsSnapshot = Pick<OperationsData, 'summary' | 'divisions' | 'entryTypes' | 'pairings'>

export function AttendanceSummary({ data, closing = false }: { data: OperationsSnapshot; closing?: boolean }) {
  const { summary, divisions, entryTypes, pairings } = data
  return (
    <>
      <MetricGrid metrics={[
        { label: 'Players checked in', value: `${summary.playersCheckedIn} / ${summary.players}`, detail: 'Eligible players' },
        { label: 'Guests checked in', value: `${summary.guestsCheckedIn} / ${summary.guests}`, detail: 'Non-playing guests' },
        closing
          ? { label: 'Player no-shows', value: summary.noShows, detail: 'Eligible players at the cutoff' }
          : { label: 'Awaiting receipt review', value: summary.paymentReview, detail: `${summary.pendingPayment} awaiting payment` },
        { label: 'Without a pairing', value: summary.unassigned, detail: 'Eligible players missing a hole or group' }
      ]} />
      {summary.undatedCheckIns || summary.inactiveCheckIns ? (
        <p className='rounded-lg border border-border bg-muted/30 p-3 text-sm'>
          {summary.undatedCheckIns ? `${summary.undatedCheckIns} eligible check-ins have no timestamp. ` : ''}
          {summary.inactiveCheckIns ? `${summary.inactiveCheckIns} check-ins are outside the eligible roster.` : ''}
        </p>
      ) : null}
      <div className='grid items-start gap-4 lg:grid-cols-2'>
        <Panel title='Attendance by division'>
          <ReportTable caption='Attendance by division' empty='No eligible players yet.' rows={divisions.map((row) => ({ ...row, id: row.label }))} columns={[
            { label: 'Division', value: (row) => row.label },
            { label: 'Players', value: (row) => row.players, numeric: true },
            { label: 'Checked in', value: (row) => row.playersCheckedIn, numeric: true },
            ...(closing ? [{ label: 'No-shows', value: (row: OperationsSnapshot['divisions'][number]) => row.noShows, numeric: true }] : [])
          ]} />
        </Panel>
        <Panel title='Attendance by entry type'>
          <ReportTable caption='Attendance by entry type' empty='No eligible players or guests yet.' rows={entryTypes.map((row) => ({ ...row, id: row.label }))} columns={[
            { label: 'Entry type', value: (row) => entryTypeLabel(row.label) },
            { label: 'Eligible', value: (row) => row.players + row.guests, numeric: true },
            { label: 'Checked in', value: (row) => row.playersCheckedIn + row.guestsCheckedIn, numeric: true }
          ]} />
        </Panel>
      </div>
      <Panel title='Pairing groups'>
        <ReportTable caption='Pairing groups' empty='No eligible players have been assigned to a pairing group.' rows={pairings.map((row) => ({ ...row, id: `${row.hole}-${row.group}` }))} columns={[
          { label: 'Starting hole', value: (row) => row.hole },
          { label: 'Group', value: (row) => row.group },
          { label: 'Players', value: (row) => row.players, numeric: true },
          { label: 'Checked in', value: (row) => row.checkedIn, numeric: true }
        ]} />
      </Panel>
    </>
  )
}

export function AwardsTable({ awards }: { awards: OperationsData['awards'] }) {
  return <ReportTable caption='Podium and awards' empty='No award assignments have been recorded.' rows={awards} columns={[
    { label: 'Award', value: (row) => row.title },
    { label: 'Place', value: (row) => row.position, numeric: true },
    { label: 'Player', value: (row) => row.winner ?? 'Unassigned' }
  ]} />
}

export function OperationsReport({ eventId, eventUrl, data }: { eventId: string; eventUrl: string; data: OperationsData }) {
  const [entryFilter, setEntryFilter] = useState('all')
  const [rosterFilter, setRosterFilter] = useState('eligible')
  const { summary } = data
  const entries = data.entries.filter((row) => entryFilter === 'all' || row.status === entryFilter)
  const roster = data.roster.filter((row) => {
    if (rosterFilter === 'all') return true
    if (rosterFilter === 'eligible') return row.eligibility
    if (rosterFilter === 'unassigned') return row.eligibility && row.entryType !== 'non_playing' && (row.hole === null || row.group === null)
    if (rosterFilter === 'inactive') return !row.eligibility && row.attendance === 'checked_in'
    return row.eligibility && row.attendance === rosterFilter
  })
  const entryLink = (id: string) => `${eventUrl}/players/${encodeURIComponent(id)}`

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>Updates as registrations, pairings, and gate scans change.</p>
        {data.admin ? <Link className={buttonVariants({ variant: 'outline' })} href={`${eventUrl}/pairings`}>Manage pairings</Link> : null}
      </div>
      <AttendanceSummary data={data} />
      {data.admin ? (
        <Panel title='Entries' action={<Button type='button' variant='outline' disabled={!entries.length} onClick={() => exportEntries(`${eventId}-entries-${entryFilter}`, entries)}>Download entries CSV</Button>}>
          <div className='mb-3 flex flex-wrap items-end justify-between gap-3'>
            <Field label='Entry status'>
              <select className={selectClass} value={entryFilter} onChange={(event) => setEntryFilter(event.target.value)}>
                <option value='all'>All entries ({summary.entries})</option>
                <option value='pending_payment'>Pending payment ({summary.pendingPayment})</option>
                <option value='payment_review'>Receipt review ({summary.paymentReview})</option>
                <option value='confirmed'>Confirmed ({summary.confirmed})</option>
                <option value='cancelled'>Cancelled ({summary.cancelled})</option>
                <option value='other'>Other status ({summary.other})</option>
              </select>
            </Field>
          </div>
          <ReportTable key={entryFilter} caption='Tournament entries' empty='No entries match this status.' rows={entries} columns={[
            { label: 'Entry', value: (row) => <Link className={linkClass} href={entryLink(row.id)}>{row.team}</Link> },
            { label: 'Reference', value: (row) => row.reference },
            { label: 'Type', value: (row) => entryTypeLabel(row.entryType) },
            { label: 'Status', value: (row) => readable(row.status) },
            { label: 'Receipt', value: (row) => row.hasReceipt ? 'Uploaded' : '—' },
            { label: 'Requested players', value: (row) => row.requestedPlayers, numeric: true }
          ]} />
        </Panel>
      ) : null}
      <Panel title='Player and guest roster' action={data.admin ? <Button type='button' variant='outline' disabled={!roster.length} onClick={() => exportRoster(`${eventId}-roster-${rosterFilter}`, roster)}>Download roster CSV</Button> : undefined}>
        <div className='mb-3 max-w-64'>
          <Field label='Attendance filter'>
            <select className={selectClass} value={rosterFilter} onChange={(event) => setRosterFilter(event.target.value)}>
              <option value='eligible'>Eligible players and guests</option>
              <option value='checked_in'>Checked in</option>
              <option value='not_checked_in'>Awaiting check-in</option>
              <option value='unassigned'>Without a pairing</option>
              <option value='inactive'>Check-ins outside eligible roster</option>
              <option value='all'>All registrations</option>
            </select>
          </Field>
        </div>
        <ReportTable key={rosterFilter} caption='Player and guest roster' empty='No registrations match this filter.' rows={roster} columns={[
          { label: 'Name', value: (row) => data.admin && row.entryId ? <Link className={linkClass} href={entryLink(row.entryId)}>{row.name}</Link> : row.name },
          { label: 'Type', value: (row) => entryTypeLabel(row.entryType) },
          { label: 'Division', value: (row) => row.division },
          { label: 'Attendance', value: (row) => readable(row.attendance) },
          { label: 'Checked in (Manila)', value: (row) => reportDate(row.checkedInAt) },
          { label: 'Pairing', value: (row) => row.hole !== null && row.group ? `Hole ${row.hole} · ${row.group}` : '—' }
        ]} />
      </Panel>
    </div>
  )
}
