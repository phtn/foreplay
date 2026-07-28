import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getSupportContacts, SupportDetails } from './support-details'

test('normalizes primary and secondary support contacts', () => {
  assert.deepEqual(
    getSupportContacts({
      name: ' Primary Contact ',
      email: 'primary@example.com',
      secondaryName: ' Secondary Contact ',
      secondaryPhone: ' +63 917 222 2222 '
    }),
    [
      {
        id: 'primary',
        label: 'Primary support',
        name: 'Primary Contact',
        title: undefined,
        email: 'primary@example.com',
        phone: undefined
      },
      {
        id: 'secondary',
        label: 'Secondary support',
        name: 'Secondary Contact',
        title: undefined,
        email: undefined,
        phone: '+63 917 222 2222'
      }
    ]
  )
})

test('renders direct email and phone actions for both contacts', () => {
  const html = renderToStaticMarkup(
    createElement(SupportDetails, {
      support: {
        name: 'Primary Contact',
        title: 'Registration Support',
        email: 'primary@example.com',
        secondaryName: 'Secondary Contact',
        secondaryPhone: '+63 917 222 2222'
      }
    })
  )

  assert.match(html, /id="tournament-support"/)
  assert.match(html, />Questions &amp; inquiries</)
  assert.match(html, />Primary Contact</)
  assert.match(html, />Secondary Contact</)
  assert.match(html, /href="mailto:primary@example\.com"/)
  assert.match(html, /href="tel:\+639172222222"/)
})

test('renders nothing when support details are empty', () => {
  assert.equal(
    renderToStaticMarkup(
      createElement(SupportDetails, {
        support: {
          name: ' ',
          secondaryEmail: ''
        }
      })
    ),
    ''
  )
})
