import { buildAwardTables } from '../../lib/tournaments/podium'
import { ConvexError, type Infer } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import type { awardRow, entryRow, financeEntryRow, financeItemRow, financeRow, financialSummary, operationsSummary, pairingBreakdown, reportItemRow, rosterBreakdown, rosterRow } from './d'

type ReportDb = Pick<QueryCtx, 'db'>
type Subscription = Doc<'subscriptions'>
type Registration = Doc<'registrations'>
type Item = Doc<'tournamentReportItems'>
type Transaction = Doc<'tournamentReportTransactions'>

export const REPORT_SOURCE_LIMIT = 4_000

export function completeRows<T>(rows: T[], source: string) {
  if (rows.length > REPORT_SOURCE_LIMIT) {
    throw new ConvexError(`This tournament exceeds the reporting limit for ${source}. A complete report could not be generated.`)
  }

  return rows
}

export async function getTournament({ db }: ReportDb, tournamentId: string) {
  const tournament = await db.query('tournaments')
    .withIndex('by_tournament_id', (q) => q.eq('id', tournamentId))
    .unique()

  if (!tournament) throw new ConvexError('Tournament not found.')
  return tournament
}

export const listEntries = async ({ db }: ReportDb, id: string) => completeRows(
  await db.query('subscriptions').withIndex('by_tournamentId', (q) => q.eq('tournament_id', id)).take(REPORT_SOURCE_LIMIT + 1),
  'entries'
)
export const listItems = async ({ db }: ReportDb, id: string) => completeRows(
  await db.query('tournamentReportItems').withIndex('by_tournamentId', (q) => q.eq('tournamentId', id)).take(REPORT_SOURCE_LIMIT + 1),
  'follow-ups'
)
const listRegistrations = async ({ db }: ReportDb, id: string) => completeRows(
  await db.query('registrations').withIndex('by_tournamentId', (q) => q.eq('tournament_id', id)).take(REPORT_SOURCE_LIMIT + 1),
  'registrations'
)
const listAwards = async ({ db }: ReportDb, id: string) => completeRows(
  await db.query('podiumAwards').withIndex('by_tournamentId', (q) => q.eq('tournament_id', id)).take(REPORT_SOURCE_LIMIT + 1),
  'awards'
)
const listTransactions = async ({ db }: ReportDb, id: string) => completeRows(
  await db.query('tournamentReportTransactions').withIndex('by_tournamentId', (q) => q.eq('tournamentId', id)).order('desc').take(REPORT_SOURCE_LIMIT + 1),
  'transactions'
)

function positiveInteger(value: string) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0
}

function legacyAmount(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null
  return Math.round(value * 100)
}

function entryStatus(row: Subscription) {
  if (row.status === 'cancelled') return 'cancelled'
  if (row.status === 'confirmed' && row.payment_status === 'paid') return 'confirmed'
  if (row.payment_status === 'pending' && row.status === 'payment_review') return 'payment_review'
  if (row.payment_status === 'pending' && (!row.status || row.status === 'pending_payment')) return 'pending_payment'
  return 'other'
}

const entryReference = (row: Subscription) => row.form_id || row.txn_ref_no || row._id
const entryLabel = (row: Subscription) => `${row.team_name || 'Entry'} · ${entryReference(row)}`

function emptyCounts() {
  return { players: 0, playersCheckedIn: 0, guests: 0, guestsCheckedIn: 0, noShows: 0, undatedCheckIns: 0, unassigned: 0 }
}

function addRosterCounts(counts: ReturnType<typeof emptyCounts>, row: Infer<typeof rosterRow>) {
  if (row.entryType === 'non_playing') {
    counts.guests++
    if (row.attendance === 'checked_in') counts.guestsCheckedIn++
  } else {
    counts.players++
    if (row.attendance === 'checked_in') counts.playersCheckedIn++
    if (row.attendance === 'no_show') counts.noShows++
    if (row.hole === null || row.group === null) counts.unassigned++
  }
  if (row.attendance === 'undated') counts.undatedCheckIns++
}

