import { defineSchema, defineTable } from 'convex/server'
import { accountSchema } from './accounts/d'
import { adminSchema } from './admin/d'
import { historySchema } from './history/d'
import { leagueSchema } from './leagues/d'
import { orderSchema } from './orders/d'
import { registrationSchema } from './registrations/d'
import { subscriptionSchema } from './subscriptions/d'
import { txnSchema } from './txns/d'
import { userSchema } from './users/d'

export default defineSchema({
  admin: defineTable(adminSchema).index('by_identifier', ['identifier']),
  users: defineTable(userSchema).index('by_name', ['name']).index('by_tokenIdentifier', ['tokenIdentifier']),
  accounts: defineTable(accountSchema).index('by_sub', ['sub']),
  leagues: defineTable(leagueSchema).index('by_userId', ['userId']).index('by_accountId', ['accountId']),
  orders: defineTable(orderSchema).index('by_refNumber', ['refNumber']),
  history: defineTable(historySchema)
    .index('by_userId', ['userId'])
    .index('by_accountId', ['accountId'])
    .index('by_txnId', ['txnId']),
  txns: defineTable(txnSchema).index('by_userId', ['userId']).index('by_accountId', ['accountId']),
  registrations: defineTable(registrationSchema)
    .index('by_user_id', ['user_id'])
    .index('by_tournamentId', ['tournament_id']),
  subscriptions: defineTable(subscriptionSchema)
    .index('by_user_id', ['user_id'])
    .index('by_tournamentId', ['tournament_id'])
})
