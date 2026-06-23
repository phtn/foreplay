import type { FirebaseCustomClaims } from '@/lib/firebase/custom-claims'

export type FirebaseSessionUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export type InitialFirebaseAuthState = {
  sessionUser: FirebaseSessionUser | null
  customClaims: FirebaseCustomClaims
  hasAdminClaim: boolean
}

export const emptyInitialFirebaseAuthState: InitialFirebaseAuthState = {
  sessionUser: null,
  customClaims: {},
  hasAdminClaim: false
}
