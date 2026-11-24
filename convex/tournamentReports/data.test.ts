import assert from 'node:assert/strict'
import test from 'node:test'
import { canRemoveCustomClaim, canSetCustomClaim } from '../../lib/firebase/custom-claim-policy'
import type { Doc, Id } from '../_generated/dataModel'
import { buildFinance, buildOperations, completeRows, REPORT_SOURCE_LIMIT } from './data'
import { hasFinanceExceptions } from './financeSummary'

const tournamentId = 'fixture'

function entry(id: string, fields: Partial<Doc<'subscriptions'>> = {}): Doc<'subscriptions'> {
  return {
    _id: id as Id<'subscriptions'>, _creationTime: 1, tournament_id: tournamentId, user_id: 'contact',
    tournament_name: 'Tournament', team_name: id, total_players: '2', total_checked_in: '99',
    payment_status: 'paid', status: 'confirmed', confirmed_at: 2, payment_amount: 1_000, ...fields
  }
}

function registration(id: string, subscription: Doc<'subscriptions'>, fields: Partial<Doc<'registrations'>> = {}): Doc<'registrations'> {
  return {
    _id: id as Id<'registrations'>, _creationTime: 1, tournament_id: tournamentId, subscription_id: subscription._id,
    user_id: subscription.user_id, player_id: id, player_name: id, payment_status: 'paid',
    division: 'Open', ...fields
  }
}

function transaction(id: string, fields: Partial<Doc<'tournamentReportTransactions'>>): Doc<'tournamentReportTransactions'> {
  return {
    _id: id as Id<'tournamentReportTransactions'>, _creationTime: 1, tournamentId, requestId: id,
    status: 'reconciled', kind: 'entry_payment', amountMinor: 100, description: id,
    updatedBy: 'finance', reviewer: 'Finance', updatedAt: 1, ...fields
  }
}

test('attendance uses eligible individual players and guests and respects the gate cutoff', () => {
  const team = entry('Team')
  const guest = entry('Guest entry', { entry_type: 'non_playing', payment_amount: 0 })
  const cancelled = entry('Cancelled', { status: 'cancelled' })
  const late = entry('Late confirmation', { confirmed_at: 20 })
  const subscriptions = [team, guest, cancelled, late]
  const roster = [
    registration('Early', team, { checked_in: true, checked_in_at: 3, start_hole: 4, pairing_group: 'B' }),
    registration('Late scan', team, { checked_in: true, checked_in_at: 8 }),
    registration('Undated', team, { checked_in: true }),
    registration('Guest', guest, { checked_in: true, checked_in_at: 3 }),
    registration('Inactive scan', cancelled, { checked_in: true, checked_in_at: 4 }),
    registration('Late confirmation', late),
    registration('Late registration', team, { _creationTime: 6 })
  ]

  const live = buildOperations(subscriptions, roster, []).snapshot.summary
  assert.equal(live.players, 5)
  assert.equal(live.playersCheckedIn, 3)
  assert.equal(live.guestsCheckedIn, 1)
  assert.equal(live.noShows, 0)
  assert.equal(live.inactiveCheckIns, 1)

  const closeout = buildOperations(subscriptions, roster, [{
    _id: 'award' as Id<'podiumAwards'>, _creationTime: 1, tournament_id: tournamentId,
    position: 1, award_key: 'overall', award_title: 'Overall Podium', award_eyebrow: 'Main Award',
    registration_id: roster[0]?._id, updated_at: 4
  }], 5)
  assert.equal(closeout.snapshot.awards.find((row) => row.id === 'overall:1')?.winner, 'Early')
  assert.equal(closeout.snapshot.awards.find((row) => row.id === 'overall:2')?.winner, null)
  assert.equal(closeout.snapshot.summary.players, 3)
  assert.equal(closeout.snapshot.summary.playersCheckedIn, 1)
  assert.equal(closeout.snapshot.summary.guestsCheckedIn, 1)
  assert.equal(closeout.snapshot.summary.noShows, 1)
  assert.equal(closeout.snapshot.summary.undatedCheckIns, 1)
  assert.equal(closeout.snapshot.summary.unassigned, 2)
  assert.deepEqual(closeout.snapshot.pairings, [{ hole: 4, group: 'B', players: 1, checkedIn: 1 }])
  assert.equal(closeout.roster.find((row) => row.name === 'Late scan')?.checkedInAt, null)
  assert.equal(closeout.roster.some((row) => row.name === 'Late registration'), false)
})

