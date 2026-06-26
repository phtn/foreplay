'use client'

import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import QrCreator from 'qr-creator'
import { useEffect, useMemo, useRef, useState } from 'react'

interface CreateQRProps {
  config: QrCreator.Config
  className?: string
}

function QRCanvas({ className, config }: CreateQRProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    container.replaceChildren()
    QrCreator.render(config, container)

    return () => {
      container.replaceChildren()
    }
  }, [config])

  return <div className={cn('overflow-hidden [&_canvas]:size-full [&_svg]:size-full', className)} ref={containerRef} />
}

export const CreateQR = ({ className, config }: CreateQRProps) => {
  const [open, setOpen] = useState(false)
  const fullscreenConfig = useMemo<QrCreator.Config>(
    () => ({
      ...config,
      background: config.background ?? '#ffffff',
      quiet: config.quiet ?? 1,
      size: Math.max(config.size ?? 0, 360)
    }),
    [config]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.documentElement.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        type='button'
        aria-label='Open gate pass QR code'
        className={cn(
          'group relative size-54 overflow-hidden rounded-lg p-2 transition-transform active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-500/30',
          className
        )}
        onClick={() => setOpen(true)}>
        <QRCanvas config={config} className='size-full' />
        <span className='absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-sm text-slate-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 bg-pink-500'>
          <Icon name='code-scanner' className='size-7 text-white' />
        </span>
      </button>

      {open ? (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Gate pass QR code'
          className='fixed inset-0 z-100 flex min-h-dvh flex-col bg-slate-950/95 p-4 text-white backdrop-blur-xl sm:p-6'>
          <div className='flex items-center justify-between gap-3'>
            <div className='space-y-1'>
              <p className='font-ios text-xs uppercase tracking-widest text-white/55'>Gate pass</p>
              <p className='font-okx text-lg font-medium'>Scan QR</p>
            </div>
            <button
              type='button'
              aria-label='Close gate pass QR code'
              className='inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/25'
              onClick={() => setOpen(false)}>
              <Icon name='close' className='size-5' />
            </button>
          </div>

          <div className='flex flex-1 items-center justify-center py-6'>
            <div className='w-full max-w-[min(88vw,430px)] rounded-3xl bg-white p-4 shadow-2xl sm:p-6'>
              <QRCanvas config={fullscreenConfig} className='aspect-square w-full rounded-2xl bg-white' />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
