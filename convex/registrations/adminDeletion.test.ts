import assert from 'node:assert/strict'
import test from 'node:test'

import type { Id } from '../_generated/dataModel'
import { buildAdminRegistrationDeletionPlan } from './adminDeletion'

const registrationId = (value: string) => value as Id<'registrations'>

test('deleting the final registration also deletes its subscription row', () => {
  const target = registrationId('registration-1')

  assert.deepEqual(buildAdminRegistrationDeletionPlan([target], target), {
    deleteSubscription: true,
    registrationId: target
  })
})

test('deleting one of several registrations preserves the shared subscription row', () => {
  const target = registrationId('registration-1')
  const teammate = registrationId('registration-2')

  assert.deepEqual(buildAdminRegistrationDeletionPlan([target, teammate], target), {
    deleteSubscription: false,
    registrationId: target
  })
})

test('a registration outside the subscription cannot produce a deletion plan', () => {
  const target = registrationId('registration-1')

  assert.throws(
    () => buildAdminRegistrationDeletionPlan([registrationId('registration-2')], target),
    /does not belong/
  )
})
