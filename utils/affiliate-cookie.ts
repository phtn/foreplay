export function setAffiliateCookie(refCode: string) {
  if (!refCode) return
  document.cookie = `affiliate_ref=${refCode};path=/;max-age=2592000;SameSite=Lax`
}

export function getAffiliateCookie() {
  const match = document.cookie.match(/(?:^|;\s*)affiliate_ref=([^;]*)/)
  return match ? match[1] : null
}

export function clearAffiliateCookie() {
  document.cookie = 'affiliate_ref=;path=/;max-age=0'
}
