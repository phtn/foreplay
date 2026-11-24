'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { hasFinanceExceptions } from '@/convex/tournamentReports/financeSummary'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { useRef, useState, type FormEvent } from 'react'
import { FinanceSummary } from './finance-report'
import { AttendanceSummary, AwardsTable } from './operations-report'
import { exportBalances, exportCloseoutPdf, exportEntries, exportFollowUps, exportRoster, exportSponsor, exportTransactions } from './report-export'
import { formText, manilaCutoff, readable, reportDate, type Closeout } from './report-format'
import { Field, FormStatus, Panel, readableError, ReportMessage, ReportTable, textAreaClass, useEditorFocus } from './report-ui'

type VersionId = Id<'tournamentReportCloseouts'>

export function CloseoutReport({ eventId, finance }: { eventId: string; finance: boolean }) {
  const { results, status, loadMore } = usePaginatedQuery(api.tournamentReports.q.closeouts, { tournamentId: eventId }, { initialNumItems: 10 })
  const [selected, setSelected] = useState<VersionId | null>(null)
  const [creating, setCreating] = useState(false)
  const latest = results[0]
  const active = selected ?? latest?.id

  if (status === 'LoadingFirstPage') return <ReportMessage>Loading closeout versions…</ReportMessage>

  return (
    <div className='space-y-4'>
      <Panel title='Closeout versions' action={!creating ? <Button type='button' onClick={() => setCreating(true)}>{latest ? 'Start a new version' : 'Start closeout'}</Button> : undefined}>
        <p className='mb-4 text-sm text-muted-foreground'>Operations approves the roster and results first. Finance then signs off on the reconciliation. Each version keeps the data that was approved.</p>
        {creating ? <OperationsApproval eventId={eventId} isRevision={Boolean(latest)}
          onCancel={() => setCreating(false)} onSave={(id) => { setSelected(id); setCreating(false) }} /> : null}
        <ReportTable caption='Closeout versions' empty='No closeout versions have been created.' rows={results} columns={[
          { label: 'Version', value: (row) => <Button type='button' variant={active === row.id ? 'secondary' : 'outline'} size='sm' aria-pressed={active === row.id} onClick={() => setSelected(row.id)}>Version {row.version}</Button> },
          { label: 'Gate cutoff (Manila)', value: (row) => reportDate(row.cutoff) },
          { label: 'Operations approved by', value: (row) => row.operationsApprover },
          { label: 'Finance approved by', value: (row) => row.financeApprover ?? 'Awaiting finance' }
        ]} />
        {status === 'CanLoadMore' || status === 'LoadingMore' ? <Button type='button' className='mt-4' variant='outline' disabled={status === 'LoadingMore'} onClick={() => loadMore(10)}>Load earlier versions</Button> : null}
      </Panel>
      {active ? <CloseoutVersion key={active} eventId={eventId} id={active} canApprove={finance && active === latest?.id} /> : null}
    </div>
  )
}

