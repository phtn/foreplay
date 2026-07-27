// @ts-expect-error The project runs Bun tests but does not currently include Bun's ambient TypeScript declarations.
import { describe, expect, mock, test } from 'bun:test'

import type { AdminAlertEventConfig } from './index'

const playbackEvents: string[] = []

let markReverbConstructed: (() => void) | undefined
let resolveReverbReady: (() => void) | undefined

const reverbConstructed = new Promise<void>((resolve) => {
  markReverbConstructed = resolve
})

class FakeFMSynth {
  volume = { value: 0 }

  connect() {}

  dispose() {}

  triggerAttackRelease() {
    playbackEvents.push('trigger')
  }
}

class FakeReverb {
  ready = new Promise<void>((resolve) => {
    resolveReverbReady = () => {
      playbackEvents.push('ready')
      resolve()
    }
  })

  constructor() {
    markReverbConstructed?.()
  }

  dispose() {}

  toDestination() {
    return this
  }
}

mock.module('tone', () => ({
  FMSynth: FakeFMSynth,
  Reverb: FakeReverb,
  start: async () => {}
}))

describe('playAdminAlert', () => {
  test('waits for the glass reverb to be ready before triggering its note', async () => {
    const config: AdminAlertEventConfig = {
      enabled: true,
      synthType: 'glass',
      waveform: 'sine',
      notes: ['G6'],
      noteDurationMs: 250,
      gapMs: 0,
      volumeDb: -14
    }

    const { playAdminAlert } = await import('./index')
    const playback = playAdminAlert(config)

    await reverbConstructed
    expect(playbackEvents).toEqual([])

    resolveReverbReady?.()
    await playback

    expect(playbackEvents).toEqual(['ready', 'trigger'])
  })
})

describe('normalizeAdminAlertsConfig', () => {
  test('does not share mutable note arrays between normalized configs', async () => {
    const { normalizeAdminAlertsConfig } = await import('./index')
    const first = normalizeAdminAlertsConfig(undefined)

    first.orders.notes.push('A6')

    const second = normalizeAdminAlertsConfig(undefined)

    expect(second.orders.notes).toEqual(['C5', 'E5', 'G5'])
  })
})
