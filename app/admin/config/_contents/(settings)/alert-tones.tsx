'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { api } from '@/convex/_generated/api'
import { onError, onSuccess } from '@/ctx/toast'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import {
  ADMIN_ALERT_EVENT_KEYS,
  type AdminAlertEventConfig,
  type AdminAlertEventKey,
  type AdminAlertsConfig,
  ALERT_SYNTH_TYPES,
  normalizeAdminAlertsConfig,
  notesToInputValue,
  parseNotesInput,
  playAdminAlert,
  serializeAdminAlertsConfig,
  TONE_OSCILLATORS
} from '@/lib/tones'
import { useQuery } from 'convex/react'
import { useState, useTransition } from 'react'
import { saveAdminAlertsConfig } from '../../actions'

const ALERT_LABELS: Record<AdminAlertEventKey, string> = {
  orders: 'New Orders',
  payments: 'Payments',
  signups: 'User Sign-ups',
  messages: 'Customer Chat'
}

type AlertDraft = {
  enabled: boolean
  gapMs: string
  noteDurationMs: string
  notesInput: string
  synthType: AdminAlertEventConfig['synthType']
  volumeDb: string
  waveform: AdminAlertEventConfig['waveform']
}

type AlertDraftMap = Record<AdminAlertEventKey, AlertDraft>

const buildEventDraft = (config: AdminAlertEventConfig): AlertDraft => ({
  enabled: config.enabled,
  gapMs: String(config.gapMs),
  noteDurationMs: String(config.noteDurationMs),
  notesInput: notesToInputValue(config.notes),
  synthType: config.synthType,
  volumeDb: String(config.volumeDb),
  waveform: config.waveform
})

const buildDrafts = (config: AdminAlertsConfig): AlertDraftMap => ({
  orders: buildEventDraft(config.orders),
  payments: buildEventDraft(config.payments),
  signups: buildEventDraft(config.signups),
  messages: buildEventDraft(config.messages)
})

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const buildEventConfig = (
  draft: AlertDraft,
  fallback: AdminAlertEventConfig
): AdminAlertEventConfig => ({
  enabled: draft.enabled,
  synthType: draft.synthType,
  waveform: draft.waveform,
  notes: parseNotesInput(draft.notesInput),
  noteDurationMs: parseNumberInput(draft.noteDurationMs, fallback.noteDurationMs),
  gapMs: parseNumberInput(draft.gapMs, fallback.gapMs),
  volumeDb: parseNumberInput(draft.volumeDb, fallback.volumeDb)
})

const buildConfig = (
  config: AdminAlertsConfig,
  enabled: boolean,
  drafts: AlertDraftMap
): AdminAlertsConfig =>
  normalizeAdminAlertsConfig({
    enabled,
    orders: buildEventConfig(drafts.orders, config.orders),
    payments: buildEventConfig(drafts.payments, config.payments),
    signups: buildEventConfig(drafts.signups, config.signups),
    messages: buildEventConfig(drafts.messages, config.messages)
  })

const configsMatch = (left: AdminAlertsConfig, right: AdminAlertsConfig) =>
  JSON.stringify(serializeAdminAlertsConfig(left)) ===
  JSON.stringify(serializeAdminAlertsConfig(right))

export const AlertTones = () => {
  const alertsSetting = useQuery(api.admin.q.getAdminAlertsConfig)

  if (alertsSetting === undefined) {
    return (
      <div className='flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground' role='status'>
        <Icon name='spinner-ring' className='size-4' />
        <span>Loading alert tones</span>
      </div>
    )
  }

  const config = normalizeAdminAlertsConfig(alertsSetting)
  const configKey = JSON.stringify(serializeAdminAlertsConfig(config))

  return <AlertTonesEditor key={configKey} config={config} />
}

