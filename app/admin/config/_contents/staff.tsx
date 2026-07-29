import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { getFirebaseAdminAuth } from '@/lib/firebase/admin'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import { StaffList } from './staff-list'
import type { UserWithClaims } from './staff-list-filter'

type User = Doc<'users'>

const firebaseUserBatchSize = 100

async function attachFirebaseClaims(users: User[]): Promise<UserWithClaims[]> {
  const firebaseAuth = getFirebaseAdminAuth()

  if (!firebaseAuth || users.length === 0) {
    return users.map((user) => ({ user, claims: {} }))
  }

  const batches = Array.from({ length: Math.ceil(users.length / firebaseUserBatchSize) }, (_, index) =>
    users.slice(index * firebaseUserBatchSize, (index + 1) * firebaseUserBatchSize)
  )
  const batchResults = await Promise.allSettled(
    batches.map((batch) => firebaseAuth.getUsers(batch.map((user) => ({ uid: user.subject }))))
  )
  const claimsByUserId = new Map(
    batchResults.flatMap((result) =>
      result.status === 'fulfilled'
        ? result.value.users.map((firebaseUser) => [firebaseUser.uid, firebaseUser.customClaims ?? {}] as const)
        : []
    )
  )

  return users.map((user) => ({
    user,
    claims: claimsByUserId.get(user.subject) ?? {}
  }))
}

export const StaffContent = async () => {
  await requireAdminSession()

  const users = await fetchQuery(api.users.q.listUsers)
  const usersWithClaims = await attachFirebaseClaims(users)

  return <StaffList data={usersWithClaims} />
}
