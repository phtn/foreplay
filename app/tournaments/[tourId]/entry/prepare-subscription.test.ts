import assert from 'node:assert/strict'
import { test } from 'node:test'

import { prepareCreateTournamentSubscription } from './prepare-subscription'

const validInput = {
  tourId: 'som-2026',
  formId: 'entry-123',
  teamName: ' Team Foreplay ',
  email: ' PLAYER@EXAMPLE.COM ',
  phone: ' 09170000000 ',
  playerCount: '2',
  paymentAmount: 2500.4,
  handicapIndex: ' 12 ',
  division: ' Open '
}

test('valid entry input becomes a plain prepared subscription', () => {
  const result = prepareCreateTournamentSubscription(validInput)

  assert.deepEqual(result, {
    ok: true,
    value: {
      teamName: 'Team Foreplay',
      contactEmail: 'player@example.com',
      contactPhone: '09170000000',
      totalPlayers: 2,
      paymentAmount: 2500,
      handicapIndex: '12',
      division: 'Open'
    }
  })
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
  assert.equal(result.ok && Object.getPrototypeOf(result.value), Object.prototype)
})

test('invalid entry input returns a serializable field message', () => {
  const result = prepareCreateTournamentSubscription({
    ...validInput,
    email: ''
  })

  assert.deepEqual(result, {
    ok: false,
    error: 'Contact email is required.'
  })
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
})
