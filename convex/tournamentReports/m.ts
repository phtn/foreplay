import { ConvexError, v, type Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { sponsorLeadSchema } from '../sponsorLeads/d'
import { requireReportAccess } from './access'
import { getTournament, listItems, readFinance, readOperations, toItemRow, transactionValues } from './data'
import { hasFinanceExceptions } from './financeSummary'
import { itemFields, snapshotChunkSchema, transactionFields } from './d'

type Transaction = Doc<'tournamentReportTransactions'>
type Item = Doc<'tournamentReportItems'>
type SnapshotChunk = Infer<typeof snapshotChunkSchema>

function text(value: string | undefined, max: number, label: string) {
  const trimmed = value?.trim() || undefined
  if (trimmed && trimmed.length > max) throw new ConvexError(`${label} must be ${max} characters or fewer.`)
  return trimmed
}

function required(value: string | undefined, max: number, label: string) {
  const result = text(value, max, label)
  if (!result) throw new ConvexError(`Enter ${label.toLowerCase()}.`)
  return result
}

function day(value: string | undefined, label: string) {
  if (!value) return undefined
  const timestamp = Date.parse(value + 'T00:00:00Z')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value) throw new ConvexError(`Enter a valid ${label.toLowerCase()}.`)
  return value
}

function validateAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000_000) {
    throw new ConvexError('Enter a PHP amount between 0.01 and 1,000,000,000.00.')
  }
}

function stamp(actor: { id: string; name: string }, now: number) {
  return { updatedAt: now, updatedBy: actor.id, reviewer: actor.name }
}

const commitmentKinds: Partial<Record<Transaction['kind'], Item['kind']>> = { sponsorship: 'sponsor', prize: 'prize' }

export const saveTransaction = mutation({
  args: {
    ...transactionFields,
    transactionId: v.optional(v.id('tournamentReportTransactions')),
    requestId: v.string(), reason: v.optional(v.string()), lastUpdatedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const actor = await requireReportAccess(ctx, 'finance')
    const { tournamentId, transactionId, kind, status, amountMinor, entryId, itemId, channel } = args
    const requestId = required(args.requestId, 80, 'Request ID')
    const [previous, existing] = await Promise.all([
      transactionId ? ctx.db.get(transactionId) : null,
      transactionId ? null : ctx.db.query('tournamentReportTransactions')
        .withIndex('by_tournamentId_and_requestId', (q) => q.eq('tournamentId', tournamentId).eq('requestId', requestId)).unique(),
      getTournament(ctx, tournamentId)
    ])
    if (existing) return existing._id
    if (transactionId && previous?.tournamentId !== tournamentId) throw new ConvexError('Transaction not found.')
    if (previous && previous.updatedAt !== args.lastUpdatedAt) {
      throw new ConvexError('This transaction changed. Reopen it and review the latest values.')
    }
    if (previous?.status === 'void') throw new ConvexError('Voided transactions are kept for audit.')
    if (!previous && status === 'void') throw new ConvexError('Save the transaction before voiding it.')

    const now = Date.now()
    const review = stamp(actor, now)
    const reason = previous ? required(args.reason, 500, 'Change reason') : undefined

    if (previous && status === 'void') {
      const before = transactionValues(previous)
      await ctx.db.patch(previous._id, { status, statementKey: undefined, ...review })
      await ctx.db.insert('tournamentReportTransactionChanges', {
        transactionId: previous._id, previous: before, next: { ...before, status }, reason, ...review
      })
      return previous._id
    }

    validateAmount(amountMinor)
    const description = required(args.description, 200, 'Description')
    const occurredOn = day(args.occurredOn, 'Transaction date')
    const accountLabel = text(args.accountLabel, 80, 'Account label')
    const externalReference = text(args.externalReference, 120, 'External reference')
    const evidence = text(args.evidence, 200, 'Statement line ID')
    const [entry, item] = await Promise.all([entryId ? ctx.db.get(entryId) : null, itemId ? ctx.db.get(itemId) : null])

    if (entryId && (entry?.tournament_id !== tournamentId || (kind !== 'entry_payment' && kind !== 'refund'))) {
      throw new ConvexError('Select an entry from this tournament for an entry payment or refund.')
    }
    if (kind === 'entry_payment' && entry?.entry_type) throw new ConvexError('Select a standard entry for an entry payment.')
    if (itemId && (item?.tournamentId !== tournamentId || item.kind !== commitmentKinds[kind])) {
      throw new ConvexError('Select a sponsor or prize from this tournament that matches the transaction type.')
    }

    let statementKey: string | undefined
    if (status === 'reconciled' || status === 'unmatched') {
      if (!occurredOn || !channel || !accountLabel || !evidence) {
        throw new ConvexError('Enter the transaction date, channel, account label and statement line ID.')
      }
      const today = new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
      if (occurredOn > today) throw new ConvexError('Enter a transaction date on or before today.')
      if (status === 'reconciled' && (kind === 'entry_payment' || kind === 'refund') && !entryId) {
        throw new ConvexError('Select the entry this payment or refund belongs to.')
      }
      if (status === 'reconciled' && commitmentKinds[kind] && !itemId) {
        throw new ConvexError('Select the sponsor or prize this transaction belongs to.')
      }

      statementKey = JSON.stringify([channel, accountLabel.toLowerCase(), evidence.toLowerCase()])
      const duplicate = await ctx.db.query('tournamentReportTransactions')
        .withIndex('by_statementKey', (q) => q.eq('statementKey', statementKey)).unique()
      if (duplicate && duplicate._id !== transactionId) throw new ConvexError('This statement line already has a tournament transaction.')
    } else {
      if (kind === 'entry_payment' || kind === 'sponsorship') {
        throw new ConvexError('Entry and sponsor balances come from their expected amounts and matched collections.')
      }
      if (occurredOn || channel || accountLabel || externalReference || evidence) {
        throw new ConvexError('Use Unmatched or Reconciled for a statement line.')
      }
    }

    const next = {
      tournamentId, kind, status, amountMinor, description, entryId, itemId, occurredOn,
      channel, accountLabel, externalReference, evidence
    }
    if (previous?.status === 'reconciled' && status === 'outstanding') {
      throw new ConvexError('Void the reconciled transaction before recording a new outstanding amount.')
    }
    const id = previous?._id ?? await ctx.db.insert('tournamentReportTransactions', { ...next, ...review, requestId, statementKey })

    if (previous) await ctx.db.patch(previous._id, { ...next, ...review, statementKey })
    await ctx.db.insert('tournamentReportTransactionChanges', {
      transactionId: id, previous: previous ? transactionValues(previous) : undefined, next, reason, ...review
    })
    return id
  }
})

