'use client'

import { useMemo } from 'react'

import { useFirebaseUser } from '@/lib/firebase/auth'

export function useFirebaseConvexAuth(expectedUid?: string) {
  const { isLoading, user: firebaseUser } = useFirebaseUser()
  const user = expectedUid && firebaseUser?.uid !== expectedUid ? null : firebaseUser

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (!user) {
          return null
        }

        return await user.getIdToken(forceRefreshToken)
      }
    }),
    [isLoading, user]
  )
}
