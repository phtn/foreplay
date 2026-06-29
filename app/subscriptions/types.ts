import { Doc, Id } from '@/convex/_generated/dataModel'

export interface DerivedRegistration {
  id: Id<'registrations'>
  slotLabel: string
  name: string
  email: string
  gatePassPayload: string
  checkedIn: boolean
  checkedInAt?: number
  phone: string
  division: string
  handicap: string
  shirtSize: string
}
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
