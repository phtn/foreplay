import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Row } from '@tanstack/react-table'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { RenderRow } from './render-row'

const cells = ['first', 'second'].map((id) => ({
  id,
  column: {
    id,
    columnDef: {
      cell: id
    },
    getSize: () => 100
  },
  getContext: () => ({})
}))

const row = {
  getAllCells: () => cells,
  getCanSelect: () => false,
  toggleSelected: () => undefined
} as unknown as Row<Record<string, never>>

const renderRow = (columnVisibility: Record<string, boolean>) =>
  renderToStaticMarkup(
    createElement(RenderRow<Record<string, never>>, {
      columnVisibility,
      isActive: false,
      isEditing: false,
      isPinned: false,
      isSelected: false,
      row,
      showSelectColumn: false
    })
  )

test('rendered table rows retain hidden cells for the collapse transition', () => {
  const visibleMarkup = renderRow({})
  const hiddenMarkup = renderRow({ second: false })

  assert.equal(visibleMarkup.match(/data-slot="table-cell"/g)?.length, 2)
  assert.equal(hiddenMarkup.match(/data-slot="table-cell"/g)?.length, 2)
  assert.match(hiddenMarkup, /data-column-visible="false"/)
  assert.match(hiddenMarkup, /aria-hidden="true"/)
  assert.match(hiddenMarkup, />first</)
  assert.match(hiddenMarkup, />second</)
})
