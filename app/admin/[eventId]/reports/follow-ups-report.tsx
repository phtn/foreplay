'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'
import { AwardsTable } from './operations-report'
import { decimal, formText, money, optionalText, parseAmount, readable, reportDate, type ItemsData, type OperationsData } from './report-format'
import { Field, FormStatus, MetricGrid, Panel, readableError, ReportMessage, ReportTable, selectClass, textAreaClass, useEditorFocus } from './report-ui'

type Item = ItemsData['rows'][number]
type Kind = Item['kind']

const settings = {
  incident: { title: 'Incidents', button: 'Log incident', item: 'incident', statuses: ['open', 'resolved'] },
  sponsor: { title: 'Sponsor commitments', button: 'Add sponsor', item: 'sponsor', statuses: ['lead', 'agreed', 'fulfilled', 'closed', 'lost'] },
  prize: { title: 'Prize fulfillment', button: 'Add prize', item: 'prize', statuses: ['open', 'fulfilled'] },
  budget: { title: 'Cash outflow budget', button: 'Add budget line', item: 'budget line', statuses: ['approved', 'closed'] }
} satisfies Record<Kind, { title: string; button: string; item: string; statuses: Item['status'][] }>

export function FollowUpsReport({ eventId, eventUrl, awards, finance }: {
  eventId: string; eventUrl: string; awards: OperationsData['awards']; finance: boolean
}) {
  const data = useQuery(api.tournamentReports.q.items, { tournamentId: eventId })
  if (!data) return <ReportMessage>Loading results and follow-ups…</ReportMessage>

  return (
    <div className='space-y-4'>
      <Panel title='Results and awards' action={<Link className={buttonVariants({ variant: 'outline' })} href={`${eventUrl}/podium`}>Manage podium</Link>}>
        <p className='mb-3 text-sm text-muted-foreground'>{awards.filter((award) => !award.winner).length} award assignments open.</p>
        <AwardsTable awards={awards} />
      </Panel>
      <ItemPanel eventId={eventId} kind='incident' rows={data.rows} finance={finance} />
      <ItemPanel eventId={eventId} kind='prize' rows={data.rows} finance={finance} />
      <SponsorPipeline eventId={eventId} data={data} />
      <ItemPanel eventId={eventId} kind='sponsor' rows={data.rows} finance={finance} />
      {finance ? <ItemPanel eventId={eventId} kind='budget' rows={data.rows} finance /> : null}
    </div>
  )
}

function SponsorPipeline({ eventId, data }: { eventId: string; data: ItemsData }) {
  return (
    <Panel title='Sponsor inquiry pipeline'>
      <div className='space-y-4'>
        <MetricGrid metrics={[
          { label: 'New', value: data.pipeline.new }, { label: 'Contacted', value: data.pipeline.contacted },
          { label: 'Won', value: data.pipeline.won }, { label: 'Lost', value: data.pipeline.lost }
        ]} />
        <ReportTable rows={data.inquiries} caption='Sponsor inquiries' empty='No sponsor inquiries have been submitted.' columns={[
          { label: 'Company', value: (row) => row.company },
          { label: 'Preferred tier', value: (row) => row.preferredTier ?? '—' },
          { label: 'Received (Manila)', value: (row) => reportDate(row.receivedAt) },
          { label: 'Status', value: (row) => <SponsorInquiryStatus eventId={eventId} row={row} /> }
        ]} />
      </div>
    </Panel>
  )
}

