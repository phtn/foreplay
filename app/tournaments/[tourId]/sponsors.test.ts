import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  createSponsorSlides,
  Sponsors,
  type TournamentSponsor
} from './sponsors'

const createSponsor = (
  value: string,
  overrides: Partial<TournamentSponsor> = {}
): TournamentSponsor => ({
  value,
  ...overrides
})

test('creates active sponsor slides with three sponsors per cycle', () => {
  const slides = createSponsorSlides([
    createSponsor('Sponsor A'),
    createSponsor('Hidden sponsor', { is_active: false }),
    createSponsor('Sponsor B'),
    createSponsor('Sponsor C'),
    createSponsor('Sponsor D')
  ])

  assert.deepEqual(
    slides.map((slide) => slide.map((sponsor) => sponsor.value)),
    [
      ['Sponsor A', 'Sponsor B', 'Sponsor C'],
      ['Sponsor D', 'Sponsor A', 'Sponsor B']
    ]
  )
})

test('does not repeat sponsors when three or fewer are active', () => {
  const slides = createSponsorSlides([
    createSponsor('Sponsor A'),
    createSponsor('Sponsor B')
  ])

  assert.deepEqual(
    slides.map((slide) => slide.map((sponsor) => sponsor.value)),
    [['Sponsor A', 'Sponsor B']]
  )
})

test('renders the first sponsor group with safe partner links', () => {
  const html = renderToStaticMarkup(
    createElement(Sponsors, {
      sponsors: [
        createSponsor('Sponsor A', {
          label: 'Title sponsor',
          url: 'https://example.com'
        }),
        createSponsor('Sponsor B'),
        createSponsor('Sponsor C'),
        createSponsor('Sponsor D'),
        createSponsor('Hidden sponsor', { is_active: false })
      ]
    })
  )

  assert.match(html, /id="sponsors"/)
  assert.match(html, />Tournament partners</)
  assert.match(html, />Sponsor A</)
  assert.match(html, />Sponsor B</)
  assert.match(html, />Sponsor C</)
  assert.match(html, /href="https:\/\/example\.com\/"/)
  assert.doesNotMatch(html, />Sponsor D</)
  assert.doesNotMatch(html, />Hidden sponsor</)
})
