import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyTicketDeliveryVariables,
  parseTicketDeliveryTemplateProps,
  renderTicketDeliveryEmail,
  TICKET_DELIVERY_SAMPLE_PROPS
} from '../lib/resend/templates/ticket-delivery'

test('applies the supported ticket delivery placeholders', () => {
  assert.equal(
    applyTicketDeliveryVariables(
      '{{playerName}} · {{eventTitle}} · {{reference}} · {{ticketCount}} ticket',
      TICKET_DELIVERY_SAMPLE_PROPS
    ),
    'Alex Reyes · Foreplay Invitational · FP26 · 1 ticket'
  )
})

test('keeps safe sample values when admin preview props are invalid', () => {
  assert.deepEqual(parseTicketDeliveryTemplateProps('{invalid-json', 'Jamie Cruz'), {
    ...TICKET_DELIVERY_SAMPLE_PROPS,
    playerName: 'Jamie Cruz'
  })
})

test('renders editable ticket delivery copy into the branded email', async () => {
  const rendered = await renderTicketDeliveryEmail({
    bodyTemplate: 'Hello {{playerName}}. Bring ticket {{reference}} to {{eventTitle}}.',
    eventTitle: 'Manila Open',
    playerName: 'Jamie & Cruz',
    reference: 'ABCD',
    subjectTemplate: '{{eventTitle}} ticket for {{playerName}}',
    ticketCount: 1
  })

  assert.equal(rendered.subject, 'Manila Open ticket for Jamie & Cruz')
  assert.equal(rendered.message, 'Hello Jamie & Cruz. Bring ticket ABCD to Manila Open.')
  assert.match(rendered.html, /Foreplay gate pass/)
  assert.match(rendered.html, /Jamie &amp; Cruz/)
  assert.match(rendered.html, /ticket image/)
})