test('finance counts reconciled cash once and tracks installments, obligations and duplicate references', () => {
  const paid = entry('Paid')
  const guest = entry('VIP', { entry_type: 'vip', payment_amount: 0 })
  const pending = entry('Pending', { payment_status: 'pending', status: 'pending_payment', payment_amount: 500 })
  const unknown = entry('Unverified', { payment_amount: undefined })
  const archived = entry('Cancelled', { status: 'cancelled' })
  const sponsorId = 'sponsor' as Id<'tournamentReportItems'>
  const reference = { channel: 'bank' as const, accountLabel: 'Tournament bank', externalReference: 'REF-1' }
  const sponsor: Doc<'tournamentReportItems'> = {
    _id: sponsorId, _creationTime: 1, tournamentId, kind: 'sponsor', title: 'Sponsor',
    status: 'agreed', amountMinor: 30_000, inKind: 'Prizes', requestId: 'sponsor',
    reviewer: 'Finance', updatedBy: 'finance', updatedAt: 1
  }

  const report = buildFinance([paid, pending, guest, unknown, archived], [sponsor], [
    transaction('installment-1', { ...reference, entryId: paid._id, amountMinor: 20_000 }),
    transaction('installment-2', { ...reference, entryId: paid._id, amountMinor: 10_000 }),
    transaction('sponsor', { kind: 'sponsorship', itemId: sponsorId, amountMinor: 20_000 }),
    transaction('expense', { kind: 'expense', amountMinor: 5_000 }),
    transaction('refund due', { kind: 'refund', status: 'outstanding', amountMinor: 4_000 }),
    transaction('unmatched', { kind: 'other_income', status: 'unmatched', amountMinor: 2_000 }),
    transaction('void', { ...reference, status: 'void', entryId: paid._id, amountMinor: 400_000 })
  ])

  assert.equal(report.summary.expected, 150_000)
  assert.equal(report.summary.markedPaid, 100_000)
  assert.equal(report.summary.paidWithoutMatch, 70_000)
  assert.equal(report.summary.paidWithoutAmount, 1)
  assert.equal(report.summary.entryBalance, 120_000)
  assert.equal(report.summary.sponsorBalance, 10_000)
  assert.equal(report.summary.reconciledIn, 50_000)
  assert.equal(report.summary.reconciledOut, 5_000)
  assert.equal(report.summary.cashBalance, 45_000)
  assert.equal(report.summary.refundsDue, 4_000)
  assert.equal(report.summary.outstandingOut, 4_000)
  assert.equal(report.summary.unmatchedIn, 2_000)
  assert.equal(report.summary.unmatchedCount, 1)
  assert.equal(report.transactions.filter((row) => row.duplicateReference).length, 2)
  assert.equal(hasFinanceExceptions(report.summary), true)
})

test('finance access can only be delegated by Top G accounts', () => {
  assert.equal(canSetCustomClaim({ admin: true }, 'finance', true), false)
  assert.equal(canRemoveCustomClaim({ admin: true }, 'finance'), false)
  assert.equal(canSetCustomClaim({ admin: true, topg: true }, 'finance', true), true)
  assert.equal(canRemoveCustomClaim({ admin: true, topg: true }, 'finance'), true)
})

test('a report exceeding its capacity fails explicitly', () => {
  assert.equal(completeRows(new Array(REPORT_SOURCE_LIMIT), 'entries').length, REPORT_SOURCE_LIMIT)
  assert.throws(() => completeRows(new Array(REPORT_SOURCE_LIMIT + 1), 'entries'), /complete report could not be generated/)
})
