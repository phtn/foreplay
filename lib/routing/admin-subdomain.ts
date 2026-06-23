export const adminRoutePrefix = '/admin'
export const adminSubdomainLabel = 'admin'
export const adminSubdomainHandoffPath = '/admin-handoff'

export type AdminSubdomainMode = 'auto' | 'force' | 'off'

/**
 * Controls admin subdomain behavior.
 *
 * - 'auto': Reserved for future hostname-based subdomain handoff.
 * - 'force': Always attempt admin subdomain handoff (use when you have wildcard DNS even on custom vercel domains).
 * - 'off' (default): Never use subdomain. Everything stays on the main origin using /admin-handoff + /admin paths.
 *
 * Can be set via ADMIN_SUBDOMAIN_MODE or NEXT_PUBLIC_ADMIN_SUBDOMAIN_MODE.
 */
function resolveAdminSubdomainMode(): AdminSubdomainMode {
  const raw =
    (typeof process !== 'undefined' && process.env
      ? process.env.ADMIN_SUBDOMAIN_MODE ?? process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN_MODE
      : undefined) ?? 'off'

  if (raw === 'force') return 'force'
  if (raw === 'off') return 'off'
  return 'auto'
}

export const adminSubdomainMode: AdminSubdomainMode = resolveAdminSubdomainMode()

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

export function getHostnameFromHostHeader(hostHeader: string | null | undefined) {
  if (!hostHeader) {
    return null
  }

  const firstHost = hostHeader.split(',')[0]?.trim()

  if (!firstHost) {
    return null
  }

  try {
    return normalizeHostname(new URL(`http://${firstHost}`).hostname)
  } catch {
    return normalizeHostname(firstHost.replace(/:\d+$/, ''))
  }
}

function isIpv4Address(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
}

function isIpv6Address(hostname: string) {
  return hostname.includes(':')
}

export function isIpHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)
  return isIpv4Address(normalizedHostname) || isIpv6Address(normalizedHostname)
}

export function isAdminSubdomainHostname(hostname: string) {
  return normalizeHostname(hostname).startsWith(`${adminSubdomainLabel}.`)
}

export function stripAdminSubdomain(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)

  if (!isAdminSubdomainHostname(normalizedHostname)) {
    return normalizedHostname
  }

  return normalizedHostname.slice(adminSubdomainLabel.length + 1)
}

function isVercelHostname(hostname: string) {
  const normalized = normalizeHostname(hostname)
  return normalized.endsWith('.vercel.app') || normalized.endsWith('.vercel.dev')
}

function isVercelDeployment() {
  return process.env.VERCEL === '1' || typeof process.env.VERCEL_ENV === 'string'
}

export function supportsAdminSubdomain(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)

  if (normalizedHostname.length === 0) {
    return false
  }

  // Keep localhost on the same origin. Browsers do not reliably support sharing
  // the session cookie across localhost and admin.localhost via the Domain attribute.
  if (normalizedHostname === 'localhost') {
    return false
  }

  if (isIpHostname(normalizedHostname)) {
    return false
  }

  if (adminSubdomainMode === 'off') {
    return false
  }

  if (adminSubdomainMode === 'force') {
    // When forced, we still block IPs but allow everything else (including vercel domains
    // if the user has configured the domain + DNS properly).
    return true
  }

  // 'auto' mode is intentionally disabled for now. Keep admin routing same-origin
  // unless subdomain handoff is explicitly forced via environment configuration.
  if (isVercelDeployment() || isVercelHostname(normalizedHostname)) {
    return false
  }

  return false
}

export function toAdminSubdomainHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname)

  if (!supportsAdminSubdomain(normalizedHostname) || isAdminSubdomainHostname(normalizedHostname)) {
    return normalizedHostname
  }

  return `${adminSubdomainLabel}.${normalizedHostname}`
}

export function toAdminExternalPath(pathname: string) {
  if (pathname === adminRoutePrefix) {
    return '/'
  }

  if (pathname.startsWith(`${adminRoutePrefix}/`)) {
    return pathname.slice(adminRoutePrefix.length)
  }

  return pathname
}

export function toAdminInternalPath(pathname: string) {
  if (pathname === '/' || pathname.length === 0) {
    return adminRoutePrefix
  }

  if (pathname === adminRoutePrefix || pathname.startsWith(`${adminRoutePrefix}/`)) {
    return pathname
  }

  return `${adminRoutePrefix}${pathname}`
}

export function isAdminRoutePath(pathname: string) {
  return pathname === adminRoutePrefix || pathname.startsWith(`${adminRoutePrefix}/`)
}

export function isAdminSubdomainPassthroughPath(pathname: string) {
  return pathname === adminSubdomainHandoffPath || pathname.startsWith(`${adminSubdomainHandoffPath}/`)
}

export function getSharedCookieDomain(hostname: string) {
  const appHostname = stripAdminSubdomain(hostname)

  if (appHostname === 'localhost') {
    return undefined
  }

  if (!supportsAdminSubdomain(appHostname)) {
    return undefined
  }

  return appHostname
}
