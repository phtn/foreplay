import { v } from 'convex/values'
const notes = v.union(
  v.literal('C4'),
  v.literal('C#4'),
  v.literal('D4'),
  v.literal('D#4'),
  v.literal('E4'),
  v.literal('F4'),
  v.literal('F#4'),
  v.literal('G4'),
  v.literal('G#4'),
  v.literal('A4'),
  v.literal('A#4'),
  v.literal('B4'),
  v.literal('C5'),
  v.literal('C#5'),
  v.literal('D5'),
  v.literal('D#5'),
  v.literal('E5'),
  v.literal('F5'),
  v.literal('F#5'),
  v.literal('G5'),
  v.literal('G#5'),
  v.literal('A5'),
  v.literal('A#5'),
  v.literal('B5')
)

const waveform = v.union(v.literal('sine'), v.literal('square'), v.literal('triangle'), v.literal('sawtooth'))
const synth = v.union(v.literal('basic'), v.literal('glass'))
export const toneSchema = v.object({
  event: v.string(),
  title: v.optional(v.string()),
  label: v.optional(v.string()),
  enabled: v.boolean(),
  notes: v.optional(notes),
  synth_type: v.optional(synth),
  waveform: v.optional(waveform),
  note_ms: v.number(),
  gap_ms: v.number(),
  vol_db: v.number(),
  updated_at: v.number()
})

export type ToneSchema = typeof toneSchema.type
