'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { onError, onSuccess } from '@/ctx/toast'
import { Icon } from '@/lib/icons'
import {
  normalizeToneSetConfig,
  notesToInputValue,
  parseNotesInput,
  playToneSetEvent,
  serializeToneSetConfig,
  TONE_OSCILLATORS,
  TONE_SYNTH_TYPES,
  type ToneEventConfig,
  type ToneOscillator,
  type ToneSetConfig,
  type ToneSynthType
} from '@/lib/tones'
import { PointerEvent, useCallback, useState, useTransition } from 'react'

export type ToneEditorEvent<Key extends string> = {
  key: Key
  label: string
}

type TonesEditorProps<Key extends string> = {
  config: ToneSetConfig<Key>
  description: string
  events: readonly ToneEditorEvent<Key>[]
  id: string
  onSaveAction: (config: ToneSetConfig<Key>) => Promise<void>
  saveDisabled?: boolean
  saveErrorMessage?: string
  saveSuccessMessage?: string
  title: string
}

type ToneDraft = {
  enabled: boolean
  gapMs: string
  noteDurationMs: string
  notesInput: string
  synthType: ToneSynthType
  volumeDb: string
  waveform: ToneOscillator
}

type ToneDraftMap<Key extends string> = Record<Key, ToneDraft>

const mapEvents = <Key extends string, Value>(
  events: readonly ToneEditorEvent<Key>[],
  getValue: (key: Key) => Value
): Record<Key, Value> => Object.fromEntries(events.map(({ key }) => [key, getValue(key)])) as Record<Key, Value>

const buildEventDraft = (config: ToneEventConfig): ToneDraft => ({
  enabled: config.enabled,
  gapMs: String(config.gapMs),
  noteDurationMs: String(config.noteDurationMs),
  notesInput: notesToInputValue(config.notes),
  synthType: config.synthType,
  volumeDb: String(config.volumeDb),
  waveform: config.waveform
})

const buildDrafts = <Key extends string>(
  events: readonly ToneEditorEvent<Key>[],
  config: ToneSetConfig<Key>
): ToneDraftMap<Key> => mapEvents(events, (key) => buildEventDraft(config.tones[key]))

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const buildEventConfig = (draft: ToneDraft, fallback: ToneEventConfig): ToneEventConfig => ({
  enabled: draft.enabled,
  synthType: draft.synthType,
  waveform: draft.waveform,
  notes: parseNotesInput(draft.notesInput),
  noteDurationMs: parseNumberInput(draft.noteDurationMs, fallback.noteDurationMs),
  gapMs: parseNumberInput(draft.gapMs, fallback.gapMs),
  volumeDb: parseNumberInput(draft.volumeDb, fallback.volumeDb)
})

const buildConfig = <Key extends string>(
  events: readonly ToneEditorEvent<Key>[],
  config: ToneSetConfig<Key>,
  enabled: boolean,
  drafts: ToneDraftMap<Key>
): ToneSetConfig<Key> => {
  const keys = events.map(({ key }) => key)

  return normalizeToneSetConfig(
    {
      enabled,
      tones: mapEvents(events, (key) => buildEventConfig(drafts[key], config.tones[key]))
    },
    keys,
    config
  )
}

const configsMatch = <Key extends string>(
  events: readonly ToneEditorEvent<Key>[],
  left: ToneSetConfig<Key>,
  right: ToneSetConfig<Key>
) => {
  const keys = events.map(({ key }) => key)
  return JSON.stringify(serializeToneSetConfig(left, keys)) === JSON.stringify(serializeToneSetConfig(right, keys))
}

const isToneSynthType = (value: unknown): value is ToneSynthType =>
  typeof value === 'string' && TONE_SYNTH_TYPES.some((synthType) => synthType === value)

const isToneOscillator = (value: unknown): value is ToneOscillator =>
  typeof value === 'string' && TONE_OSCILLATORS.some((oscillator) => oscillator === value)