export function buildOperations(
  subscriptions: Subscription[],
  registrations: Registration[],
  podium: Doc<'podiumAwards'>[],
  cutoff?: number
) {
  const summary: Infer<typeof operationsSummary> = {
    ...emptyCounts(), entries: 0, pendingPayment: 0, paymentReview: 0, confirmed: 0,
    cancelled: 0, other: 0, inactiveCheckIns: 0
  }
  const entriesById = new Map(subscriptions.map((row) => [row._id, row]))
  const registrationsById = new Map(registrations.map((row) => [row._id, row]))
  const divisions = new Map<string, Infer<typeof rosterBreakdown>>()
  const entryTypes = new Map<string, Infer<typeof rosterBreakdown>>()
  const pairings = new Map<string, Infer<typeof pairingBreakdown>>()

  const entries: Infer<typeof entryRow>[] = subscriptions
    .filter((row) => cutoff === undefined || row._creationTime <= cutoff)
    .map((row) => {
      const status = entryStatus(row)
      summary.entries++
      if (status === 'pending_payment') summary.pendingPayment++
      else if (status === 'payment_review') summary.paymentReview++
      else if (status === 'confirmed') summary.confirmed++
      else if (status === 'cancelled') summary.cancelled++
      else summary.other++

      return {
        id: row._id, reference: entryReference(row), team: row.team_name || 'Unnamed entry',
        entryType: row.entry_type ?? 'standard', status, paymentStatus: row.payment_status,
        requestedPlayers: row.entry_type === 'non_playing' ? 0 : positiveInteger(row.total_players),
        hasReceipt: Boolean(row.receipt_image_url), createdAt: row._creationTime
      }
    })

  const roster: Infer<typeof rosterRow>[] = registrations
    .filter((row) => cutoff === undefined || row._creationTime <= cutoff)
    .map((registration) => {
      const entry = registration.subscription_id ? entriesById.get(registration.subscription_id) : undefined
      const entryType = registration.entry_type ?? entry?.entry_type ?? 'standard'
      const eligibility = registration.subscription_id
        ? Boolean(entry && entryStatus(entry) === 'confirmed' &&
          (cutoff === undefined || (entry.confirmed_at ?? entry._creationTime) <= cutoff))
        : registration.payment_status === 'paid'
      const checkedInAt = Number.isFinite(registration.checked_in_at) ? registration.checked_in_at ?? null : null
      const scanned = registration.checked_in === true && (cutoff === undefined || (checkedInAt !== null && checkedInAt <= cutoff))
      const undated = registration.checked_in === true && cutoff !== undefined && checkedInAt === null
      const attendance = scanned ? 'checked_in'
        : undated ? 'undated'
          : !eligibility ? 'ineligible'
            : cutoff !== undefined && entryType !== 'non_playing' ? 'no_show' : 'not_checked_in'

      const row = {
        id: registration._id, entryId: entry?._id ?? null, name: registration.player_name,
        division: registration.division || entry?.division || 'Unspecified',
        entryType, eligibility, attendance, checkedInAt: scanned ? checkedInAt : null,
        hole: registration.start_hole ?? null, group: registration.pairing_group ?? null
      }

      if (eligibility) {
        addRosterCounts(summary, row)
        const type = entryTypes.get(entryType) ?? { label: entryType, ...emptyCounts() }
        addRosterCounts(type, row)
        entryTypes.set(entryType, type)

        if (entryType !== 'non_playing') {
          const division = divisions.get(row.division) ?? { label: row.division, ...emptyCounts() }
          addRosterCounts(division, row)
          divisions.set(row.division, division)

          if (row.hole !== null && row.group !== null) {
            const key = `${row.hole}-${row.group}`
            const pairing = pairings.get(key) ?? { hole: row.hole, group: row.group, players: 0, checkedIn: 0 }
            pairing.players++
            if (scanned) pairing.checkedIn++
            pairings.set(key, pairing)
          }
        }
      } else if (scanned) {
        summary.inactiveCheckIns++
      }

      return row
    })

  const awardId = (key: string, position: number) => `${key}:${position}`
  const winners = new Map<string, Infer<typeof awardRow>>(podium.map((row) => [awardId(row.award_key, row.position), {
    id: awardId(row.award_key, row.position), title: row.award_title, position: row.position,
    registrationId: row.registration_id ?? null,
    winner: row.registration_id ? registrationsById.get(row.registration_id)?.player_name ?? null : null
  }]))
  const podiumPlayers = registrations.filter((row) =>
    (row.entry_type ?? (row.subscription_id ? entriesById.get(row.subscription_id)?.entry_type : undefined)) !== 'non_playing'
  )
  const awardTables = buildAwardTables(podiumPlayers, podium)
  for (const table of awardTables) {
    for (const { position } of table.slots) {
      const id = awardId(table.awardKey, position)
      if (!winners.has(id)) winners.set(id, { id, title: table.title, position, registrationId: null, winner: null })
    }
  }
  const awards = Array.from(winners.values()).sort((a, b) => a.title.localeCompare(b.title) || a.position - b.position)

  return {
    entries, roster,
    snapshot: {
      summary, awards,
      divisions: Array.from(divisions.values()).sort((a, b) => a.label.localeCompare(b.label)),
      entryTypes: Array.from(entryTypes.values()).sort((a, b) => a.label.localeCompare(b.label)),
      pairings: Array.from(pairings.values()).sort((a, b) => a.hole - b.hole || a.group.localeCompare(b.group))
    }
  }
}

