import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createColumnFiltersParser,
  createColumnVisibilityParser,
  createLoadedCountParser,
  createPaginationParser,
  createRowPinningParser,
  createRowSelectionParser,
  createSortingParser,
  searchParser,
  TABLE_QUERY_LIMITS
} from './parsers'

test('pagination and loaded-count parsers clamp untrusted numbers', () => {
  const pagination = createPaginationParser(100)

  assert.equal(pagination.pageIndex.parse('-10'), 0)
  assert.equal(
    pagination.pageIndex.parse('999999999'),
    TABLE_QUERY_LIMITS.pageIndex
  )
  assert.equal(pagination.pageSize.parse('0'), 1)
  assert.equal(
    pagination.pageSize.parse('999999999'),
    TABLE_QUERY_LIMITS.pageSize
  )
  assert.equal(pagination.pageSize.parse('not-a-number'), 100)

  const loadedCount = createLoadedCountParser(100)
  assert.equal(loadedCount.parse('0'), 0)
  assert.equal(
    loadedCount.parse('999999999'),
    TABLE_QUERY_LIMITS.loadedRows
  )
})

test('search state is bounded', () => {
  const oversizedSearch = 'x'.repeat(
    TABLE_QUERY_LIMITS.searchCharacters + 100
  )

  assert.equal(
    searchParser.parse(oversizedSearch).length,
    TABLE_QUERY_LIMITS.searchCharacters
  )
  assert.equal(
    searchParser.serialize(oversizedSearch).length,
    TABLE_QUERY_LIMITS.searchCharacters
  )
})

test('sorting safely round-trips encoded column IDs', () => {
  const parser = createSortingParser()
  const sorting = [{ id: 'status:group|name', desc: true }]
  const serialized = parser.serialize(sorting)

  assert.deepEqual(parser.parse(serialized), sorting)
  assert.deepEqual(parser.parse('__proto__:asc'), [])
  assert.deepEqual(parser.parse('name:sideways'), [])
})

test('column filters round-trip delimiter characters and reject unsafe keys', () => {
  const parser = createColumnFiltersParser()
  const filters = [
    {
      id: 'status:group|name',
      value: ['one,two', 'three|four', 'constructor', 'José']
    }
  ]
  const serialized = parser.serialize(filters)

  assert.deepEqual(parser.parse(serialized), filters)
  assert.deepEqual(parser.parse('__proto__:anything'), [])
})

test('column visibility preserves defaults and encoded IDs', () => {
  const parser = createColumnVisibilityParser({
    internal: false,
    visibleByDefault: true
  })
  const visibility = {
    internal: true,
    visibleByDefault: false,
    'group:name': false
  }

  assert.deepEqual(parser.parse(parser.serialize(visibility)), visibility)
  assert.deepEqual(parser.parse(null), {
    internal: false,
    visibleByDefault: true
  })
})

test('selection and pinning are bounded, encoded, and prototype-safe', () => {
  const selectionParser = createRowSelectionParser()
  const selection = {
    'row,one': true,
    'row|two': true,
    constructor: true,
    ignored: false
  }
  const parsedSelection = selectionParser.parse(
    selectionParser.serialize(selection)
  )

  assert.deepEqual(parsedSelection, {
    'row,one': true,
    'row|two': true
  })

  const oversizedSelection = Array.from(
    { length: TABLE_QUERY_LIMITS.persistedRowIds + 20 },
    (_, index) => `row-${index}`
  ).join(',')
  assert.equal(
    Object.keys(selectionParser.parse(oversizedSelection)).length,
    TABLE_QUERY_LIMITS.persistedRowIds
  )

  const pinningParser = createRowPinningParser()
  const pinning = { top: ['row,one', 'row|two'], bottom: [] }
  assert.deepEqual(
    pinningParser.parse(pinningParser.serialize(pinning)),
    pinning
  )
})