export function TonesEditorForm<Key extends string>({
  config,
  description,
  events,
  id,
  onSaveAction,
  saveDisabled = false,
  saveErrorMessage = 'Failed to save tone settings',
  saveSuccessMessage = 'Tone settings saved',
  title
}: TonesEditorProps<Key>) {
  const [isEnabled, setIsEnabled] = useState(config.enabled)
  const [drafts, setDrafts] = useState<ToneDraftMap<Key>>(() => buildDrafts(events, config))
  const [testingKey, setTestingKey] = useState<Key | null>(null)
  const [isSaving, startSaving] = useTransition()

  const normalizedDraftConfig = buildConfig(events, config, isEnabled, drafts)
  const isDirty = !configsMatch(events, normalizedDraftConfig, config)

  function setDraftField<Field extends keyof ToneDraft>(key: Key, field: Field, value: ToneDraft[Field]) {
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value
      }
    }))
  }

  const handleReset = () => {
    setIsEnabled(config.enabled)
    setDrafts(buildDrafts(events, config))
  }

  const handleSave = () => {
    if (saveDisabled) return

    startSaving(async () => {
      try {
        await onSaveAction(normalizedDraftConfig)
        onSuccess(saveSuccessMessage)
      } catch (error) {
        onError(error instanceof Error ? error.message : saveErrorMessage)
      }
    })
  }

  const handleTest = async (key: Key) => {
    if (testingKey !== null) return

    try {
      setTestingKey(key)
      await playToneSetEvent(normalizedDraftConfig, key)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to start audio. Interact with the page and try again.')
    } finally {
      setTestingKey(null)
    }
  }

  const onPointerDown = useCallback((e: PointerEvent<HTMLInputElement>) => {
    if (!clickedOnThumb(e)) {
      void e.preventDefault()
    }
  }, [])

  return (
    <section className='flex min-w-0 w-full max-w-full flex-col gap-4' aria-labelledby={`${id}-title`}>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center space-x-4'>
            <h2 id={`${id}-title`} className='font-okx text-lg font-semibold'>
              {title}
            </h2>
            <Toggle
              id={`${id}-enabled`}
              title='Enable audio'
              label={isEnabled ? 'ON' : 'OFF'}
              checked={isEnabled}
              onChange={setIsEnabled}
            />
          </div>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>

        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={handleReset} disabled={!isDirty || isSaving}>
            Reset
          </Button>
          <Button
            type='button'
            onClick={handleSave}
            disabled={!isDirty || isSaving || saveDisabled}
            className='bg-foreground hover:bg-foreground/80 dark:'>
            <span>{isSaving ? 'Saving' : 'Save Changes'}</span>
            {isSaving && <Icon name='spinner-ring' className='size-4' />}
          </Button>
        </div>
      </div>

      <div className='grid gap-4 xl:grid-cols-3'>
        {events.map(({ key, label }) => {
          const draft = drafts[key]
          const notesId = `${id}-${key}-notes`
          const synthId = `${id}-${key}-synth`
          const waveformId = `${id}-${key}-waveform`
          const durationId = `${id}-${key}-duration`
          const gapId = `${id}-${key}-gap`
          const volumeId = `${id}-${key}-volume`

          const encoders = () => [
            {
              id: durationId,
              label: 'NOTE',
              sublabel: 'ms',
              idField: 'noteDurationMs',
              value: draft.noteDurationMs,
              min: 40,
              step: 2,
              max: 1000
            },
            {
              id: gapId,
              label: 'GAP',
              sublabel: 'ms',
              idField: 'gapMs',
              value: draft.gapMs,
              min: 0,
              step: 5,
              max: 600
            },
            { id: volumeId, label: 'VOL', sublabel: 'dB', idField: 'volumeDb', value: draft.volumeDb, min: -36, max: 0 }
          ]
          return (
            <Card key={key} size='sm' className='ring-border bg-card rounded-md p-0'>
              <CardContent className='flex flex-col gap-4 p-0'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <h3 className='text-base font-semibold'>{label}</h3>
                    <Toggle
                      id={`${id}-${key}-enabled`}
                      title={`${label} tone`}
                      checked={draft.enabled}
                      onChange={(value) => setDraftField(key, 'enabled', value)}
                    />
                  </div>
                  <Icon name='save' className='size-5 opacity-80' />
                </div>

                <div className='grid gap-2'>
                  <Label className='text-xs' htmlFor={notesId}>
                    notes
                  </Label>
                  <Input
                    id={notesId}
                    value={draft.notesInput}
                    onChange={(event) => setDraftField(key, 'notesInput', event.currentTarget.value)}
                    placeholder='C5, E5, G5'
                    spellCheck={false}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label className='text-xs' htmlFor={synthId}>
                    synth type
                  </Label>
                  <Select
                    value={draft.synthType}
                    onValueChange={(next) => {
                      if (isToneSynthType(next)) {
                        setDraftField(key, 'synthType', next)
                      }
                    }}>
                    <SelectTrigger id={synthId} className='w-full rounded-sm border-0'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='rounded-sm ring-zinc-400 dark:ring-zinc-600 shadow-sm' align='end'>
                      {TONE_SYNTH_TYPES.map((synthType) => (
                        <SelectItem key={synthType} value={synthType} className='rounded-xs font-okx'>
                          {synthType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {draft.synthType === 'basic' ? (
                  <div className='grid gap-2'>
                    <Label className='text-xs' htmlFor={waveformId}>
                      waveform
                    </Label>
                    <Select
                      value={draft.waveform}
                      onValueChange={(next) => {
                        if (isToneOscillator(next)) {
                          setDraftField(key, 'waveform', next)
                        }
                      }}>
                      <SelectTrigger id={waveformId} className='w-full rounded-sm border-0'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='rounded-sm ring-zinc-400 dark:ring-zinc-600 shadow-sm' align='start'>
                        {TONE_OSCILLATORS.map((waveform) => (
                          <SelectItem key={waveform} value={waveform} className='rounded-xs'>
                            {waveform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3'>
                  {encoders().map((encoder) => (
                    <div key={encoder.id} className='grid gap-0 relative place-items-center'>
                      <Label className='text-xs flex justify-center' htmlFor={encoder.id}>
                        <span>{encoder.label}</span>
                        <span className='italic tracking-wider opacity-80'>{encoder.sublabel}</span>
                      </Label>
                      <Input
                        id={encoder.id}
                        type='range'
                        min={encoder.min}
                        step={encoder.step}
                        max={encoder.max}
                        value={encoder.value}
                        onPointerDown={onPointerDown}
                        className='cursor-ew-resize opacity-0 w-full'
                        onChange={(event) =>
                          setDraftField(key, encoder.idField as keyof ToneDraft, event.currentTarget.value)
                        }
                      />
                      <div
                        id={encoder.id}
                        className='pointer-events-none border absolute top-6 rounded-xs flex items-center justify-center w-24 dark:bg-zinc-700'>
                        <span>{encoder.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type='button'
                  size='default'
                  variant='secondary'
                  onClick={() => void handleTest(key)}
                  disabled={!isEnabled || !draft.enabled || testingKey !== null}
                  className='rounded-sm font-clash'>
                  <Icon name={testingKey === key ? 'spinner-ring' : 'play'} className='size-4' />
                  <span>Play</span>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

const clickedOnThumb = (
  e: React.PointerEvent<HTMLInputElement>,
  thumbRadius = 14 // px
) => {
  const input = e.currentTarget

  const min = Number(input.min || 0)
  const max = Number(input.max || 100)
  const value = input.valueAsNumber

  const rect = input.getBoundingClientRect()

  const percent = (value - min) / (max - min)
  const thumbX = rect.left + 50 + percent * (rect.width - 100)

  return Math.abs(e.clientX - thumbX) <= thumbRadius
}