const statuses: Record<Item['kind'], Item['status'][]> = {
  incident: ['open', 'resolved'],
  sponsor: ['lead', 'agreed', 'fulfilled', 'closed', 'lost'],
  prize: ['open', 'fulfilled'],
  budget: ['approved', 'closed']
}

export const saveItem = mutation({
  args: {
    ...itemFields, itemId: v.optional(v.id('tournamentReportItems')),
    requestId: v.string(), lastUpdatedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const actor = await requireReportAccess(ctx, 'admin')
    const { tournamentId, kind, status, itemId } = args
    const requestId = required(args.requestId, 80, 'Request ID')
    const [previous, existing] = await Promise.all([
      itemId ? ctx.db.get(itemId) : null,
      itemId ? null : ctx.db.query('tournamentReportItems')
        .withIndex('by_tournamentId_and_requestId', (q) => q.eq('tournamentId', tournamentId).eq('requestId', requestId)).unique(),
      getTournament(ctx, tournamentId)
    ])

    if (existing) return existing._id
    if (itemId && (previous?.tournamentId !== tournamentId || previous.kind !== kind)) throw new ConvexError('Follow-up not found.')
    if (previous && previous.updatedAt !== args.lastUpdatedAt) throw new ConvexError('This item changed. Reopen it and review the latest values.')
    if (!statuses[kind].includes(status)) throw new ConvexError('Choose a status for this report item.')
    if ((kind === 'budget' || args.amountMinor !== undefined) && !actor.finance) throw new ConvexError('Finance access is required to set amounts.')
    if (kind === 'budget' && args.amountMinor === undefined) throw new ConvexError('Enter the budget amount.')
    if (args.amountMinor !== undefined) {
      if (kind === 'incident') throw new ConvexError('Incident reports have no amount.')
      validateAmount(args.amountMinor)
    }

    const next = {
      tournamentId, kind, status, title: required(args.title, 160, 'Title'),
      notes: text(args.notes, 1000, 'Notes'), owner: text(args.owner, 100, 'Owner'),
      inKind: kind === 'sponsor' ? text(args.inKind, 500, 'In-kind commitment') : undefined,
      deliverables: kind === 'sponsor' ? text(args.deliverables, 600, 'Sponsor benefits') : undefined,
      dueOn: day(args.dueOn, 'Due date'),
      amountMinor: actor.finance ? args.amountMinor : previous?.amountMinor,
      ...stamp(actor, Date.now())
    }
    if (!previous) return ctx.db.insert('tournamentReportItems', { ...next, requestId })
    await ctx.db.patch(previous._id, next)
    return previous._id
  }
})

export const setSponsorInquiryStatus = mutation({
  args: {
    tournamentId: v.string(), inquiryId: v.id('sponsorLeads'),
    status: sponsorLeadSchema.fields.status, lastUpdatedAt: v.number()
  },
  handler: async (ctx, { tournamentId, inquiryId, status, lastUpdatedAt }) => {
    await requireReportAccess(ctx, 'admin')
    const inquiry = await ctx.db.get(inquiryId)
    if (inquiry?.tournament_id !== tournamentId) throw new ConvexError('Sponsor inquiry not found.')
    if (inquiry.status === status) return
    if (inquiry.updated_at !== lastUpdatedAt) throw new ConvexError('This inquiry changed. Review its current status and try again.')
    await ctx.db.patch(inquiryId, { status, updated_at: Math.max(Date.now(), inquiry.updated_at + 1) })
  }
})

