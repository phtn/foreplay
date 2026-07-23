import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildLoginPath, defaultSignedInPath, getSafeRedirectPath } from './auth-redirect'

describe('getSafeRedirectPath', () => {
  test('keeps an internal path with its query and hash', () => {
    assert.equal(
      getSafeRedirectPath('/tournaments/som-2026/entry?formId=abc#payment'),
      '/tournaments/som-2026/entry?formId=abc#payment'
    )
  })

  for (const value of ['https://example.com', '//example.com', '/\\example.com']) {
    test(`rejects external redirect value ${value}`, () => {
      assert.equal(getSafeRedirectPath(value), defaultSignedInPath)
    })
  }

  test('uses the supplied fallback for a missing value', () => {
    assert.equal(getSafeRedirectPath(undefined, '/'), '/')
  })
})

describe('buildLoginPath', () => {
  test('encodes the return path as a login query parameter', () => {
    assert.equal(
      buildLoginPath('/tournaments/som-2026/entry?formId=abc'),
      '/auth/login?redirectTo=%2Ftournaments%2Fsom-2026%2Fentry%3FformId%3Dabc'
    )
  })
})
