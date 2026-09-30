import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  formatCommission,
  formatRegistrationFee,
  formatSlotsLabel,
  formatStatus,
  getPublicationLabel
} from './formatters'

describe('Gleam-backed formatters', () => {
  test('formats registration fee labels', () => {
    assert.equal(formatRegistrationFee(0), 'Sponsor-driven event')
    assert.equal(formatRegistrationFee(1000), peso(1000))
  })

  test('formats slot labels with JavaScript optional-value semantics', () => {
    assert.equal(formatSlotsLabel(12), '12')
    assert.equal(formatSlotsLabel(12, 0), '12')
    assert.equal(formatSlotsLabel(12, 24), '12/24')
  })

  test('formats publication labels', () => {
    assert.equal(getPublicationLabel(undefined), 'Published')
    assert.equal(getPublicationLabel(true), 'Published')
    assert.equal(getPublicationLabel(false), 'Draft')
  })

  test('formats commission labels, including a configured zero', () => {
    assert.equal(formatCommission('fixed'), 'Not configured')
    assert.equal(formatCommission('fixed', 0), 'fixed · 0')
  })

  test('formats status labels without changing the remaining character case', () => {
    assert.equal(formatStatus(undefined), 'Pending Payment')
    assert.equal(formatStatus('WAITING_review'), 'WAITING Review')
    assert.equal(formatStatus(''), '')
  })
})

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value)
