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
import { useState, useTransition } from 'react'

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

export function TonesEditor<Key extends string>({
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
              label={isEnabled ? 'disable' : 'enable'}
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
          <Button type='button' onClick={handleSave} disabled={!isDirty || isSaving || saveDisabled}>
            <Icon name={isSaving ? 'spinner-ring' : 'check'} className='size-4' />
            <span>{isSaving ? 'Saving' : 'Save changes'}</span>
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

          return (
            <Card key={key} size='sm' className='border border-border/70 bg-card rounded-md p-0'>
              <CardContent className='flex flex-col gap-4 p-0'>
                <div className='flex items-center justify-between gap-3'>
                  <h3 className='text-base font-semibold'>{label}</h3>
                  <Toggle
                    id={`${id}-${key}-enabled`}
                    title={`${label} tone`}
                    checked={draft.enabled}
                    onChange={(value) => setDraftField(key, 'enabled', value)}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label className='text-xs' htmlFor={notesId}>
                    Notes
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
                    Synth
                  </Label>
                  <Select
                    value={draft.synthType}
                    onValueChange={(next) => {
                      if (isToneSynthType(next)) {
                        setDraftField(key, 'synthType', next)
                      }
                    }}>
                    <SelectTrigger id={synthId} className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_SYNTH_TYPES.map((synthType) => (
                        <SelectItem key={synthType} value={synthType}>
                          {synthType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {draft.synthType === 'basic' ? (
                  <div className='grid gap-2'>
                    <Label className='text-xs' htmlFor={waveformId}>
                      Waveform
                    </Label>
                    <Select
                      value={draft.waveform}
                      onValueChange={(next) => {
                        if (isToneOscillator(next)) {
                          setDraftField(key, 'waveform', next)
                        }
                      }}>
                      <SelectTrigger id={waveformId} className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OSCILLATORS.map((waveform) => (
                          <SelectItem key={waveform} value={waveform}>
                            {waveform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3'>
                  <div className='grid gap-2'>
                    <Label className='text-xs flex justify-center' htmlFor={durationId}>
                      NOTE ms
                    </Label>
                    <Input
                      id={durationId}
                      type='number'
                      min={40}
                      max={1000}
                      value={draft.noteDurationMs}
                      onChange={(event) => setDraftField(key, 'noteDurationMs', event.currentTarget.value)}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label className='text-xs flex justify-center' htmlFor={gapId}>
                      GAP ms
                    </Label>
                    <Input
                      id={gapId}
                      type='number'
                      min={0}
                      max={600}
                      value={draft.gapMs}
                      onChange={(event) => setDraftField(key, 'gapMs', event.currentTarget.value)}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label className='text-xs flex justify-center' htmlFor={volumeId}>
                      VOL dB
                    </Label>
                    <Input
                      id={volumeId}
                      type='number'
                      min={-36}
                      max={0}
                      value={draft.volumeDb}
                      onChange={(event) => setDraftField(key, 'volumeDb', event.currentTarget.value)}
                    />
                  </div>
                </div>

                <Button
                  type='button'
                  size='sm'
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
