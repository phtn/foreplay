import type { Doc } from '@/convex/_generated/dataModel'

export type UserWithClaims = {
  claims: Record<string, unknown>
  user: Doc<'users'>
}

const normalizeSearchValue = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')

const getUserSearchText = (user: Doc<'users'>) =>
  normalizeSearchValue(
    [
      user.email,
      user.name,
      user.nickname,
      user.phone,
      user.preferredUsername,
      user.subject,
      user.tokenIdentifier
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ')
  )

export const hasStaffOrAdminClaim = ({ claims }: UserWithClaims) =>
  claims.admin === true || claims.staff === true

export function filterStaffUsers(data: readonly UserWithClaims[] | undefined, query: string) {
  const searchTerms = normalizeSearchValue(query).split(' ').filter(Boolean)

  return (data ?? [])
    .filter((entry) => {
      if (searchTerms.length === 0) {
        return hasStaffOrAdminClaim(entry)
      }

      const searchText = getUserSearchText(entry.user)
      return searchTerms.every((term) => searchText.includes(term))
    })
    .toSorted((left, right) => {
      const updatedAtDifference = right.user.updatedAt - left.user.updatedAt
      return updatedAtDifference || left.user.subject.localeCompare(right.user.subject)
    })
}
