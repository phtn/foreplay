import { v } from 'convex/values'

export const transactionKind = v.union(
  v.literal('entry_payment'), v.literal('sponsorship'), v.literal('other_income'),
  v.literal('refund'), v.literal('fee'), v.literal('expense'), v.literal('commission'), v.literal('prize')
)
export const transactionStatus = v.union(
  v.literal('unmatched'), v.literal('outstanding'), v.literal('reconciled'), v.literal('void')
)
export const paymentChannel = v.union(v.literal('bank'), v.literal('ewallet'), v.literal('cash'), v.literal('other'))
export const itemKind = v.union(v.literal('incident'), v.literal('sponsor'), v.literal('prize'), v.literal('budget'))
export const itemStatus = v.union(
  v.literal('open'), v.literal('resolved'), v.literal('lead'), v.literal('agreed'),
  v.literal('fulfilled'), v.literal('closed'), v.literal('lost'), v.literal('approved')
)

export const transactionFields = {
  tournamentId: v.string(),
  kind: transactionKind,
  status: transactionStatus,
  amountMinor: v.number(),
  description: v.string(),
  entryId: v.optional(v.id('subscriptions')),
  itemId: v.optional(v.id('tournamentReportItems')),
  occurredOn: v.optional(v.string()),
  channel: v.optional(paymentChannel),
  accountLabel: v.optional(v.string()),
  externalReference: v.optional(v.string()),
  evidence: v.optional(v.string())
}

const changeFields = {
  updatedAt: v.number(),
  updatedBy: v.string(),
  reviewer: v.string()
}
export const transactionSchema = v.object({
  ...transactionFields,
  ...changeFields,
  requestId: v.string(),
  statementKey: v.optional(v.string())
})
export const transactionChangeSchema = v.object({
  transactionId: v.id('tournamentReportTransactions'),
  previous: v.optional(v.object(transactionFields)),
  next: v.object(transactionFields),
  reason: v.optional(v.string()),
  ...changeFields
})
export const itemFields = {
  tournamentId: v.string(),
  kind: itemKind,
  status: itemStatus,
  title: v.string(),
  notes: v.optional(v.string()),
  inKind: v.optional(v.string()),
  deliverables: v.optional(v.string()),
  owner: v.optional(v.string()),
  dueOn: v.optional(v.string()),
  amountMinor: v.optional(v.number())
}
export const itemSchema = v.object({ ...itemFields, ...changeFields, requestId: v.string() })

const countFields = {
  players: v.number(), playersCheckedIn: v.number(), guests: v.number(), guestsCheckedIn: v.number(),
  noShows: v.number(), undatedCheckIns: v.number(), unassigned: v.number()
}
export const operationsSummary = v.object({
  ...countFields,
  entries: v.number(), pendingPayment: v.number(), paymentReview: v.number(), confirmed: v.number(),
  cancelled: v.number(), other: v.number(), inactiveCheckIns: v.number()
})
export const rosterBreakdown = v.object({ label: v.string(), ...countFields })
export const pairingBreakdown = v.object({ hole: v.number(), group: v.string(), players: v.number(), checkedIn: v.number() })
export const awardRow = v.object({
  id: v.string(), title: v.string(), position: v.number(), winner: v.union(v.string(), v.null()),
  registrationId: v.union(v.string(), v.null())
})
export const entryRow = v.object({
  id: v.id('subscriptions'), reference: v.string(), team: v.string(), entryType: v.string(),
  status: v.string(), paymentStatus: v.string(), requestedPlayers: v.number(), hasReceipt: v.boolean(),
  createdAt: v.number()
})
export const rosterRow = v.object({
  id: v.id('registrations'), entryId: v.union(v.id('subscriptions'), v.null()), name: v.string(),
  division: v.string(), entryType: v.string(), eligibility: v.boolean(), attendance: v.string(),
  checkedInAt: v.union(v.number(), v.null()), hole: v.union(v.number(), v.null()), group: v.union(v.string(), v.null())
})
export const reportItemRow = v.object({
  id: v.id('tournamentReportItems'), kind: itemKind, status: itemStatus, title: v.string(),
  notes: v.union(v.string(), v.null()), inKind: v.union(v.string(), v.null()), deliverables: v.union(v.string(), v.null()), owner: v.union(v.string(), v.null()), dueOn: v.union(v.string(), v.null())
})
export const savedOperations = v.object({
  summary: operationsSummary,
  divisions: v.array(rosterBreakdown),
  entryTypes: v.array(rosterBreakdown),
  pairings: v.array(pairingBreakdown),
  awards: v.array(awardRow)
})

