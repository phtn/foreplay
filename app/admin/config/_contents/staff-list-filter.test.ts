import type { Id } from '@/convex/_generated/dataModel'
import assert from 'node:assert/strict'
import test from 'node:test'

import { filterStaffUsers, type UserWithClaims } from './staff-list-filter'

const createUser = (
  subject: string,
  claims: Record<string, unknown>,
  overrides: Partial<UserWithClaims['user']> = {}
): UserWithClaims => ({
  claims,
  user: {
    _id: subject as Id<'users'>,
    _creationTime: 1,
    createdAt: 1,
    email: `${subject}@example.com`,
    emailVerified: true,
    issuer: 'https://securetoken.google.com/foreplay',
    name: subject,
    nickname: null,
    phone: null,
    pictureUrl: null,
    preferredUsername: null,
    profileUrl: null,
    subject,
    tokenIdentifier: `firebase|${subject}`,
    updatedAt: 1,
    ...overrides
  }
})

test('the default staff list contains only staff and admin accounts', () => {
  const users = [
    createUser('regular-user', {}),
    createUser('disabled-admin', { admin: false }),
    createUser('staff-user', { staff: true }, { updatedAt: 2 }),
    createUser('admin-user', { admin: true }, { updatedAt: 3 }),
    createUser('staff-admin', { admin: true, staff: true }, { updatedAt: 4 })
  ]

  assert.deepEqual(
    filterStaffUsers(users, '').map(({ user }) => user.subject),
    ['staff-admin', 'admin-user', 'staff-user']
  )
})

test('search includes matching users without staff or admin claims', () => {
  const users = [
    createUser('staff-user', { staff: true }),
    createUser('regular-user', {}, { email: 'golfer@example.com', name: 'Maria Santos' })
  ]

  assert.deepEqual(
    filterStaffUsers(users, 'GOLFER').map(({ user }) => user.subject),
    ['regular-user']
  )
})

test('search matches multiple terms across user fields', () => {
  const users = [
    createUser('target-user-id', {}, { name: 'Maria Santos', phone: '+63 917 555 0100' }),
    createUser('other-user-id', {}, { name: 'Maria Reyes', phone: '+63 905 111 0100' })
  ]

  assert.deepEqual(
    filterStaffUsers(users, 'maria 555').map(({ user }) => user.subject),
    ['target-user-id']
  )
})
