import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { getFirebaseAdminAuth } from '@/lib/firebase/admin'
import { canViewStaffAccount, hasTopGClaim } from '@/lib/firebase/custom-claim-policy'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import { StaffList } from './staff-list'
import type { UserWithClaims } from './staff-list-filter'

type User = Doc<'users'>

const firebaseUserBatchSize = 100

type UsersWithClaimsResult = {
  resolvedUserIds: Set<string>
  usersWithClaims: UserWithClaims[]
}

async function attachFirebaseClaims(users: User[]): Promise<UsersWithClaimsResult> {
  const firebaseAuth = getFirebaseAdminAuth()

  if (!firebaseAuth || users.length === 0) {
    return {
      resolvedUserIds: new Set(),
      usersWithClaims: users.map((user) => ({ user, claims: {} }))
    }
  }

  const batches = Array.from({ length: Math.ceil(users.length / firebaseUserBatchSize) }, (_, index) =>
    users.slice(index * firebaseUserBatchSize, (index + 1) * firebaseUserBatchSize)
  )
  const batchResults = await Promise.allSettled(
    batches.map((batch) => firebaseAuth.getUsers(batch.map((user) => ({ uid: user.subject }))))
  )
  const resolvedUserIds = new Set(
    batchResults.flatMap((result, index) =>
      result.status === 'fulfilled' ? batches[index].map((user) => user.subject) : []
    )
  )
  const claimsByUserId = new Map(
    batchResults.flatMap((result) =>
      result.status === 'fulfilled'
        ? result.value.users.map((firebaseUser) => [firebaseUser.uid, firebaseUser.customClaims ?? {}] as const)
        : []
    )
  )

  return {
    resolvedUserIds,
    usersWithClaims: users.map((user) => ({
      user,
      claims: claimsByUserId.get(user.subject) ?? {}
    }))
  }
}

export const StaffContent = async () => {
  const session = await requireAdminSession()

  const users = await fetchQuery(api.users.q.listUsers)
  const { resolvedUserIds, usersWithClaims } = await attachFirebaseClaims(users)
  const isTopG = hasTopGClaim(session.customClaims)
  // Fail closed when claims cannot be resolved: the account may carry topg.
  const visibleUsers = usersWithClaims.filter(
    ({ claims, user }) =>
      isTopG || (resolvedUserIds.has(user.subject) && canViewStaffAccount(session.customClaims, claims))
  )

  return <StaffList data={visibleUsers} currentUserId={session.decodedToken.sub} isTopG={isTopG} />
}