async function storeRows<Kind extends SnapshotChunk['kind']>(
  ctx: MutationCtx, closeoutId: Id<'tournamentReportCloseouts'>, kind: Kind,
  rows: Extract<SnapshotChunk, { kind: Kind }>['rows']
) {
  const size = 80
  for (let offset = 0; offset < rows.length; offset += size) {
    const chunk = { closeoutId, kind, rows: rows.slice(offset, offset + size) } as Extract<SnapshotChunk, { kind: Kind }>
    await ctx.db.insert('tournamentReportSnapshotChunks', chunk)
  }
}

export const approveOperations = mutation({
  args: { tournamentId: v.string(), cutoff: v.number(), notes: v.string(), requestId: v.string() },
  handler: async (ctx, { tournamentId, cutoff, notes, requestId: rawRequestId }) => {
    const actor = await requireReportAccess(ctx, 'admin')
    const requestId = required(rawRequestId, 80, 'Request ID')
    const now = Date.now()
    const [event, latest, existing] = await Promise.all([
      getTournament(ctx, tournamentId),
      ctx.db.query('tournamentReportCloseouts').withIndex('by_tournamentId_and_version', (q) => q.eq('tournamentId', tournamentId)).order('desc').first(),
      ctx.db.query('tournamentReportCloseouts')
        .withIndex('by_tournamentId_and_requestId', (q) => q.eq('tournamentId', tournamentId).eq('requestId', requestId)).unique()
    ])
    if (existing) return existing._id
    if (!Number.isSafeInteger(cutoff) || cutoff <= 0 || cutoff > now || (event.gate_open_at > 0 && cutoff < event.gate_open_at)) {
      throw new ConvexError('Choose a gate cutoff between gate opening and now.')
    }
    const [operations, items] = await Promise.all([readOperations(ctx, tournamentId, cutoff), listItems(ctx, tournamentId)])
    const { entries, roster, snapshot } = operations
    const closeoutNotes = text(notes, 1500, 'Operations notes') ?? ''
    if ((snapshot.summary.undatedCheckIns || snapshot.summary.inactiveCheckIns || snapshot.awards.some((row) => !row.winner)) && !closeoutNotes) {
      throw new ConvexError('Document check-in exceptions and open award assignments in the operations notes.')
    }
    if (latest && !closeoutNotes) throw new ConvexError('Describe what changed for this closeout version.')

    const closeoutId = await ctx.db.insert('tournamentReportCloseouts', {
      tournamentId, eventTitle: event.title, eventDate: event.event_date, venue: event.venue,
      version: (latest?.version ?? 0) + 1, cutoff, requestId, operations: snapshot, operationsNotes: closeoutNotes,
      operationsApprovedAt: now, operationsApprovedBy: actor.id, operationsApprover: actor.name
    })

    await storeRows(ctx, closeoutId, 'entries', entries)
    await storeRows(ctx, closeoutId, 'roster', roster)
    await storeRows(ctx, closeoutId, 'items', items.filter((item) => item.kind !== 'budget').map(toItemRow))
    return closeoutId
  }
})

export const approveFinance = mutation({
  args: { tournamentId: v.string(), closeoutId: v.id('tournamentReportCloseouts'), notes: v.string() },
  handler: async (ctx, { tournamentId, closeoutId, notes }) => {
    const actor = await requireReportAccess(ctx, 'finance')
    const closeout = await ctx.db.get(closeoutId)
    if (closeout?.tournamentId !== tournamentId) throw new ConvexError('Closeout version not found.')
    if (closeout.financeApprovedAt !== undefined) return closeoutId
    const latest = await ctx.db.query('tournamentReportCloseouts')
      .withIndex('by_tournamentId_and_version', (q) => q.eq('tournamentId', tournamentId)).order('desc').first()
    if (latest?._id !== closeoutId) throw new ConvexError('Approve the latest operations version.')

    const finance = await readFinance(ctx, tournamentId)
    const financeNotes = text(notes, 1500, 'Finance notes') ?? ''
    if (hasFinanceExceptions(finance.summary) && !financeNotes) {
      throw new ConvexError('Document the open balances and reconciliation exceptions before approving.')
    }

    await storeRows(ctx, closeoutId, 'transactions', finance.transactions)
    await storeRows(ctx, closeoutId, 'financeEntries', finance.entries)
    await storeRows(ctx, closeoutId, 'financeItems', finance.commitments)
    await ctx.db.patch(closeoutId, {
      finance: finance.summary, financeNotes, financeApprovedAt: Date.now(),
      financeApprovedBy: actor.id, financeApprover: actor.name
    })
    return closeoutId
  }
})