export async function readOperations(ctx: ReportDb, id: string, cutoff?: number) {
  const [entries, registrations, awards] = await Promise.all([
    listEntries(ctx, id), listRegistrations(ctx, id), listAwards(ctx, id)
  ])
  return buildOperations(entries, registrations, awards, cutoff)
}

export function toItemRow(item: Item): Infer<typeof reportItemRow> {
  return {
    id: item._id, kind: item.kind, status: item.status, title: item.title,
    notes: item.notes ?? null, inKind: item.inKind ?? null, deliverables: item.deliverables ?? null, owner: item.owner ?? null, dueOn: item.dueOn ?? null
  }
}

export function transactionValues(row: Transaction) {
  return {
    tournamentId: row.tournamentId, kind: row.kind, status: row.status, amountMinor: row.amountMinor,
    description: row.description, entryId: row.entryId, itemId: row.itemId, occurredOn: row.occurredOn,
    channel: row.channel, accountLabel: row.accountLabel, externalReference: row.externalReference,
    evidence: row.evidence
  }
}

export function isIncome(kind: Transaction['kind']) {
  return kind === 'entry_payment' || kind === 'sponsorship' || kind === 'other_income'
}

export function getReferenceKey(row: Pick<Transaction, 'channel' | 'accountLabel' | 'externalReference'>) {
  return row.channel && row.accountLabel && row.externalReference
    ? JSON.stringify([row.channel, row.accountLabel.toLowerCase(), row.externalReference.toLowerCase()])
    : null
}

function cashSummary() {
  return {
    expected: 0, markedPaid: 0, paidWithoutMatch: 0, paidWithoutAmount: 0,
    entryCollected: 0, sponsorCollected: 0, otherCollected: 0, reconciledIn: 0, reconciledOut: 0,
    cashBalance: 0, refundsPaid: 0, expensesPaid: 0, feesPaid: 0, commissionsPaid: 0, prizesPaid: 0,
    outstandingIn: 0, outstandingOut: 0, refundsDue: 0, entryBalance: 0, sponsorBalance: 0, prizeBalance: 0,
    entryOverpayment: 0, sponsorOverpayment: 0, prizeOverpayment: 0,
    unmatchedCount: 0, unmatchedIn: 0, unmatchedOut: 0, budget: null
  } satisfies Infer<typeof financialSummary>
}

