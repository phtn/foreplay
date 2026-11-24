import { paginationOptsValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import { query } from '../_generated/server'
import { requireReportAccess } from './access'
import { completeRows, getTournament, listItems, readFinance, readOperations, REPORT_SOURCE_LIMIT, toItemRow } from './data'

const eventArgs = { tournamentId: v.string() }

export const operations = query({
  args: eventArgs,
  handler: async (ctx, { tournamentId }) => {
    const access = await requireReportAccess(ctx, 'operations')
    const [data] = await Promise.all([readOperations(ctx, tournamentId), getTournament(ctx, tournamentId)])
    return {
      ...data.snapshot,
      roster: data.roster,
      entries: access.admin ? data.entries : [],
      awards: access.admin ? data.snapshot.awards : [],
      admin: access.admin,
      finance: access.finance
    }
  }
})

export const items = query({
  args: eventArgs,
  handler: async (ctx, { tournamentId }) => {
    const access = await requireReportAccess(ctx, 'admin')
    const [items, leads] = await Promise.all([
      listItems(ctx, tournamentId),
      ctx.db.query('sponsorLeads').withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId)).take(REPORT_SOURCE_LIMIT + 1)
    ])
    const pipeline = { new: 0, contacted: 0, won: 0, lost: 0 }
    const inquiries = completeRows(leads, 'sponsor leads').map((row) => {
      pipeline[row.status]++
      return {
        id: row._id, company: row.company_name, preferredTier: row.preferred_tier ?? null,
        status: row.status, receivedAt: row.created_at, updatedAt: row.updated_at
      }
    })

    return {
      pipeline, inquiries,
      rows: items.filter((row) => row.kind !== 'budget' || access.finance).map((row) => ({
        ...toItemRow(row),
        amountMinor: access.finance ? row.amountMinor ?? null : null, updatedAt: row.updatedAt
      }))
    }
  }
})

export const finance = query({
  args: eventArgs,
  handler: async (ctx, { tournamentId }) => {
    await requireReportAccess(ctx, 'finance')
    return readFinance(ctx, tournamentId)
  }
})

export const transactionHistory = query({
  args: { ...eventArgs, transactionId: v.id('tournamentReportTransactions'), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { tournamentId, transactionId, paginationOpts }) => {
    await requireReportAccess(ctx, 'finance')
    const transaction = await ctx.db.get(transactionId)
    if (transaction?.tournamentId !== tournamentId) throw new ConvexError('Transaction not found.')

    return ctx.db.query('tournamentReportTransactionChanges')
      .withIndex('by_transactionId', (q) => q.eq('transactionId', transactionId))
      .order('desc')
      .paginate(paginationOpts)
  }
})

export const closeouts = query({
  args: { ...eventArgs, paginationOpts: paginationOptsValidator },
  handler: async (ctx, { tournamentId, paginationOpts }) => {
    await requireReportAccess(ctx, 'admin')
    const results = await ctx.db.query('tournamentReportCloseouts')
      .withIndex('by_tournamentId_and_version', (q) => q.eq('tournamentId', tournamentId))
      .order('desc')
      .paginate(paginationOpts)

    return {
      ...results,
      page: results.page.map((row) => ({
        id: row._id, version: row.version, cutoff: row.cutoff, operationsApprover: row.operationsApprover,
        operationsApprovedAt: row.operationsApprovedAt, financeApprovedAt: row.financeApprovedAt ?? null,
        financeApprover: row.financeApprover ?? null
      }))
    }
  }
})

export const closeoutPreview = query({
  args: { ...eventArgs, cutoff: v.number() },
  handler: async (ctx, { tournamentId, cutoff }) => {
    await requireReportAccess(ctx, 'admin')
    await getTournament(ctx, tournamentId)
    const { snapshot } = await readOperations(ctx, tournamentId, cutoff)
    return snapshot
  }
})

export const closeout = query({
  args: { ...eventArgs, closeoutId: v.id('tournamentReportCloseouts') },
  handler: async (ctx, { tournamentId, closeoutId }) => {
    const access = await requireReportAccess(ctx, 'admin')
    const closeout = await ctx.db.get(closeoutId)
    if (!closeout || closeout.tournamentId !== tournamentId) throw new ConvexError('Closeout version not found.')

    const chunks = ctx.db.query('tournamentReportSnapshotChunks')
      .withIndex('by_closeoutId_and_kind', (q) => q.eq('closeoutId', closeoutId))
    const rows = { entries: [], roster: [], items: [], transactions: [], financeEntries: [], financeItems: [] } as {
      [Kind in 'entries' | 'roster' | 'items' | 'transactions' | 'financeEntries' | 'financeItems']:
        Extract<Doc<'tournamentReportSnapshotChunks'>, { kind: Kind }>['rows']
    }

    for await (const chunk of chunks) {
      switch (chunk.kind) {
        case 'entries': rows.entries.push(...chunk.rows); break
        case 'roster': rows.roster.push(...chunk.rows); break
        case 'items': rows.items.push(...chunk.rows); break
        case 'transactions': if (access.finance) rows.transactions.push(...chunk.rows); break
        case 'financeEntries': if (access.finance) rows.financeEntries.push(...chunk.rows); break
        case 'financeItems': if (access.finance) rows.financeItems.push(...chunk.rows); break
      }
    }

    return {
      ...rows,
      id: closeout._id, eventTitle: closeout.eventTitle, venue: closeout.venue, eventDate: closeout.eventDate,
      version: closeout.version, cutoff: closeout.cutoff, operations: closeout.operations,
      operationsNotes: closeout.operationsNotes, operationsApprovedAt: closeout.operationsApprovedAt,
      operationsApprover: closeout.operationsApprover, financeApprovedAt: closeout.financeApprovedAt ?? null,
      financeApprover: closeout.financeApprover ?? null,
      finance: access.finance ? closeout.finance ?? null : null,
      financeNotes: access.finance ? closeout.financeNotes ?? null : null
    }
  }
})
