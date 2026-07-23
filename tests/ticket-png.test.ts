import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPngFilename,
  getTicketExportScale,
  hasModernColorFunction
} from '../lib/tickets/download-ticket-png'

test('creates a portable PNG filename from a player label', () => {
  assert.equal(createPngFilename('Foreplay - Player 1 - Jose Reyes'), 'foreplay-player-1-jose-reyes.png')
})

test('uses a safe fallback when a label has no portable characters', () => {
  assert.equal(createPngFilename('---', 'ticket ABC 123'), 'ticket-abc-123.png')
})

test('recognizes browser color functions that html2canvas cannot parse reliably', () => {
  assert.equal(hasModernColorFunction('oklch(50% 0.2 120)'), true)
  assert.equal(
    hasModernColorFunction('color(display-p3 1 0 0)'),
    true
  )
  assert.equal(hasModernColorFunction('rgb(255 0 0)'), false)
})

test('uses a high-resolution scale within browser dimension and area limits', () => {
  assert.equal(getTicketExportScale(800, 600), 4)

  const scale = getTicketExportScale(2_000, 40_000)
  assert.ok(scale > 0)
  assert.ok(2_000 * scale <= 16_000)
  assert.ok(40_000 * scale <= 16_000)
  assert.ok(2_000 * 40_000 * scale * scale <= 64_000_000)

  const hugeScale = getTicketExportScale(
    1_000_000,
    1_000_000
  )
  assert.ok(1_000_000 * hugeScale <= 16_000)
  assert.ok(
    1_000_000 * 1_000_000 * hugeScale * hugeScale <=
      64_000_000
  )
})
