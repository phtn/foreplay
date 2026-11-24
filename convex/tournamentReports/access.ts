import { ConvexError } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export async function requireReportAccess(ctx: QueryCtx | MutationCtx, scope: 'operations' | 'admin' | 'finance') {
  const identity = await ctx.auth.getUserIdentity()
  const admin = identity?.admin === true
  const finance = admin && (identity.finance === true || identity.topg === true)
  const allowed = scope === 'finance' ? finance : admin || (scope === 'operations' && identity?.staff === true)

  if (!identity || !allowed) throw new ConvexError('You do not have access to this report.')

  return {
    admin,
    finance,
    id: identity.tokenIdentifier,
    name: identity.name?.trim() || identity.email?.trim() || 'Administrator'
  }
}
