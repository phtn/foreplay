import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canDeletePlayerRegistration,
  canRemoveCustomClaim,
  canSetCustomClaim,
  canViewStaffAccount,
  hasTopGClaim
} from './custom-claim-policy'

test('only a true topg claim grants topg privileges', () => {
  assert.equal(hasTopGClaim({ topg: true }), true)
  assert.equal(hasTopGClaim({ topg: false }), false)
  assert.equal(hasTopGClaim({ topg: 'true' }), false)
  assert.equal(hasTopGClaim(undefined), false)
})

test('deleting a player registration requires both admin and topg', () => {
  assert.equal(canDeletePlayerRegistration({ admin: true, topg: true }), true)
  assert.equal(canDeletePlayerRegistration({ admin: true }), false)
  assert.equal(canDeletePlayerRegistration({ topg: true }), false)
  assert.equal(canDeletePlayerRegistration({ admin: true, topg: 'true' }), false)
})

test('topg accounts are hidden from viewers without topg', () => {
  assert.equal(canViewStaffAccount({ admin: true }, { admin: true, topg: true }), false)
  assert.equal(canViewStaffAccount({ admin: true }, { admin: true }), true)
  assert.equal(canViewStaffAccount({ admin: true, topg: true }, { admin: true, topg: true }), true)
})

test('only topg viewers can remove admin and topg claims', () => {
  assert.equal(canRemoveCustomClaim({ admin: true }, 'admin'), false)
  assert.equal(canRemoveCustomClaim({ admin: true }, 'topg'), false)
  assert.equal(canRemoveCustomClaim({ admin: true }, 'staff'), true)
  assert.equal(canRemoveCustomClaim({ admin: true, topg: true }, 'admin'), true)
  assert.equal(canRemoveCustomClaim({ admin: true, topg: true }, 'topg'), true)
})

test('ordinary admins can grant admin but cannot downgrade admin or manage topg', () => {
  const adminClaims = { admin: true }

  assert.equal(canSetCustomClaim(adminClaims, 'admin', true), true)
  assert.equal(canSetCustomClaim(adminClaims, 'admin', false), false)
  assert.equal(canSetCustomClaim(adminClaims, 'admin', null), false)
  assert.equal(canSetCustomClaim(adminClaims, 'topg', true), false)
  assert.equal(canSetCustomClaim(adminClaims, 'staff', true), true)
  assert.equal(canSetCustomClaim({ admin: true, topg: true }, 'topg', true), true)
})
