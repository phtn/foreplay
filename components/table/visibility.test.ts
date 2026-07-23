import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getVisibleColumnsSize, getVisibleHeaders } from './visibility'

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
