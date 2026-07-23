import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Row } from '@tanstack/react-table'
import {
  filterFn,
  globalFilterFn,
  groupFilter,
  normalizeText
} from './filter-fns'
import {
  getFilterMatchTokens,
  getFilterValueToken
} from './filter-utils'
import { TABLE_QUERY_LIMITS } from './parsers'

const createRow = (values: Record<string, unknown>) =>
  ({
    getValue: (columnId: string) => values[columnId]
  }) as Row<Record<string, unknown>>

test('text normalization is case, accent, and whitespace insensitive', () => {
  assert.equal(normalizeText('  José   García  '), 'jose garcia')
})

test('global filtering uses its pre-resolved normalized query', () => {
  const row = createRow({
    name: 'José García',
    tags: ['Premium', 'Returning']
  })
  const resolvedQuery = globalFilterFn.resolveFilterValue?.('  GARCÍA ')

  assert.equal(
    globalFilterFn(row, 'name', resolvedQuery),
    true
  )
  assert.equal(
    globalFilterFn(row, 'tags', 'return'),
    true
  )
  assert.equal(
    globalFilterFn(row, 'name', 'missing'),
    false
  )
})

test('column filters match normalized text and grouped tokens', () => {
  const row = createRow({
    city: 'São Paulo',
    groups: ['alpha', 'beta']
  })

  assert.equal(filterFn(row, 'city', 'sao'), true)
  assert.equal(filterFn(row, 'groups', ['beta']), true)
  assert.equal(
    groupFilter(row, 'groups', ['beta']),
    true
  )
  assert.equal(
    groupFilter(row, 'groups', ['gamma']),
    false
  )
})

test('filter tokens are bounded and tolerate cyclic values', () => {
  const cyclic: unknown[] = []
  cyclic.push(cyclic)

  assert.doesNotThrow(() => getFilterMatchTokens(cyclic))
  assert.match(getFilterValueToken(cyclic), /Circular/)
  assert.equal(
    getFilterValueToken(
      'x'.repeat(TABLE_QUERY_LIMITS.tokenCharacters + 100)
    ).length,
    TABLE_QUERY_LIMITS.tokenCharacters
  )
})
