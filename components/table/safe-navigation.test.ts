import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  appendInternalPathSegment,
  toSafeInternalHref
} from './safe-navigation'

test('same-origin paths are accepted and normalized', () => {
  assert.equal(
    toSafeInternalHref('/users/123?tab=profile#details'),
    '/users/123?tab=profile#details'
  )
  assert.equal(toSafeInternalHref('/users/../accounts'), '/accounts')
})

test('unsafe navigation targets are rejected', () => {
  assert.equal(toSafeInternalHref('javascript:alert(1)'), null)
  assert.equal(toSafeInternalHref('https://example.com/users'), null)
  assert.equal(toSafeInternalHref('//example.com/users'), null)
  assert.equal(toSafeInternalHref('/\\example.com/users'), null)
  assert.equal(toSafeInternalHref('/%5Cexample.com/users'), null)
})

test('dynamic row values become one encoded path segment', () => {
  assert.equal(
    appendInternalPathSegment('/users', 'a/b?admin=true'),
    '/users/a%2Fb%3Fadmin%3Dtrue'
  )
  assert.equal(
    appendInternalPathSegment('//example.com/users', '123'),
    null
  )
})
