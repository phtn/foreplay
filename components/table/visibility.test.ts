import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTable, getCoreRowModel } from '@tanstack/react-table'

import {
  RETAINED_COLUMN_MODEL_VISIBILITY,
  areVisibilityStatesEqual,
  getVisibleColumnsSize,
  isColumnVisible,
  reconcileColumnVisibility,
  resolveColumnVisibilityUpdate
} from './visibility'

test('table width only includes visible columns', () => {
  const visibleColumns = [
    { getIsVisible: () => true, getSize: () => 120 },
    { getIsVisible: () => true, getSize: () => 180 }
  ]

  assert.equal(getVisibleColumnsSize(visibleColumns), 300)
})

test('controlled visibility explicitly identifies collapsed columns', () => {
  assert.equal(isColumnVisible('first', { second: false }), true)
  assert.equal(isColumnVisible('second', { second: false }), false)
})

test('the animated table model retains the adjacent header when the first column collapses', () => {
  const presentationVisibility = { reference: false }
  const table = createTable({
    columns: [
      { id: 'reference', accessorKey: 'reference' },
      { id: 'created', accessorKey: 'created' }
    ],
    data: [{ reference: 'REF-1', created: 'Today' }],
    getCoreRowModel: getCoreRowModel(),
    onStateChange: () => undefined,
    renderFallbackValue: null,
    state: {
      columnPinning: { left: [], right: [] },
      columnVisibility: RETAINED_COLUMN_MODEL_VISIBILITY
    }
  })

  assert.equal(isColumnVisible('reference', presentationVisibility), false)
  assert.deepEqual(
    table.getHeaderGroups()[0]?.headers.map((header) => header.column.id),
    ['reference', 'created']
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
