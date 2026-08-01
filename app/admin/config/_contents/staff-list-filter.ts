import type { Doc } from '@/convex/_generated/dataModel'
import {
  filter_staff_users,
  has_staff_or_admin_claim,
  SearchableStaffUser$SearchableStaffUser
} from 'gts/staff_list_filter.mjs'

export type UserWithClaims = {
  claims: Record<string, unknown>
  user: Doc<'users'>
}

const searchValue = (value: unknown) => (typeof value === 'string' ? value : '')

const toSearchableStaffUser = (entry: UserWithClaims) =>
  SearchableStaffUser$SearchableStaffUser(
    entry,
    entry.claims.admin === true,
    entry.claims.staff === true,
    searchValue(entry.user.email),
    searchValue(entry.user.name),
    searchValue(entry.user.nickname),
    searchValue(entry.user.phone),
    searchValue(entry.user.preferredUsername),
    entry.user.subject,
    entry.user.tokenIdentifier,
    entry.user.updatedAt
  )

export const hasStaffOrAdminClaim = ({ claims }: UserWithClaims) =>
  has_staff_or_admin_claim(claims.admin === true, claims.staff === true)

export function filterStaffUsers(data: readonly UserWithClaims[] | undefined, query: string) {
  return filter_staff_users((data ?? []).map(toSearchableStaffUser), query) as UserWithClaims[]
}
