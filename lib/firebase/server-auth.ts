import 'server-only'

import { getFirebaseCustomClaimsFromDecodedToken } from '@/lib/firebase/custom-claims'
import { emptyInitialFirebaseAuthState, type FirebaseSessionUser, type InitialFirebaseAuthState } from '@/lib/firebase/auth-state'
import { stripAdminSubdomain } from '@/lib/routing/admin-subdomain'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { getFirebaseAdminAuth } from './admin'
import { firebaseSessionCookieName } from './session'

type VerifiedFirebaseSession = {
  customClaims: ReturnType<typeof getFirebaseCustomClaimsFromDecodedToken>
  decodedToken: DecodedIdToken
}

function getFirebaseSessionUserFromDecodedToken(decodedToken: DecodedIdToken): FirebaseSessionUser {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
    displayName: typeof decodedToken.name === 'string' ? decodedToken.name : null,
    photoURL: typeof decodedToken.picture === 'string' ? decodedToken.picture : null
  }
}

async function buildAppHomeUrl() {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')

  if (!host) {
    return '/'
  }

  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  const appUrl = new URL(`${protocol}://${host}`)
  appUrl.hostname = stripAdminSubdomain(appUrl.hostname)
  appUrl.pathname = '/'
  appUrl.search = ''
  appUrl.hash = ''
  return appUrl.toString()
}

export const getVerifiedFirebaseSession = cache(async (): Promise<VerifiedFirebaseSession | null> => {
  const auth = getFirebaseAdminAuth()

  if (!auth) {
    return null
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(firebaseSessionCookieName)?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true)

    return {
      customClaims: getFirebaseCustomClaimsFromDecodedToken(decodedToken),
      decodedToken
    }
  } catch {
    return null
  }
})

export const getVerifiedAdminSession = cache(async (): Promise<VerifiedFirebaseSession | null> => {
  const session = await getVerifiedFirebaseSession()

  if (!session || session.customClaims.admin !== true) {
    return null
  }

  return session
})

export const getVerifiedGateScannerSession = cache(async (): Promise<VerifiedFirebaseSession | null> => {
  const session = await getVerifiedFirebaseSession()

  if (!session || (session.customClaims.admin !== true && session.customClaims.staff !== true)) {
    return null
  }

  return session
})

export const getInitialFirebaseAuthState = cache(async (): Promise<InitialFirebaseAuthState> => {
  const session = await getVerifiedFirebaseSession()

  if (!session) {
    return emptyInitialFirebaseAuthState
  }

  return {
    sessionUser: getFirebaseSessionUserFromDecodedToken(session.decodedToken),
    customClaims: session.customClaims,
    hasAdminClaim: session.customClaims.admin === true
  }
})

export async function requireAdminSession() {
  const session = await getVerifiedAdminSession()

  if (!session) {
    redirect(await buildAppHomeUrl())
  }

  return session
}

export async function requireGateScannerSession() {
  const session = await getVerifiedGateScannerSession()

  if (!session) {
    redirect(await buildAppHomeUrl())
  }

  return session
}
