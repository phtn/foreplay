import assert from 'node:assert/strict'
import test from 'node:test'
import type { Id } from '../convex/_generated/dataModel'
import {
  buildGatePassPayload,
  formatTicketNumber
} from '../lib/tickets/registration-ticket'

const registrationId =
  'jd7registration000000000000000000' as Id<'registrations'>

test('gate-pass payloads expose only the opaque ticket token', () => {
  const payload = buildGatePassPayload({
    _id: registrationId,
    ticket_token: 'ticket-secret'
  })

  assert.deepEqual(JSON.parse(payload), {
    ticketToken: 'ticket-secret'
  })
  assert.equal(payload.includes('name'), false)
  assert.equal(payload.includes('email'), false)
})

test('legacy tickets fall back to their registration ID', () => {
  assert.deepEqual(
    JSON.parse(
      buildGatePassPayload({
        _id: registrationId,
        ticket_token: undefined
      })
    ),
    { registrationId }
  )
})

test('ticket numbers use the stable tail of the registration ID', () => {
  assert.equal(
    formatTicketNumber(registrationId),
    registrationId.slice(-10).toUpperCase()
  )
})
