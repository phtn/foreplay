import assert from 'node:assert/strict'
import test from 'node:test'
import { isSubscriptionEntryLocked } from '../convex/subscriptions/policy'

test('a saved entry remains editable before proof of payment is submitted', () => {
  assert.equal(
    isSubscriptionEntryLocked({
      payment_status: 'pending',
      status: 'pending_payment'
    }),
    false
  )
})

test('a receipt locks an entry even if its status has not transitioned yet', () => {
  assert.equal(
    isSubscriptionEntryLocked({
      payment_status: 'pending',
      receipt_image_url: 'storage-id',
      status: 'pending_payment'
    }),
    true
  )
})

test('payment review, confirmation, payment, and cancellation lock an entry', () => {
  assert.equal(isSubscriptionEntryLocked({ payment_status: 'pending', status: 'payment_review' }), true)
  assert.equal(isSubscriptionEntryLocked({ payment_status: 'pending', status: 'confirmed' }), true)
  assert.equal(isSubscriptionEntryLocked({ payment_status: 'paid', status: 'pending_payment' }), true)
  assert.equal(isSubscriptionEntryLocked({ payment_status: 'pending', status: 'cancelled' }), true)
})
