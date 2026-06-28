import { v } from 'convex/values'

export const podiumAwardSchema = v.object({
  tournament_id: v.string(),
  award_key: v.string(),
  award_title: v.string(),
  award_eyebrow: v.string(),
  position: v.number(),
  registration_id: v.optional(v.id('registrations')),
  updated_at: v.number()
})

export type PodiumAward = typeof podiumAwardSchema
