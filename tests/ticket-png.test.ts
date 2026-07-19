import assert from 'node:assert/strict'
import test from 'node:test'
import { createPngFilename } from '../lib/tickets/download-ticket-png'

test('creates a portable PNG filename from a player label', () => {
  assert.equal(createPngFilename('Foreplay - Player 1 - Jose Reyes'), 'foreplay-player-1-jose-reyes.png')
})

test('uses a safe fallback when a label has no portable characters', () => {
  assert.equal(createPngFilename('---', 'ticket ABC 123'), 'ticket-abc-123.png')
})
