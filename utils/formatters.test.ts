import { describe, expect, test } from 'bun:test'
import {
  formatCommission,
  formatRegistrationFee,
  formatSlotsLabel,
  formatStatus,
  getPublicationLabel
} from './formatters'

describe('Gleam-backed formatters', () => {
  test('formats registration fee labels', () => {
    expect(formatRegistrationFee(0)).toBe('Sponsor-driven event')
    expect(formatRegistrationFee(1000)).toBe(peso(1000))
  })

  test('formats slot labels with JavaScript optional-value semantics', () => {
    expect(formatSlotsLabel(12)).toBe('12')
    expect(formatSlotsLabel(12, 0)).toBe('12')
    expect(formatSlotsLabel(12, 24)).toBe('12/24')
  })

  test('formats publication labels', () => {
    expect(getPublicationLabel(undefined)).toBe('Published')
    expect(getPublicationLabel(true)).toBe('Published')
    expect(getPublicationLabel(false)).toBe('Draft')
  })

  test('formats commission labels, including a configured zero', () => {
    expect(formatCommission('fixed')).toBe('Not configured')
    expect(formatCommission('fixed', 0)).toBe('fixed · 0')
  })

  test('formats status labels without changing the remaining character case', () => {
    expect(formatStatus(undefined)).toBe('Pending Payment')
    expect(formatStatus('WAITING_review')).toBe('WAITING Review')
    expect(formatStatus('')).toBe('')
  })
})

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value)
