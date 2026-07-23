import { ConvexProvider } from 'convex/react'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RegistrationTicketCard } from '../components/tickets/registration-ticket-card'
import type { Id } from '../convex/_generated/dataModel'

const getClassesForText = (html: string, text: string) => {
  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = html.match(
    new RegExp(`<p class="([^"]*)">${escapedText}</p>`)
  )

  assert.ok(match, `Unable to find rendered text: ${text}`)
  return new Set(match[1]?.split(/\s+/))
}

test('ticket typography cannot be clipped by its metadata column', () => {
  const registrationId =
    'jd7registration1234567890' as Id<'registrations'>
  const ticket = createElement(RegistrationTicketCard, {
    registration: {
      checkedIn: false,
      division: 'Open',
      email: 'player.with.a.long.address@example.com',
      gatePassPayload: '{"ticketToken":"token"}',
      handicap: 'N/A',
      id: registrationId,
      name: 'Reverse Entonov',
      paymentStatus: 'paid',
      phone: 'N/A',
      shirtSize: 'N/A',
      slotLabel: 'Player 1'
    },
    subscribeToCheckIn: false
  })
  const html = renderToStaticMarkup(
    createElement(
      ConvexProvider,
      {
        client:
          {} as ComponentProps<typeof ConvexProvider>['client']
      },
      ticket
    )
  )
  const ticketNumberClasses = getClassesForText(
    html,
    '1234567890'
  )
  const emailClasses = getClassesForText(
    html,
    'player.with.a.long.address@example.com'
  )
  const nameClasses = getClassesForText(html, 'Reverse Entonov')

  assert.equal(ticketNumberClasses.has('leading-5'), false)
  assert.equal(ticketNumberClasses.has('whitespace-nowrap'), true)
  assert.equal(emailClasses.has('wrap-break-word'), true)
  assert.equal(nameClasses.has('truncate'), false)
  assert.doesNotMatch(
    html,
    /grid grid-cols-1 gap-3 overflow-hidden/
  )
})
