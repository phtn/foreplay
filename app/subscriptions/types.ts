import type { Doc, Id } from '@/convex/_generated/dataModel'

export type RegistrationSectionProps = {
  defaultDivision?: string
  maxEntries: number
  registrations: Doc<'registrations'>[]
  subscriptionId: Id<'subscriptions'>
}

export type DraftRegistration = {
  division: string
  handicapIndex: string
  playerEmail: string
  playerName: string
  playerPhone: string
  shirtSize: string
}