export function buildFinance(subscriptions: Subscription[], items: Item[], transactions: Transaction[]) {
  const summary: Infer<typeof financialSummary> = cashSummary()
  const entryReceipts = new Map<Subscription['_id'], number>()
  const itemPayments = new Map<Item['_id'], number>()
  const entryLabels = new Map(subscriptions.map((row) => [row._id, entryLabel(row)]))
  const itemLabels = new Map(items.map((row) => [row._id, row.title]))
  const references = new Map<string, number>()

  for (const row of transactions) {
    if (row.status === 'void') continue
    const income = isIncome(row.kind)
    const key = getReferenceKey(row)
    if (key) references.set(key, (references.get(key) ?? 0) + 1)

    if (row.status === 'unmatched') {
      summary.unmatchedCount++
      if (income) summary.unmatchedIn += row.amountMinor
      else summary.unmatchedOut += row.amountMinor
    } else if (row.status === 'outstanding') {
      if (income) summary.outstandingIn += row.amountMinor
      else summary.outstandingOut += row.amountMinor
      if (row.kind === 'refund') summary.refundsDue += row.amountMinor
    } else if (row.status === 'reconciled') {
      if (income) summary.reconciledIn += row.amountMinor
      else summary.reconciledOut += row.amountMinor

      if (row.kind === 'entry_payment') {
        summary.entryCollected += row.amountMinor
        if (row.entryId) entryReceipts.set(row.entryId, (entryReceipts.get(row.entryId) ?? 0) + row.amountMinor)
      }
      if (row.kind === 'sponsorship') summary.sponsorCollected += row.amountMinor
      if (row.kind === 'other_income') summary.otherCollected += row.amountMinor
      if (row.kind === 'refund') summary.refundsPaid += row.amountMinor
      if (row.kind === 'expense') summary.expensesPaid += row.amountMinor
      if (row.kind === 'fee') summary.feesPaid += row.amountMinor
      if (row.kind === 'commission') summary.commissionsPaid += row.amountMinor
      if (row.kind === 'prize') summary.prizesPaid += row.amountMinor
      if (row.itemId) itemPayments.set(row.itemId, (itemPayments.get(row.itemId) ?? 0) + row.amountMinor)
    }
  }

  const entries: Infer<typeof financeEntryRow>[] = []
  for (const row of subscriptions) {
    if (row.entry_type || row.status === 'cancelled' ||
      (row.payment_status !== 'paid' && row.payment_status !== 'pending')) continue

    const expected = legacyAmount(row.payment_amount)
    const collected = entryReceipts.get(row._id) ?? 0
    const balance = Math.max(0, (expected ?? 0) - collected)
    const markedPaid = row.payment_status === 'paid'

    summary.expected += expected ?? 0
    summary.entryBalance += balance
    if (expected !== null) summary.entryOverpayment += Math.max(0, collected - expected)
    if (markedPaid) {
      summary.markedPaid += expected ?? 0
      summary.paidWithoutMatch += balance
      if (expected === null) summary.paidWithoutAmount++
    }

    entries.push({ id: row._id, label: entryLabel(row), expected, collected, balance, markedPaid })
  }

  const commitments: Infer<typeof financeItemRow>[] = []
  for (const item of items) {
    if (item.amountMinor === undefined) continue
    const reconciled = itemPayments.get(item._id) ?? 0
    const balance = Math.max(0, item.amountMinor - reconciled)
    if (item.kind === 'sponsor' && (item.status === 'agreed' || item.status === 'fulfilled')) {
      summary.sponsorBalance += balance
      summary.sponsorOverpayment += Math.max(0, reconciled - item.amountMinor)
    }
    if (item.kind === 'prize') {
      summary.prizeBalance += balance
      summary.prizeOverpayment += Math.max(0, reconciled - item.amountMinor)
    }
    if (item.kind === 'budget' && item.status === 'approved') summary.budget = (summary.budget ?? 0) + item.amountMinor
    commitments.push({ ...toItemRow(item), amountMinor: item.amountMinor, reconciled, balance })
  }

  summary.cashBalance = summary.reconciledIn - summary.reconciledOut

  const rows: Infer<typeof financeRow>[] = transactions.map((row) => {
    const key = getReferenceKey(row)
    return {
      ...transactionValues(row), id: row._id,
      updatedAt: row.updatedAt, updatedBy: row.updatedBy, reviewer: row.reviewer,
      entryLabel: row.entryId ? entryLabels.get(row.entryId) ?? 'Archived entry' : null,
      itemLabel: row.itemId ? itemLabels.get(row.itemId) ?? 'Archived item' : null,
      duplicateReference: row.status !== 'void' && key !== null && (references.get(key) ?? 0) > 1
    }
  })

  return {
    summary,
    entries,
    commitments,
    transactions: rows,
    entryOptions: subscriptions.map((row) => ({ id: row._id, label: entryLabel(row) })),
    itemOptions: items.filter((row) => row.kind === 'sponsor' || row.kind === 'prize').map(toItemRow)
  }
}

export async function readFinance(ctx: ReportDb, id: string) {
  const [entries, items, transactions] = await Promise.all([listEntries(ctx, id), listItems(ctx, id), listTransactions(ctx, id)])
  return buildFinance(entries, items, transactions)
}
