'use client'

import { api } from '@/convex/_generated/api'
import { Icon } from '@/lib/icons'
import {
  normalizeProductOrderTonesConfig,
  PRODUCT_ORDER_TONE_KEYS,
  serializeProductOrderTonesConfig,
  type ProductOrderToneKey,
  type ToneSetConfig
} from '@/lib/tones'
import { useQuery } from 'convex/react'
import type { User } from 'firebase/auth'
import { saveProductOrderTonesConfig } from '../../actions'
import { TonesEditor, type ToneEditorEvent } from './tones-editor'

const PRODUCT_ORDER_LABELS: Record<ProductOrderToneKey, string> = {
  entry: 'New Entry',
  payments: 'Payment Received',
  signups: 'User Sign-ups'
}

const PRODUCT_ORDER_EVENTS: readonly ToneEditorEvent<ProductOrderToneKey>[] = PRODUCT_ORDER_TONE_KEYS.map((key) => ({
  key,
  label: PRODUCT_ORDER_LABELS[key]
}))

export const ProductOrderTones = ({ user }: { user: User | null }) => {
  const tonesSetting = useQuery(api.admin.q.getProductOrderTonesConfig)

  if (tonesSetting === undefined) {
    return (
      <div className='flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground' role='status'>
        <Icon name='spinner-ring' className='size-4' />
        <span>Loading product order tones</span>
      </div>
    )
  }

  const config = normalizeProductOrderTonesConfig(tonesSetting)
  const configKey = JSON.stringify(serializeProductOrderTonesConfig(config))

  const handleSave = async (nextConfig: ToneSetConfig<ProductOrderToneKey>) => {
    if (!user) {
      throw new Error('Your admin session is still loading. Try again in a moment.')
    }

    const firebaseIdToken = await user.getIdToken(true)
    await saveProductOrderTonesConfig(nextConfig, firebaseIdToken)
  }

  return (
    <TonesEditor
      key={configKey}
      id='product-order-tones'
      title='Product Order Tones'
      description='Configure the sound used for each product order event.'
      events={PRODUCT_ORDER_EVENTS}
      config={config}
      onSaveAction={handleSave}
      saveDisabled={!user}
      saveSuccessMessage='Product order tones saved'
      saveErrorMessage='Failed to save product order tones'
    />
  )
}
