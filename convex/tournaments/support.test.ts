import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { normalizeTournamentSupport } from './support'

describe('tournament support normalization', () => {
  test('normalizes and preserves both support contacts', () => {
    assert.deepEqual(
      normalizeTournamentSupport({
        name: ' Primary Contact ',
        title: ' Event Support ',
        email: ' PRIMARY@EXAMPLE.COM ',
        phone: ' +63 917 111 1111 ',
        secondaryName: ' Secondary Contact ',
        secondaryTitle: ' Backup Support ',
        secondaryEmail: ' SECONDARY@EXAMPLE.COM ',
        secondaryPhone: ' +63 917 222 2222 '
      }),
      {
        name: 'Primary Contact',
        title: 'Event Support',
        email: 'primary@example.com',
        phone: '+63 917 111 1111',
        secondaryName: 'Secondary Contact',
        secondaryTitle: 'Backup Support',
        secondaryEmail: 'secondary@example.com',
        secondaryPhone: '+63 917 222 2222'
      }
    )
  })

  test('keeps a secondary-only contact', () => {
    assert.deepEqual(
      normalizeTournamentSupport({
        secondaryName: 'Backup Contact'
      }),
      {
        secondaryName: 'Backup Contact'
      }
    )
  })

  test('clears support when every field is blank', () => {
    assert.equal(
      normalizeTournamentSupport({
        name: ' ',
        title: '',
        email: ' ',
        phone: '',
        secondaryName: '',
        secondaryTitle: ' ',
        secondaryEmail: '',
        secondaryPhone: ' '
      }),
      undefined
    )
  })
})
