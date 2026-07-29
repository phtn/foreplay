import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { calculateEntryTotal, validateEntryFormValues, type EntryFormValues } from './entry-logic'

const validEntry: EntryFormValues = {
  fullName: 'Fairway Four',
  email: 'captain@example.com',
  phone: '+63 917 123 4567',
  division: 'Open',
  playerCount: '4',
  handicapIndex: '12.4'
}

describe('calculateEntryTotal', () => {
  test('multiplies per-player pricing by the player count', () => {
    assert.equal(calculateEntryTotal({ amount: 2500, players: 4, pricingMode: 'per-player' }), 10000)
  })

  test('keeps sponsorship package pricing flat', () => {
    assert.equal(calculateEntryTotal({ amount: 200000, players: 4, pricingMode: 'flat' }), 200000)
  })
})

describe('validateEntryFormValues', () => {
  test('accepts a complete entry', () => {
    assert.equal(validateEntryFormValues(validEntry), undefined)
  })

  test('returns actionable errors for invalid required fields', () => {
    assert.deepEqual(
      validateEntryFormValues({
        ...validEntry,
        email: 'not-an-email',
        phone: ' ',
        division: '',
        playerCount: '21'
      }),
      {
        fields: {
          email: 'Enter a valid email address.',
          phone: 'Enter your phone number.',
          playerCount: 'You can add up to 20 players per entry.',
          division: 'Select an entry option.'
        }
      }
    )
  })
})
