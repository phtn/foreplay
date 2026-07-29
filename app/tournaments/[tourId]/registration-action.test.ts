import assert from 'node:assert/strict'
import test from 'node:test'

import { getTournamentRegistrationAction } from './registration-action'

test('a pending payment resumes the saved tournament entry', () => {
  assert.deepEqual(
    getTournamentRegistrationAction('som 2026', [
      {
        _id: 'subscription-pending',
        form_id: 'entry 123',
        payment_status: 'pending',
        status: 'pending_payment'
      }
    ]),
    {
      updateLabel: 'Update and Resume',
      updateHref: '/tournaments/som%202026/entry?formId=entry+123'
    }
  )
})

test('a payment under review links to its payment status', () => {
  assert.deepEqual(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription/review',
        form_id: 'entry-456',
        payment_status: 'pending',
        status: 'payment_review'
      }
    ]),
    {
      updateLabel: 'View Payment Status',
      updateHref: '/subscriptions/subscription%2Freview'
    }
  )
})

test('a pending payment takes priority over review and confirmed registrations', () => {
  assert.deepEqual(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription-confirmed',
        payment_status: 'paid',
        status: 'confirmed'
      },
      {
        _id: 'subscription-review',
        payment_status: 'pending',
        status: 'payment_review'
      },
      {
        _id: 'subscription-pending',
        form_id: 'entry-789',
        payment_status: 'pending',
        status: 'pending_payment'
      }
    ]),
    {
      updateLabel: 'Update and Resume',
      updateHref: '/tournaments/som-2026/entry?formId=entry-789'
    }
  )
})

test('a confirmed payment links to the confirmed registration', () => {
  assert.deepEqual(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription/confirmed',
        form_id: 'entry-confirmed',
        payment_status: 'paid',
        status: 'confirmed'
      }
    ]),
    {
      updateLabel: 'Payment Confirmed',
      updateHref: '/subscriptions/subscription%2Fconfirmed'
    }
  )
})

test('registration lifecycle aliases map to the current actions', () => {
  assert.deepEqual(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription-legacy-review',
        payment_status: 'pending_verification'
      },
      {
        _id: 'subscription-payment-confirmed',
        payment_status: 'pending',
        status: 'payment_confirmed'
      }
    ]),
    {
      updateLabel: 'View Payment Status',
      updateHref: '/subscriptions/subscription-legacy-review'
    }
  )

  assert.deepEqual(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription-payment-confirmed',
        payment_status: 'pending',
        status: 'payment_confirmed'
      }
    ]),
    {
      updateLabel: 'Payment Confirmed',
      updateHref: '/subscriptions/subscription-payment-confirmed'
    }
  )

  assert.deepEqual(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription-pending-upload',
        form_id: 'legacy-entry',
        payment_status: 'pending_upload'
      }
    ]),
    {
      updateLabel: 'Update and Resume',
      updateHref: '/tournaments/som-2026/entry?formId=legacy-entry'
    }
  )
})

test('cancelled and refunded registrations do not show an update action', () => {
  assert.equal(
    getTournamentRegistrationAction('som-2026', [
      {
        _id: 'subscription-cancelled',
        form_id: 'entry-cancelled',
        payment_status: 'pending',
        status: 'cancelled'
      },
      {
        _id: 'subscription-refunded',
        form_id: 'entry-refunded',
        payment_status: 'refunded',
        status: 'confirmed'
      }
    ]),
    null
  )
})
