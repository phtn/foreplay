const authRedirectBaseUrl = new URL('https://foreplay.local')

export const defaultSignedInPath = '/tournaments/som-2026'

export function getSafeRedirectPath(value: unknown, fallback = defaultSignedInPath) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const redirectUrl = new URL(value, authRedirectBaseUrl)

    if (redirectUrl.origin !== authRedirectBaseUrl.origin) {
      return fallback
    }

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
  } catch {
    return fallback
  }
}

export function buildLoginPath(redirectTo: string) {
  const query = new URLSearchParams({ redirectTo: getSafeRedirectPath(redirectTo, '/') })
  return `/auth/login?${query.toString()}`
}
