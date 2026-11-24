'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { useRef, useState, type FormEvent } from 'react'
import { exportBalances, exportTransactions } from './report-export'
import {
  channels, decimal, formText, money, optionalText, parseAmount, readable, reportDate,
  transactionKinds, transactionStatuses, type FinanceData
} from './report-format'
import { Field, FormStatus, MetricGrid, Panel, readableError, ReportMessage, ReportTable, selectClass, useEditorFocus } from './report-ui'

type Transaction = FinanceData['transactions'][number]
type Kind = Transaction['kind']
type Status = Transaction['status']

const directions: Record<Kind, string> = {
  entry_payment: 'Inflow', sponsorship: 'Inflow', other_income: 'Inflow',
  refund: 'Outflow', fee: 'Outflow', expense: 'Outflow', commission: 'Outflow', prize: 'Outflow'
}

function FinanceMetrics({ summary }: { summary: FinanceData['summary'] }) {
  return <MetricGrid metrics={[
    { label: 'Reconciled inflows', value: money(summary.reconciledIn) },
    { label: 'Reconciled outflows', value: money(summary.reconciledOut) },
    { label: 'Cash surplus / shortfall', value: money(summary.cashBalance) },
    { label: 'Unmatched statement lines', value: summary.unmatchedCount }
  ]} />
}

function FinanceDetails({ summary }: { summary: FinanceData['summary'] }) {
  const details = [
    ['Expected entry fees', summary.expected],
    ['Entry amounts marked paid', summary.markedPaid],
    ['Marked paid without a match', summary.paidWithoutMatch],
    ['Entry collections', summary.entryCollected],
    ['Sponsor collections', summary.sponsorCollected],
    ['Other collections', summary.otherCollected],
    ['Entry balances', summary.entryBalance],
    ['Sponsor balances', summary.sponsorBalance],
    ['Prize commitments remaining', summary.prizeBalance],
    ['Entry overpayments', summary.entryOverpayment],
    ['Sponsor overpayments', summary.sponsorOverpayment],
    ['Prize overpayments', summary.prizeOverpayment],
    ['Other outstanding inflows', summary.outstandingIn],
    ['Outstanding outflows', summary.outstandingOut],
    ['Refunds due (included in outstanding outflows)', summary.refundsDue],
    ['Unmatched inflows', summary.unmatchedIn],
    ['Unmatched outflows', summary.unmatchedOut],
    ['Expenses paid', summary.expensesPaid],
    ['Refunds paid', summary.refundsPaid],
    ['Fees paid', summary.feesPaid],
    ['Commissions paid', summary.commissionsPaid],
    ['Prizes paid', summary.prizesPaid],
    ...(summary.budget === null ? [] : [
      ['Approved cash outflow budget', summary.budget],
      ['Budget less reconciled outflows', summary.budget - summary.reconciledOut]
    ])
  ] as [string, number][]

  return (
    <Panel title='Cash and outstanding balances'>
      <dl className='grid gap-x-8 sm:grid-cols-2'>
        {details.map(([label, value]) => (
          <div key={label} className='flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-sm'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='shrink-0 tabular-nums'>{money(value)}</dd>
          </div>
        ))}
      </dl>
      {summary.paidWithoutAmount ? <p className='mt-3 text-sm text-muted-foreground'>{summary.paidWithoutAmount} entries marked paid have no recorded amount.</p> : null}
    </Panel>
  )
}

export function FinanceSummary({ summary }: { summary: FinanceData['summary'] }) {
  return (
    <>
      <FinanceMetrics summary={summary} />
      <FinanceDetails summary={summary} />
    </>
  )
}

