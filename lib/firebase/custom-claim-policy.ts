import type { FirebaseCustomClaimValue } from './custom-claims'

type Claims = Record<string, unknown> | null | undefined

export function hasTopGClaim(claims: Claims) {
  return claims?.topg === true
}

export function canDeletePlayerRegistration(claims: Claims) {
  return claims?.admin === true && hasTopGClaim(claims)
}

export function canViewStaffAccount(viewerClaims: Claims, accountClaims: Claims) {
  return hasTopGClaim(viewerClaims) || !hasTopGClaim(accountClaims)
}

export function canRemoveCustomClaim(viewerClaims: Claims, claimKey: string) {
  return claimKey !== 'admin' && claimKey !== 'topg' ? true : hasTopGClaim(viewerClaims)
}

export function canSetCustomClaim(
  viewerClaims: Claims,
  claimKey: string,
  claimValue: FirebaseCustomClaimValue
) {
  if (claimKey === 'topg') {
    return hasTopGClaim(viewerClaims)
  }

  if (claimKey === 'admin' && claimValue !== true) {
    return hasTopGClaim(viewerClaims)
  }

  return true
}
