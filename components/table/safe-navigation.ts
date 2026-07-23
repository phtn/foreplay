const INTERNAL_URL_ORIGIN = 'https://table.local'

export const toSafeInternalHref = (value: string): string | null => {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.toLowerCase().includes('%5c')
  ) {
    return null
  }

  try {
    const url = new URL(value, INTERNAL_URL_ORIGIN)
    if (url.origin !== INTERNAL_URL_ORIGIN) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export const appendInternalPathSegment = (
  baseHref: string,
  segment: string
): string | null => {
  const safeBaseHref = toSafeInternalHref(baseHref)
  if (!safeBaseHref) return null

  const url = new URL(safeBaseHref, INTERNAL_URL_ORIGIN)
  const basePath = url.pathname.replace(/\/+$/, '')
  url.pathname = `${basePath}/${encodeURIComponent(segment.slice(0, 1_024))}`
  return toSafeInternalHref(`${url.pathname}${url.search}${url.hash}`)
}