export function FinanceReport({ eventId }: { eventId: string }) {
  const data = useQuery(api.tournamentReports.q.finance, { tournamentId: eventId })
  const [filter, setFilter] = useState<Status | 'all' | 'duplicate'>('all')
  const [editor, setEditor] = useState<Transaction | 'new' | null>(null)
  const [history, setHistory] = useState<Transaction | null>(null)
  const [notice, setNotice] = useState('')

  if (!data) return <ReportMessage>Loading accounting…</ReportMessage>

  const transactions = data.transactions.filter((row) => filter === 'all' || (filter === 'duplicate' ? row.duplicateReference : row.status === filter))

  function openEditor(row: Transaction | 'new') {
    setNotice('')
    setEditor(row)
    setHistory(null)
  }

  return (
    <div className='space-y-4'>
      <FinanceMetrics summary={data.summary} />
      <Panel title='Transaction register' action={<Button type='button' onClick={() => openEditor('new')}>Record transaction</Button>}>
        <p className='mb-4 text-sm text-muted-foreground'>Use one row per bank, e-wallet, or cash statement line. Link each installment to the same entry.</p>
        <FormStatus message={notice} />
        {editor ? (
          <TransactionEditor key={editor === 'new' ? 'new' : editor.id} eventId={eventId} data={data} row={editor === 'new' ? null : editor}
            onCancel={() => setEditor(null)} onSave={() => { setEditor(null); setNotice('Transaction saved.') }} />
        ) : null}
        <div className='mb-3 flex flex-wrap items-end justify-between gap-3'>
          <Field label='Transaction filter'>
            <select className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value='all'>All transactions</option>
              {Object.entries(transactionStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              <option value='duplicate'>Duplicate external references</option>
            </select>
          </Field>
          <Button type='button' variant='outline' disabled={!transactions.length} onClick={() => exportTransactions(`${eventId}-transactions-${filter}`, transactions)}>Download transactions CSV</Button>
        </div>
        <ReportTable key={filter} caption='Tournament transactions' empty='No transactions match this filter.' rows={transactions} columns={[
          { label: 'Description', value: (row) => <div className='min-w-36 font-medium'>{row.description}<div className='font-normal text-muted-foreground'>{transactionKinds[row.kind]} · {directions[row.kind]}</div></div> },
          { label: 'Status', value: (row) => <>{transactionStatuses[row.status]}{row.duplicateReference ? <div className='text-xs text-muted-foreground'>Duplicate reference</div> : null}</> },
          { label: 'Amount', value: (row) => money(row.amountMinor), numeric: true },
          { label: 'Linked record', value: (row) => row.entryLabel ?? row.itemLabel ?? '—' },
          { label: 'Statement line', value: (row) => row.evidence ?? '—' },
          { label: 'Date', value: (row) => row.occurredOn ?? '—' },
          { label: 'Actions', value: (row) => (
            <div className='flex gap-1'>
              {row.status !== 'void' ? <Button type='button' variant='outline' size='sm' aria-label={`Edit ${row.description}`} onClick={() => openEditor(row)}>Edit</Button> : null}
              <Button type='button' variant='ghost' size='sm' aria-label={`History for ${row.description}`} onClick={() => { setHistory(row); setEditor(null) }}>History</Button>
            </div>
          ) }
        ]} />
        {history ? <TransactionHistory key={history.id} eventId={eventId} transaction={history} onClose={() => setHistory(null)} /> : null}
      </Panel>
      <FinanceDetails summary={data.summary} />
      <Panel title='Entry balances' action={<Button type='button' variant='outline' disabled={!data.entries.length && !data.commitments.length} onClick={() => exportBalances(`${eventId}-balances`, data.entries, data.commitments)}>Download balances CSV</Button>}>
        <ReportTable caption='Entry balances' empty='There are no standard entries to reconcile.' rows={data.entries} columns={[
          { label: 'Entry', value: (row) => row.label },
          { label: 'Expected', value: (row) => money(row.expected), numeric: true },
          { label: 'Matched', value: (row) => money(row.collected), numeric: true },
          { label: 'Balance', value: (row) => money(row.balance), numeric: true },
          { label: 'Entry payment status', value: (row) => row.markedPaid ? 'Marked paid' : 'Pending' }
        ]} />
      </Panel>
      <Panel title='Sponsor, prize and budget commitments'>
        <ReportTable caption='Sponsor, prize and budget commitments' empty='Set commitments and budgets in Follow-ups.' rows={data.commitments} columns={[
          { label: 'Commitment', value: (row) => row.title },
          { label: 'Type', value: (row) => readable(row.kind) },
          { label: 'Status', value: (row) => readable(row.status) },
          { label: 'Amount', value: (row) => money(row.amountMinor), numeric: true },
          { label: 'Reconciled', value: (row) => row.kind === 'budget' ? '—' : money(row.reconciled), numeric: true },
          { label: 'Balance', value: (row) => row.kind === 'budget' ? '—' : money(row.balance), numeric: true }
        ]} />
      </Panel>
    </div>
  )
}

function TransactionEditor({ eventId, data, row, onSave, onCancel }: {
  eventId: string; data: FinanceData; row: Transaction | null; onSave: () => void; onCancel: () => void
}) {
  const formRef = useEditorFocus()
  const save = useMutation(api.tournamentReports.m.saveTransaction)
  const requestId = useRef('')
  const [kind, setKind] = useState<Kind>(row?.kind ?? 'entry_payment')
  const [status, setStatus] = useState<Status>(row?.status ?? 'unmatched')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const isStatement = status === 'unmatched' || status === 'reconciled'
  const needsEntry = kind === 'entry_payment' || kind === 'refund'
  const commitmentKind = kind === 'sponsorship' ? 'sponsor' : kind === 'prize' ? 'prize' : null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      requestId.current ||= crypto.randomUUID()
      await save({
        tournamentId: eventId, transactionId: row?.id, requestId: requestId.current, lastUpdatedAt: row?.updatedAt,
        kind, status, amountMinor: status === 'void' && row ? row.amountMinor : parseAmount(form.get('amount')),
        description: status === 'void' && row ? row.description : formText(form, 'description'),
        entryId: optionalText(form, 'entry') as Transaction['entryId'],
        itemId: optionalText(form, 'commitment') as Transaction['itemId'],
        occurredOn: isStatement ? optionalText(form, 'date') : undefined,
        channel: isStatement ? optionalText(form, 'channel') as Transaction['channel'] : undefined,
        accountLabel: isStatement ? optionalText(form, 'account') : undefined,
        externalReference: isStatement ? optionalText(form, 'reference') : undefined,
        evidence: isStatement ? optionalText(form, 'evidence') : undefined,
        reason: optionalText(form, 'reason')
      })
      onSave()
    } catch (caught) {
      setError(caught instanceof Error && caught.name === 'Error' && caught.message.startsWith('Enter an amount') ? caught.message : readableError(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={(event) => void submit(event)} className='mb-5 space-y-4 rounded-lg border border-border bg-muted/25 p-4'>
      <h3 className='font-medium'>{row ? 'Edit transaction' : 'Record transaction'}</h3>
      <fieldset disabled={pending} className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <Field label='State'>
          <select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as Status)}>
            <option value='unmatched'>Unmatched statement line</option>
            <option value='reconciled'>Reconciled</option>
            <option value='outstanding' disabled={row?.status === 'reconciled'}>Outstanding amount</option>
            {row ? <option value='void'>Voided</option> : null}
          </select>
        </Field>
        {status === 'void' ? (
          <p className='self-end text-sm text-muted-foreground sm:col-span-1 lg:col-span-2'>Voiding removes this amount from current totals and preserves the transaction history.</p>
        ) : (
          <>
            <Field label='Type'>
              <select className={selectClass} value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
                {Object.entries(transactionKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label='Amount (PHP)'><Input name='amount' inputMode='decimal' className='min-h-10' defaultValue={decimal(row?.amountMinor)} required /></Field>
            <Field label='Description'><Input name='description' className='min-h-10' defaultValue={row?.description} maxLength={200} required /></Field>
            {needsEntry ? (
              <Field label='Entry'>
                <select name='entry' className={selectClass} defaultValue={row?.entryId} required={status === 'reconciled'}>
                  <option value=''>Select an entry</option>
                  {data.entryOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                </select>
              </Field>
            ) : null}
            {commitmentKind ? (
              <Field label={readable(commitmentKind)}>
                <select key={commitmentKind} name='commitment' className={selectClass} defaultValue={row?.itemId} required={status === 'reconciled'}>
                  <option value=''>Select a {commitmentKind}</option>
                  {data.itemOptions.filter((item) => item.kind === commitmentKind).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </Field>
            ) : null}
            {isStatement ? (
              <>
                <Field label='Transaction date (Manila)'><Input name='date' type='date' className='min-h-10' defaultValue={row?.occurredOn} required /></Field>
                <Field label='Channel'>
                  <select name='channel' className={selectClass} defaultValue={row?.channel ?? ''} required>
                    <option value=''>Select a channel</option>
                    {Object.entries(channels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </Field>
                <Field label='Account label'><Input name='account' className='min-h-10' defaultValue={row?.accountLabel} maxLength={80} required /></Field>
                <Field label='Statement line ID'><Input name='evidence' className='min-h-10' defaultValue={row?.evidence} maxLength={200} required /></Field>
                <Field label='External reference (optional)'><Input name='reference' className='min-h-10' defaultValue={row?.externalReference} maxLength={120} /></Field>
              </>
            ) : null}
          </>
        )}
        {row ? <Field label='Change reason'><Input name='reason' className='min-h-10' maxLength={500} required /></Field> : null}
      </fieldset>
      <FormStatus message={error} error={Boolean(error)} />
      <div className='flex gap-2'>
        <Button type='submit' disabled={pending}>{status === 'void' ? 'Void transaction' : 'Save transaction'}</Button>
        <Button type='button' disabled={pending} variant='outline' onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function TransactionHistory({ eventId, transaction, onClose }: { eventId: string; transaction: Transaction; onClose: () => void }) {
  const { results, status, loadMore } = usePaginatedQuery(api.tournamentReports.q.transactionHistory,
    { tournamentId: eventId, transactionId: transaction.id }, { initialNumItems: 10 })

  return (
    <div className='mt-4 space-y-3 rounded-lg border border-border p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='font-medium'>History · {transaction.description}</h3>
        <Button type='button' variant='outline' size='sm' onClick={onClose}>Close history</Button>
      </div>
      {status === 'LoadingFirstPage' ? <p role='status' className='text-sm text-muted-foreground'>Loading history…</p> : (
        <ReportTable caption='Transaction change history' empty='No changes have been recorded.' pageSize={50} rows={results.map((row) => ({ ...row, id: row._id }))} columns={[
          { label: 'Changed (Manila)', value: (row) => reportDate(row.updatedAt) },
          { label: 'Reviewer', value: (row) => row.reviewer },
          { label: 'Previous', value: (row) => row.previous ? `${transactionStatuses[row.previous.status]} · ${money(row.previous.amountMinor)}` : '—' },
          { label: 'Saved', value: (row) => `${transactionStatuses[row.next.status]} · ${money(row.next.amountMinor)}` },
          { label: 'Reason', value: (row) => row.reason ?? 'Created' }
        ]} />
      )}
      {status === 'CanLoadMore' || status === 'LoadingMore' ? <Button type='button' variant='outline' disabled={status === 'LoadingMore'} onClick={() => loadMore(10)}>Load more changes</Button> : null}
    </div>
  )
}
