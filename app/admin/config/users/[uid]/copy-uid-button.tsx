'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { useEffect, useRef, useState } from 'react'

export function CopyUidButton({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current)
      }
    }
  }, [])

  async function copyUid() {
    try {
      await navigator.clipboard.writeText(uid)
      setCopied(true)

      if (resetTimer.current) {
        clearTimeout(resetTimer.current)
      }

      resetTimer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={copyUid}
      aria-label={copied ? 'User ID copied' : 'Copy user ID'}
      className='h-8 gap-2 rounded-full border-foreground/10 bg-background/70 px-3 font-ios text-[10px] uppercase tracking-widest shadow-sm backdrop-blur hover:bg-background'>
      <span aria-live='polite'>{uid}</span>
      <Icon name={copied ? 'check' : 'copy'} className='size-3.5' />
    </Button>
  )
}