export const financialSummary = v.object({
  expected: v.number(), markedPaid: v.number(), paidWithoutMatch: v.number(), paidWithoutAmount: v.number(),
  entryCollected: v.number(), sponsorCollected: v.number(), otherCollected: v.number(),
  reconciledIn: v.number(), reconciledOut: v.number(), cashBalance: v.number(),
  refundsPaid: v.number(), expensesPaid: v.number(), feesPaid: v.number(), commissionsPaid: v.number(), prizesPaid: v.number(),
  outstandingIn: v.number(), outstandingOut: v.number(), refundsDue: v.number(),
  entryBalance: v.number(), sponsorBalance: v.number(), prizeBalance: v.number(),
  entryOverpayment: v.number(), sponsorOverpayment: v.number(), prizeOverpayment: v.number(), unmatchedCount: v.number(),
  unmatchedIn: v.number(), unmatchedOut: v.number(), budget: v.union(v.number(), v.null())
})
export const financeEntryRow = v.object({
  id: v.id('subscriptions'), label: v.string(), expected: v.union(v.number(), v.null()), collected: v.number(),
  balance: v.number(), markedPaid: v.boolean()
})
export const financeItemRow = v.object({
  ...reportItemRow.fields, amountMinor: v.number(), reconciled: v.number(), balance: v.number()
})
export const financeRow = v.object({
  ...transactionFields,
  ...changeFields,
  id: v.id('tournamentReportTransactions'),
  entryLabel: v.union(v.string(), v.null()),
  itemLabel: v.union(v.string(), v.null()),
  duplicateReference: v.boolean()
})

export const closeoutSchema = v.object({
  tournamentId: v.string(),
  eventTitle: v.string(),
  eventDate: v.string(),
  venue: v.string(),
  version: v.number(),
  requestId: v.string(),
  cutoff: v.number(),
  operations: savedOperations,
  operationsNotes: v.string(),
  operationsApprovedAt: v.number(),
  operationsApprovedBy: v.string(),
  operationsApprover: v.string(),
  finance: v.optional(financialSummary),
  financeNotes: v.optional(v.string()),
  financeApprovedAt: v.optional(v.number()),
  financeApprovedBy: v.optional(v.string()),
  financeApprover: v.optional(v.string())
})

export const snapshotChunkSchema = v.union(
  v.object({ closeoutId: v.id('tournamentReportCloseouts'), kind: v.literal('entries'), rows: v.array(entryRow) }),
  v.object({ closeoutId: v.id('tournamentReportCloseouts'), kind: v.literal('roster'), rows: v.array(rosterRow) }),
  v.object({ closeoutId: v.id('tournamentReportCloseouts'), kind: v.literal('items'), rows: v.array(reportItemRow) }),
  v.object({ closeoutId: v.id('tournamentReportCloseouts'), kind: v.literal('transactions'), rows: v.array(financeRow) }),
  v.object({ closeoutId: v.id('tournamentReportCloseouts'), kind: v.literal('financeEntries'), rows: v.array(financeEntryRow) }),
  v.object({ closeoutId: v.id('tournamentReportCloseouts'), kind: v.literal('financeItems'), rows: v.array(financeItemRow) })
)