function OperationsApproval({ eventId, isRevision, onCancel, onSave }: {
  eventId: string; isRevision: boolean; onCancel: () => void; onSave: (id: VersionId) => void
}) {
  const formRef = useEditorFocus()
  const approve = useMutation(api.tournamentReports.m.approveOperations)
  const requestId = useRef('')
  const [dateTime, setDateTime] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const cutoff = manilaCutoff(dateTime)
  const preview = useQuery(api.tournamentReports.q.closeoutPreview, Number.isFinite(cutoff) ? { tournamentId: eventId, cutoff } : 'skip')
  const needsNotes = isRevision || Boolean(preview?.summary.undatedCheckIns || preview?.summary.inactiveCheckIns || preview?.awards.some((row) => !row.winner))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      requestId.current ||= crypto.randomUUID()
      const result = await approve({ tournamentId: eventId, cutoff, requestId: requestId.current, notes: formText(form, 'notes') })
      onSave(result)
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={(event) => void submit(event)} className='mb-4 space-y-4 rounded-lg border border-border bg-muted/25 p-4'>
      <h3 className='font-medium'>Operations approval</h3>
      <fieldset disabled={pending} className='grid gap-3 sm:grid-cols-2'>
        <Field label='Gate cutoff (Manila)'><Input type='datetime-local' className='min-h-10' value={dateTime}
          onChange={(event) => { setDateTime(event.target.value); setConfirmed(false) }} required /></Field>
        <Field label={needsNotes ? 'Operations notes' : 'Operations notes (optional)'}>
          <textarea name='notes' className={textAreaClass} maxLength={1500} required={needsNotes} />
        </Field>
      </fieldset>
      <p className='text-sm text-muted-foreground'>Check-ins after the cutoff are excluded. Eligibility uses the records available when you approve.</p>
      {Number.isFinite(cutoff) && !preview ? <p role='status' className='text-sm text-muted-foreground'>Loading attendance preview…</p> : null}
      {preview ? (
        <div className='space-y-2 text-sm'>
          <p>{preview.summary.playersCheckedIn} players checked in · {preview.summary.guestsCheckedIn} guests checked in · {preview.summary.noShows} player no-shows.</p>
          <p>{preview.awards.filter((row) => !row.winner).length} award assignments open · {preview.summary.undatedCheckIns + preview.summary.inactiveCheckIns} check-in exceptions.</p>
          <label className='flex min-h-9 items-center gap-2'>
            <input type='checkbox' className='size-4 accent-primary' checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required />
            <span>I reviewed the attendance, awards, and follow-ups.</span>
          </label>
        </div>
      ) : null}
      <FormStatus message={error} error={Boolean(error)} />
      <div className='flex flex-wrap gap-2'>
        <Button type='submit' disabled={pending || !preview || !confirmed}>Approve operations</Button>
        <Button type='button' variant='outline' disabled={pending} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function CloseoutVersion({ eventId, id, canApprove }: { eventId: string; id: VersionId; canApprove: boolean }) {
  const report = useQuery(api.tournamentReports.q.closeout, { tournamentId: eventId, closeoutId: id })
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  if (!report) return <ReportMessage>Loading closeout details…</ReportMessage>

  const name = `${eventId}-closeout-v${report.version}`
  const completed = report.financeApprovedAt !== null
  const sponsors = report.items.filter((row) => row.kind === 'sponsor')

  async function downloadPdf(snapshot: Closeout) {
    setExporting(true)
    setExportError('')
    try {
      await exportCloseoutPdf(name, snapshot)
    } catch {
      setExportError('Unable to generate the summary PDF. Try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='space-y-4'>
      <Panel title={`Closeout version ${report.version}`}>
        <dl className='grid gap-3 text-sm sm:grid-cols-3'>
          <div><dt className='text-muted-foreground'>Gate cutoff (Manila)</dt><dd className='mt-1'>{reportDate(report.cutoff)}</dd></div>
          <div><dt className='text-muted-foreground'>Operations approval</dt><dd className='mt-1'>{report.operationsApprover} · {reportDate(report.operationsApprovedAt)}</dd></div>
          <div><dt className='text-muted-foreground'>Finance approval</dt><dd className='mt-1'>{completed ? `${report.financeApprover} · ${reportDate(report.financeApprovedAt)}` : 'Awaiting finance'}</dd></div>
        </dl>
        {report.operationsNotes ? <p className='mt-4 whitespace-pre-wrap break-words text-sm'><span className='font-medium'>Operations notes</span><br />{report.operationsNotes}</p> : null}
        {report.financeNotes ? <p className='mt-4 whitespace-pre-wrap break-words text-sm'><span className='font-medium'>Finance notes</span><br />{report.financeNotes}</p> : null}
        {completed ? (
          <div className='mt-4 flex flex-wrap gap-2'>
            <Button type='button' disabled={exporting} onClick={() => void downloadPdf(report)}>{exporting ? 'Preparing PDF…' : 'Download summary PDF'}</Button>
            <Button type='button' variant='outline' onClick={() => exportEntries(`${name}-entries`, report.entries)}>Download entries CSV</Button>
            <Button type='button' variant='outline' onClick={() => exportRoster(`${name}-attendance`, report.roster)}>Download attendance CSV</Button>
            <Button type='button' variant='outline' onClick={() => exportFollowUps(`${name}-follow-ups`, report.items)}>Download follow-ups CSV</Button>
            {report.finance ? (
              <>
                <Button type='button' variant='outline' onClick={() => exportTransactions(`${name}-transactions`, report.transactions)}>Download transactions CSV</Button>
                <Button type='button' variant='outline' onClick={() => exportBalances(`${name}-balances`, report.financeEntries, report.financeItems)}>Download balances CSV</Button>
              </>
            ) : null}
          </div>
        ) : null}
        <FormStatus message={exportError} error={Boolean(exportError)} />
      </Panel>
      {canApprove && !completed ? <FinanceApproval eventId={eventId} id={id} /> : null}
      <AttendanceSummary data={report.operations} closing />
      <Panel title='Approved results and awards'><AwardsTable awards={report.operations.awards} /></Panel>
      <Panel title='Follow-ups at closeout'>
        <ReportTable caption='Follow-ups at closeout' empty='No follow-ups were recorded at approval.' rows={report.items} columns={[
          { label: 'Title', value: (row) => <div><p className='font-medium'>{row.title}</p>{row.notes ? <p className='max-w-80 whitespace-pre-wrap text-muted-foreground'>{row.notes}</p> : null}</div> },
          { label: 'Type', value: (row) => readable(row.kind) },
          { label: 'Status', value: (row) => readable(row.status) },
          { label: 'Owner', value: (row) => row.owner ?? '—' },
          { label: 'Due date', value: (row) => row.dueOn ?? '—' }
        ]} />
      </Panel>
      {completed && sponsors.length ? (
        <Panel title='Sponsor summaries'>
          <ReportTable caption='Sponsor summaries' empty='No sponsor commitments.' rows={sponsors} columns={[
            { label: 'Sponsor', value: (row) => row.title },
            { label: 'Status', value: (row) => readable(row.status) },
            { label: 'Report', value: (row) => <Button type='button' variant='outline' size='sm' aria-label={`Download ${row.title} summary CSV`}
              onClick={() => exportSponsor(`${name}-sponsor-${row.title}`, report, row)}>Download CSV</Button> }
          ]} />
        </Panel>
      ) : null}
      {report.finance ? <FinanceSummary summary={report.finance} /> : null}
    </div>
  )
}

function FinanceApproval({ eventId, id }: { eventId: string; id: VersionId }) {
  const data = useQuery(api.tournamentReports.q.finance, { tournamentId: eventId })
  const approve = useMutation(api.tournamentReports.m.approveFinance)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  if (!data) return <ReportMessage>Loading reconciliation preview…</ReportMessage>

  const needsNotes = hasFinanceExceptions(data.summary)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      await approve({ tournamentId: eventId, closeoutId: id, notes: formText(form, 'notes') })
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className='space-y-4'>
      <FinanceSummary summary={data.summary} />
      <Panel title='Finance approval'>
        <form onSubmit={(event) => void submit(event)} className='space-y-3'>
          <Field label={needsNotes ? 'Open items and reconciliation notes' : 'Finance notes (optional)'}>
            <textarea name='notes' className={textAreaClass} maxLength={1500} required={needsNotes} />
          </Field>
          {needsNotes ? <p className='text-sm text-muted-foreground'>Give each open balance or exception an explanation and an owner before signing off.</p> : null}
          <label className='flex min-h-9 items-center gap-2 text-sm'>
            <input type='checkbox' className='size-4 accent-primary' required />
            <span>I reviewed the statement matches, outgoing payments, and open items.</span>
          </label>
          <FormStatus message={error} error={Boolean(error)} />
          <Button type='submit' disabled={pending}>Approve finance and finalize</Button>
        </form>
      </Panel>
    </div>
  )
}
