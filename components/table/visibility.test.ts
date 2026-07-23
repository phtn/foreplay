import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  areVisibilityStatesEqual,
  getVisibleColumnsSize,
  getVisibleHeaders,
  getVisibleRowCells,
  reconcileColumnVisibility,
  resolveColumnVisibilityUpdate
} from './visibility'

test('retained headers are filtered against current column visibility', () => {
  let secondColumnVisible = true
  const headers = [
    {
      id: 'first',
      column: {
        getIsVisible: () => true,
        getSize: () => 120
      }
    },
    {
      id: 'second',
      column: {
        getIsVisible: () => secondColumnVisible,
        getSize: () => 180
      }
    }
  ]

  assert.deepEqual(
    getVisibleHeaders(headers).map((header) => header.id),
    ['first', 'second']
  )

  secondColumnVisible = false

  assert.deepEqual(
    getVisibleHeaders(headers).map((header) => header.id),
    ['first']
  )
})

test('table width only includes visible columns', () => {
  const visibleColumns = [
    { getIsVisible: () => true, getSize: () => 120 },
    { getIsVisible: () => true, getSize: () => 180 }
  ]

  assert.equal(getVisibleColumnsSize(visibleColumns), 300)
})

test('row cells are filtered from live column visibility instead of a stale row cache', () => {
  let secondColumnVisible = true
  const cells = [
    {
      id: 'first',
      column: {
        getIsVisible: () => true,
        getSize: () => 120
      }
    },
    {
      id: 'second',
      column: {
        getIsVisible: () => secondColumnVisible,
        getSize: () => 180
      }
    }
  ]
  const row = {
    getAllCells: () => cells,
    getVisibleCells: () => cells
  }

  secondColumnVisible = false

  assert.deepEqual(
    getVisibleRowCells(row).map((cell) => cell.id),
    ['first']
  )
})

test('visibility updaters resolve against the live state', () => {
  const current = { email: false }
  const next = resolveColumnVisibilityUpdate(current, (visibility) => ({
    ...visibility,
    phone: false
  }))

  assert.deepEqual(next, {
    email: false,
    phone: false
  })
  assert.deepEqual(current, { email: false })
})

test('visibility equality treats explicit true and an omitted key as visible', () => {
  assert.equal(areVisibilityStatesEqual({ email: true }, {}), true)
  assert.equal(areVisibilityStatesEqual({ email: false }, {}), false)
})

test('a stale URL snapshot cannot roll back a pending visibility change', () => {
  const current = { email: false }
  const pending = { email: false }

  assert.equal(reconcileColumnVisibility(current, {}, pending), current)
  assert.equal(reconcileColumnVisibility(current, { email: false }, pending), current)
})

test('external URL visibility applies when no local write is pending', () => {
  const current = { email: false }
  const incoming = { phone: false }

  assert.equal(reconcileColumnVisibility(current, incoming, null), incoming)
})
