// @ts-expect-error The project runs Bun tests but does not currently include Bun's ambient TypeScript declarations.
import { describe, expect, mock, test } from 'bun:test'

import type { ToneEventConfig } from './index'

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

describe('playTone', () => {
  test('waits for the glass reverb to be ready before triggering its note', async () => {
    const config: ToneEventConfig = {
      enabled: true,
      synthType: 'glass',
      waveform: 'sine',
      notes: ['G6'],
      noteDurationMs: 250,
      gapMs: 0,
      volumeDb: -14
    }

    const { playTone } = await import('./index')
    const playback = playTone(config)

    await reverbConstructed
    expect(playbackEvents).toEqual([])

    resolveReverbReady?.()
    await playback

    expect(playbackEvents).toEqual(['ready', 'trigger'])
  })
})

describe('tone set normalization', () => {
  test('does not share mutable note arrays between normalized configs', async () => {
    const { normalizeProductOrderTonesConfig } = await import('./index')
    const first = normalizeProductOrderTonesConfig(undefined)

    first.tones.entry.notes.push('A6')

    const second = normalizeProductOrderTonesConfig(undefined)

    expect(second.tones.entry.notes).toEqual(['C5', 'E5', 'G5'])
  })

  test('reads the legacy orders tone as the product entry tone', async () => {
    const { normalizeProductOrderTonesConfig } = await import('./index')
    const config = normalizeProductOrderTonesConfig({
      enabled: true,
      orders: {
        enabled: true,
        synthType: 'glass',
        waveform: 'triangle',
        notes: ['D5'],
        noteDurationMs: 200,
        gapMs: 20,
        volumeDb: -6
      }
    })

    expect(config.enabled).toBe(true)
    expect(config.tones.entry.notes).toEqual(['D5'])
    expect(config.tones.entry.synthType).toBe('glass')
  })

  test('normalizes arbitrary keyed tone sets', async () => {
    const { normalizeToneSetConfig } = await import('./index')
    const fallback = {
      enabled: false,
      tones: {
        opened: {
          enabled: true,
          synthType: 'basic' as const,
          waveform: 'sine' as const,
          notes: ['C4'],
          noteDurationMs: 100,
          gapMs: 20,
          volumeDb: -12
        },
        closed: {
          enabled: true,
          synthType: 'basic' as const,
          waveform: 'square' as const,
          notes: ['C3'],
          noteDurationMs: 100,
          gapMs: 20,
          volumeDb: -12
        }
      }
    }
    const config = normalizeToneSetConfig(
      {
        enabled: true,
        tones: {
          opened: { notes: ['E4'], volumeDb: -4 }
        }
      },
      ['opened', 'closed'] as const,
      fallback
    )

    expect(config.enabled).toBe(true)
    expect(config.tones.opened.notes).toEqual(['E4'])
    expect(config.tones.opened.volumeDb).toBe(-4)
    expect(config.tones.closed.notes).toEqual(['C3'])
  })
})
