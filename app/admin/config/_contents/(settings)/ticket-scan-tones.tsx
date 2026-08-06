'use client'

import { api } from '@/convex/_generated/api'
import { Icon } from '@/lib/icons'
import {
  normalizeScanTicketTonesConfig,
  SCAN_TICKET_KEYS,
  serializeScanTicketTonesConfig,
  type ScanTicketToneKey,
  type ToneSetConfig
} from '@/lib/tones'
import { useQuery } from 'convex/react'
import type { User } from 'firebase/auth'
import { saveScanTicketTonesConfig } from '../../actions'
import { TonesCategory } from './tones-category'
import { type ToneEditorEvent } from './tones-editor'

const SCAN_TICKET_LABELS: Record<ScanTicketToneKey, string> = {
  good: 'Valid Ticket',
  invalid: 'Invalid Ticket',
  used: 'Ticket Used'
}

const SCAN_TICKET_EVENTS: readonly ToneEditorEvent<ScanTicketToneKey>[] = SCAN_TICKET_KEYS.map((key) => ({
  key,
  label: SCAN_TICKET_LABELS[key]
}))

export const TicketScanTones = ({ user }: { user: User | null }) => {
  const tonesSetting = useQuery(api.admin.q.getScanTicketTonesConfig)

  if (tonesSetting === undefined) {
    return (
      <div className='flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground' role='status'>
        <Icon name='spinner-ring' className='size-4' />
        <span>Loading ticket scan tones</span>
      </div>
    )
  }

  const config = normalizeScanTicketTonesConfig(tonesSetting)
  const configKey = JSON.stringify(serializeScanTicketTonesConfig(config))

  const handleSave = async (nextConfig: ToneSetConfig<ScanTicketToneKey>) => {
    if (!user) {
      throw new Error('Your admin session is still loading. Try again in a moment.')
    }

    const firebaseIdToken = await user.getIdToken(true)
    await saveScanTicketTonesConfig(nextConfig, firebaseIdToken)
  }

  return (
    <TonesCategory
      key={configKey}
      id='ticket-scan-tones'
      title='Ticket Scan Tones'
      description='Configure the sound used for each QR ticket scan result.'
      events={SCAN_TICKET_EVENTS}
      config={config}
      onSaveAction={handleSave}
      saveDisabled={!user}
      saveSuccessMessage='Ticket scan tones saved'
      saveErrorMessage='Failed to save ticket scan tones'
    />
  )
}