const AlertTonesEditor = ({ config }: { config: AdminAlertsConfig }) => {
  const { user } = useFirebaseUser()
  const [isEnabled, setIsEnabled] = useState(config.enabled)
  const [drafts, setDrafts] = useState<AlertDraftMap>(() => buildDrafts(config))
  const [testingKey, setTestingKey] = useState<AdminAlertEventKey | null>(null)
  const [isSaving, startSaving] = useTransition()

  const normalizedDraftConfig = buildConfig(config, isEnabled, drafts)
  const isDirty = !configsMatch(normalizedDraftConfig, config)

  function setDraftField<Field extends keyof AlertDraft>(
    key: AdminAlertEventKey,
    field: Field,
    value: AlertDraft[Field]
  ) {
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
    setDrafts(buildDrafts(config))
  }

  const handleSave = () => {
    if (!user) {
      onError('Your admin session is still loading. Try again in a moment.')
      return
    }

    startSaving(async () => {
      try {
        const firebaseIdToken = await user.getIdToken(true)
        await saveAdminAlertsConfig(normalizedDraftConfig, firebaseIdToken)
        onSuccess('Alert settings saved')
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Failed to save alerts')
      }
    })
  }

  const handleTest = async (key: AdminAlertEventKey) => {
    if (testingKey !== null) return

    try {
      setTestingKey(key)
      await playAdminAlert(normalizedDraftConfig[key])
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to start audio. Interact with the page and try again.')
    } finally {
      setTestingKey(null)
    }
  }

  return (
    <div className='flex min-w-0 w-full max-w-full flex-col gap-4 pb-24'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-3'>
          <div>
            <h2 className='font-okx text-lg font-semibold'>Alert tones</h2>
            <p className='text-sm text-muted-foreground'>Configure the sound used for each admin event.</p>
          </div>
          <Toggle
            id='admin-alerts-enabled'
            title='Enable audio'
            label='Audio'
            checked={isEnabled}
            onChange={setIsEnabled}
          />
        </div>

        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={handleReset} disabled={!isDirty || isSaving}>
            Reset
          </Button>
          <Button type='button' onClick={handleSave} disabled={!isDirty || isSaving || !user}>
            <Icon name={isSaving ? 'spinner-ring' : 'check'} className='size-4' />
            <span>{isSaving ? 'Saving' : 'Save changes'}</span>
          </Button>
        </div>
      </div>

      <div className='grid gap-4 xl:grid-cols-4'>
        {ADMIN_ALERT_EVENT_KEYS.map((key) => {
          const draft = drafts[key]
          const notesId = `${key}-alert-notes`
          const synthId = `${key}-alert-synth`
          const waveformId = `${key}-alert-waveform`
          const durationId = `${key}-alert-duration`
          const gapId = `${key}-alert-gap`
          const volumeId = `${key}-alert-volume`

          return (
            <Card key={key} size='sm' className='border border-border/70 bg-card'>
              <CardContent className='flex flex-col gap-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h3 className='text-base font-semibold'>{ALERT_LABELS[key]}</h3>
                  <Toggle
                    id={`${key}-alert-enabled`}
                    title={`${ALERT_LABELS[key]} alert`}
                    checked={draft.enabled}
                    onChange={(value) => setDraftField(key, 'enabled', value)}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor={notesId}>Notes</Label>
                  <Input
                    id={notesId}
                    value={draft.notesInput}
                    onChange={(event) => setDraftField(key, 'notesInput', event.currentTarget.value)}
                    placeholder='C5, E5, G5'
                    spellCheck={false}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor={synthId}>Synth</Label>
                  <Select
                    value={draft.synthType}
                    onValueChange={(next) => {
                      if (typeof next === 'string') {
                        setDraftField(key, 'synthType', next)
                      }
                    }}>
                    <SelectTrigger id={synthId} className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_SYNTH_TYPES.map((synthType) => (
                        <SelectItem key={synthType} value={synthType}>
                          {synthType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {draft.synthType === 'basic' ? (
                  <div className='grid gap-2'>
                    <Label htmlFor={waveformId}>Waveform</Label>
                    <Select
                      value={draft.waveform}
                      onValueChange={(next) => {
                        if (typeof next === 'string') {
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
                    <Label htmlFor={durationId}>Note ms</Label>
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
                    <Label htmlFor={gapId}>Gap ms</Label>
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
                    <Label htmlFor={volumeId}>Volume dB</Label>
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
    </div>
  )
}
