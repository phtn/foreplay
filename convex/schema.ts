import { defineSchema, defineTable } from 'convex/server'
import { accountSchema } from './accounts/d'
import { adminSchema } from './admin/d'
import { eventSchema } from './events/d'
import { historySchema } from './history/d'
import { leagueSchema } from './leagues/d'
import { orderSchema } from './orders/d'
import { paymentMethodSchema } from './paymentMethods/d'
import { podiumAwardSchema } from './podiumAwards/d'
import { registrationSchema } from './registrations/d'
import { sponsorLeadSchema } from './sponsorLeads/d'
import {
  subscriptionSchema,
  subscriptionStatusChangeSchema
} from './subscriptions/d'
import { tournamentSchema } from './tournaments/d'
import { txnSchema } from './txns/d'
import { userSchema } from './users/d'

export default defineSchema({
  admin: defineTable(adminSchema).index('by_identifier', ['identifier']),
  users: defineTable(userSchema).index('by_name', ['name']).index('by_tokenIdentifier', ['tokenIdentifier']),
  accounts: defineTable(accountSchema).index('by_sub', ['sub']),
  leagues: defineTable(leagueSchema).index('by_userId', ['userId']).index('by_accountId', ['accountId']),
  orders: defineTable(orderSchema).index('by_refNumber', ['refNumber']),
  paymentMethods: defineTable(paymentMethodSchema).index('by_kind', ['kind']).index('by_kind_active', ['kind', 'isActive']),
  podiumAwards: defineTable(podiumAwardSchema)
    .index('by_tournamentId', ['tournament_id'])
    .index('by_tournamentId_awardKey_position', ['tournament_id', 'award_key', 'position']),
  history: defineTable(historySchema)
    .index('by_userId', ['userId'])
    .index('by_accountId', ['accountId'])
    .index('by_txnId', ['txnId']),
  txns: defineTable(txnSchema).index('by_userId', ['userId']).index('by_accountId', ['accountId']),
  registrations: defineTable(registrationSchema)
    .index('by_user_id', ['user_id'])
    .index('by_tournamentId', ['tournament_id'])
    .index('by_subscriptionId', ['subscription_id'])
    .index('by_ticketToken', ['ticket_token']),
  sponsorLeads: defineTable(sponsorLeadSchema).index('by_tournamentId', ['tournament_id']),
  subscriptions: defineTable(subscriptionSchema)
    .index('by_user_id', ['user_id'])
    .index('by_tournamentId', ['tournament_id'])
    .index('by_userId_tournamentId', ['user_id', 'tournament_id'])
    .index('by_tournamentId_formId', ['tournament_id', 'form_id']),
  subscriptionStatusChanges: defineTable(
    subscriptionStatusChangeSchema
  ).index('by_subscription_id', ['subscription_id']),
  tournaments: defineTable(tournamentSchema).index('by_tournament_id', ['id']),
  events: defineTable(eventSchema).index('by_organizer_id', ['organizer_id'])
})
