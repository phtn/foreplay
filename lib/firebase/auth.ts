'use client'

import { FirebaseError } from 'firebase/app'
import { getFirebaseCustomClaimsFromIdTokenResult, type FirebaseCustomClaims } from '@/lib/firebase/custom-claims'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential
} from 'firebase/auth'
import { useEffect, useState } from 'react'

import { auth, isFirebaseConfigured } from './config'

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account'
})

function getConfiguredAuth() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase auth is not configured.')
  }

  return auth
}

const firebaseAuthErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'That email address is already in use.',
  'auth/invalid-credential': 'The email or password you entered is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-password': 'Enter your password to continue.',
  'auth/network-request-failed': 'A network error interrupted the request. Try again.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
  'auth/popup-closed-by-user': 'The sign-in popup was closed before the login finished.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/user-not-found': 'If an account exists for that email, a reset email will be sent.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/wrong-password': 'The email or password you entered is incorrect.'
}

export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(getConfiguredAuth(), googleProvider)
}

export async function signInWithEmailPassword(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getConfiguredAuth(), email, password)
}

export async function registerWithEmailPassword(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(getConfiguredAuth(), email, password)
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getConfiguredAuth(), email)
}

export function isFirebaseAuthError(error: unknown, code?: string): error is FirebaseError {
  if (!(error instanceof FirebaseError)) {
    return false
  }

  return code ? error.code === code : true
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return firebaseAuthErrorMessages[error.code] ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [customClaims, setCustomClaims] = useState<FirebaseCustomClaims>({})
  const [hasAdminClaim, setHasAdminClaim] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) return

    let isCancelled = false
    let latestTokenRequest = 0

    const unsubscribe = onIdTokenChanged(auth, (nextUser) => {
      latestTokenRequest += 1
      const requestId = latestTokenRequest

      setUser(nextUser)

      if (!nextUser) {
        setCustomClaims({})
        setHasAdminClaim(false)
        setIsLoading(false)
        return
      }

      void nextUser
        .getIdTokenResult()
        .then((tokenResult) => {
          if (isCancelled || requestId !== latestTokenRequest) {
            return
          }

          const nextCustomClaims = getFirebaseCustomClaimsFromIdTokenResult(tokenResult)
          setCustomClaims(nextCustomClaims)
          setHasAdminClaim(nextCustomClaims.admin === true)
        })
        .catch(() => {
          if (isCancelled || requestId !== latestTokenRequest) {
            return
          }

          setCustomClaims({})
          setHasAdminClaim(false)
        })
        .finally(() => {
          if (isCancelled || requestId !== latestTokenRequest) {
            return
          }

          setIsLoading(false)
        })
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  return { customClaims, hasAdminClaim, isLoading, user }
}

export async function signOutUser(): Promise<void> {
  await signOut(getConfiguredAuth())
}
