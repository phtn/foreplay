import type { Doc, Id } from '@/convex/_generated/dataModel'

export interface RegistrationTicketData {
  checkedIn: boolean
  checkedInAt?: number
  division: string
  email: string
  eventDate?: string
  eventName?: string
  gatePassPayload: string
  handicap: string
  id: Id<'registrations'>
  name: string
  paymentStatus: string
  phone: string
  shirtSize: string
  slotLabel: string
  venue?: string
}

type GatePassRegistration = Pick<Doc<'registrations'>, '_id' | 'ticket_token'>

interface RegistrationTicketContext {
  eventDate?: string
  eventName?: string
  venue?: string
}

export function buildGatePassPayload(registration: GatePassRegistration) {
  return registration.ticket_token
    ? JSON.stringify({ ticketToken: registration.ticket_token })
    : JSON.stringify({ registrationId: registration._id })
}

export function formatTicketNumber(registrationId: Id<'registrations'>) {
  return registrationId.slice(-10).toUpperCase()
}

export function toRegistrationTicketData(
  registration: Doc<'registrations'>,
  slotLabel = 'PLAYER Name',
  context: RegistrationTicketContext = {}
): RegistrationTicketData {
  return {
    id: registration._id,
    slotLabel,
    eventDate: context.eventDate,
    eventName: context.eventName,
    name: registration.player_name,
    email: registration.player_email ?? 'N/A',
    gatePassPayload: buildGatePassPayload(registration),
    checkedIn: registration.checked_in === true,
    checkedInAt: registration.checked_in_at,
    phone: registration.player_phone ?? 'N/A',
    division: registration.division ?? 'N/A',
    handicap: registration.handicap_index ?? 'N/A',
    shirtSize: registration.shirt_size,
    paymentStatus: registration.payment_status,
    venue: context.venue
  }
}
