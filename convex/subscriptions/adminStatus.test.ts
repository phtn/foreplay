import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  areSubscriptionStatusSnapshotsEqual,
  resolveAdminStatusTransition,
  toSubscriptionStatusSnapshot
} from './adminStatus'

const confirmedState = {
  payment_status: 'paid' as const,
  status: 'confirmed',
  confirmed_by_id: 'admin-1',
  confirmed_by_email: 'admin@example.com',
  confirmed_by_name: 'Admin',
  confirmed_at: 123
}

describe('admin subscription status transitions', () => {
  test('confirm payment records the actor and timestamp', () => {
    assert.deepEqual(
      resolveAdminStatusTransition(
        { payment_status: 'pending', status: 'payment_review' },
        'confirm_payment',
        {
          id: 'admin-2',
          email: 'reviewer@example.com',
          name: 'Reviewer'
        },
        456
      ),
      {
        payment_status: 'paid',
        status: 'confirmed',
        confirmed_by_id: 'admin-2',
        confirmed_by_email: 'reviewer@example.com',
        confirmed_by_name: 'Reviewer',
        confirmed_at: 456
      }
    )
  })

  test('pending and review transitions clear confirmation metadata', () => {
    assert.deepEqual(
      resolveAdminStatusTransition(
        confirmedState,
        'pending_payment',
        { id: 'admin-2' },
        456
      ),
      {
        payment_status: 'pending',
        status: 'pending_payment'
      }
    )

    assert.deepEqual(
      resolveAdminStatusTransition(
        confirmedState,
        'payment_review',
        { id: 'admin-2' },
        456
      ),
      {
        payment_status: 'pending',
        status: 'payment_review'
      }
    )
  })

  test('confirmed payments cannot be cancelled directly', () => {
    assert.throws(
      () =>
        resolveAdminStatusTransition(
          confirmedState,
          'cancelled',
          { id: 'admin-2' },
          456
        ),
      /moved out of confirmed status/
    )
  })

  test('snapshots preserve optional confirmation fields exactly', () => {
    const snapshot = toSubscriptionStatusSnapshot(confirmedState)

    assert.deepEqual(snapshot, confirmedState)
    assert.equal(
      areSubscriptionStatusSnapshotsEqual(snapshot, confirmedState),
      true
    )
  })
})