function SponsorInquiryStatus({ eventId, row }: { eventId: string; row: ItemsData['inquiries'][number] }) {
  const update = useMutation(api.tournamentReports.m.setSponsorInquiryStatus)
  const [pending, setPending] = useState<ItemsData['inquiries'][number]['status'] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  async function change(status: ItemsData['inquiries'][number]['status']) {
    setPending(status)
    setMessage('')
    setError(false)
    try {
      await update({ tournamentId: eventId, inquiryId: row.id, status, lastUpdatedAt: row.updatedAt })
      setMessage('Status saved.')
    } catch (caught) {
      setMessage(readableError(caught))
      setError(true)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className='min-w-32'>
      <select aria-label={`Status for ${row.company}`} className={selectClass} value={pending ?? row.status} disabled={pending !== null}
        onChange={(event) => void change(event.target.value as typeof row.status)}>
        {(['new', 'contacted', 'won', 'lost'] as const).map((status) => <option key={status} value={status}>{readable(status)}</option>)}
      </select>
      {message ? <FormStatus message={message} error={error} /> : null}
    </div>
  )
}

function ItemPanel({ eventId, kind, rows, finance }: { eventId: string; kind: Kind; rows: Item[]; finance: boolean }) {
  const config = settings[kind]
  const [editor, setEditor] = useState<Item | 'new' | null>(null)
  const [notice, setNotice] = useState('')
  const showAmounts = finance && kind !== 'incident'

  function openEditor(row: Item | 'new') {
    setNotice('')
    setEditor(row)
  }

  return (
    <Panel title={config.title} action={<Button type='button' variant='outline' onClick={() => openEditor('new')}>{config.button}</Button>}>
      <FormStatus message={notice} />
      {editor ? <ItemEditor key={editor === 'new' ? 'new' : editor.id} eventId={eventId} kind={kind} row={editor === 'new' ? null : editor}
        showAmounts={showAmounts} onCancel={() => setEditor(null)} onSave={() => { setEditor(null); setNotice('Follow-up saved.') }} /> : null}
      <ReportTable caption={config.title} empty={`No ${config.title.toLowerCase()} recorded yet.`} rows={rows.filter((row) => row.kind === kind)} columns={[
        { label: 'Title', value: (row) => <div className='min-w-36'><p className='font-medium'>{row.title}</p>{row.notes ? <p className='max-w-80 whitespace-pre-wrap text-muted-foreground'>{row.notes}</p> : null}</div> },
        { label: 'Status', value: (row) => readable(row.status) },
        { label: 'Owner', value: (row) => row.owner ?? '—' },
        { label: 'Due date', value: (row) => row.dueOn ?? '—' },
        ...(kind === 'sponsor' ? [
          { label: 'In-kind contribution', value: (row: Item) => row.inKind ?? '—' },
          { label: 'Sponsor benefits', value: (row: Item) => row.deliverables ?? '—' }
        ] : []),
        ...(showAmounts ? [{ label: 'Cash amount', value: (row: Item) => money(row.amountMinor), numeric: true }] : []),
        { label: 'Actions', value: (row) => <Button type='button' variant='outline' size='sm' aria-label={`Edit ${row.title}`} onClick={() => openEditor(row)}>Edit</Button> }
      ]} />
    </Panel>
  )
}

function ItemEditor({ eventId, kind, row, showAmounts, onCancel, onSave }: {
  eventId: string; kind: Kind; row: Item | null; showAmounts: boolean; onCancel: () => void; onSave: () => void
}) {
  const formRef = useEditorFocus()
  const save = useMutation(api.tournamentReports.m.saveItem)
  const { item, statuses } = settings[kind]
  const requestId = useRef('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      requestId.current ||= crypto.randomUUID()
      await save({
        tournamentId: eventId, itemId: row?.id, requestId: requestId.current, lastUpdatedAt: row?.updatedAt,
        kind, status: formText(form, 'status') as Item['status'], title: formText(form, 'title'),
        owner: optionalText(form, 'owner'), dueOn: optionalText(form, 'dueOn'), inKind: optionalText(form, 'inKind'),
        deliverables: optionalText(form, 'deliverables'), notes: optionalText(form, 'notes'),
        amountMinor: showAmounts && optionalText(form, 'amount') ? parseAmount(form.get('amount')) : undefined
      })
      onSave()
    } catch (caught) {
      setError(caught instanceof Error && caught.message.startsWith('Enter an amount') ? caught.message : readableError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={(event) => void submit(event)} className='mb-4 space-y-3 rounded-lg border border-border bg-muted/25 p-4'>
      <h3 className='font-medium'>{row ? `Edit ${item}` : settings[kind].button}</h3>
      <fieldset disabled={pending} className='grid gap-3 sm:grid-cols-2'>
        <Field label={kind === 'sponsor' ? 'Sponsor name' : 'Title'}><Input name='title' className='min-h-10' maxLength={160} defaultValue={row?.title} required /></Field>
        <Field label='Status'>
          <select name='status' className={selectClass} defaultValue={row?.status ?? statuses[0]}>
            {statuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}
          </select>
        </Field>
        <Field label='Owner (optional)'><Input name='owner' className='min-h-10' maxLength={100} defaultValue={row?.owner ?? ''} /></Field>
        <Field label='Due date (optional)'><Input name='dueOn' type='date' className='min-h-10' defaultValue={row?.dueOn ?? ''} /></Field>
        {showAmounts ? <Field label={kind === 'budget' ? 'Budget amount (PHP)' : 'Cash commitment (PHP, optional)'}>
          <Input name='amount' inputMode='decimal' className='min-h-10' defaultValue={decimal(row?.amountMinor)} required={kind === 'budget'} />
        </Field> : null}
        {kind === 'sponsor' ? (
          <>
            <Field label='In-kind contribution (optional)'><textarea name='inKind' className={textAreaClass} maxLength={500} defaultValue={row?.inKind ?? ''} /></Field>
            <Field label='Sponsor benefits for the sponsor report (optional)'><textarea name='deliverables' className={textAreaClass} maxLength={600} defaultValue={row?.deliverables ?? ''} /></Field>
          </>
        ) : null}
        <Field label='Internal notes (optional)'><textarea name='notes' className={textAreaClass} maxLength={1000} defaultValue={row?.notes ?? ''} /></Field>
      </fieldset>
      <FormStatus message={error} error={Boolean(error)} />
      <div className='flex gap-2'>
        <Button type='submit' disabled={pending}>Save {item}</Button>
        <Button type='button' variant='outline' disabled={pending} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
