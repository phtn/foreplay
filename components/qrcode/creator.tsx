'use client'

import { Icon } from '@/lib/icons'
import type { RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { cn } from '@/lib/utils'
import type { ClassName } from '@/types'
import QrCreator from 'qr-creator'
import { useEffect, useMemo, useRef, useState } from 'react'

interface CreateQRProps {
  config: QrCreator.Config
  className?: string
  disabled?: boolean
  downloading?: boolean
  onDownload?: () => void | Promise<void>
  registration?: RegistrationTicketData
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

export const CreateQR = ({
  className,
  config,
  disabled = false,
  downloading = false,
  onDownload,
  registration
}: CreateQRProps) => {
  const [open, setOpen] = useState(false)
  const wasCheckedInWhenOpenedRef = useRef(false)
  const checkedIn = registration?.checkedIn ?? false
  const checkedInAt = registration?.checkedInAt
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
    if (!open || !checkedIn || wasCheckedInWhenOpenedRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setOpen(false)
    }, 1800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [checkedIn, open])

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
        disabled={disabled}
        aria-label={
          disabled
            ? 'Gate pass QR code is inactive'
            : 'Open gate pass QR code'
        }
        className={cn(
          'group relative size-64 overflow-hidden rounded-lg p-2 transition-transform active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-500/30',
          disabled && 'cursor-not-allowed opacity-65 active:scale-100',
          className
        )}
        onClick={() => {
          if (disabled) return

          wasCheckedInWhenOpenedRef.current = checkedIn
          setOpen(true)
        }}>
        <QRCanvas config={config} className='' />
        {checkedIn ? (
          <span className='absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-500 px-2 py-1 font-ios text-[10px] uppercase tracking-widest text-white shadow-sm'>
            <Icon name='check' className='size-3.5' />
            Scanned
          </span>
        ) : null}
        <span className='absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-sm text-slate-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 bg-pink-500'>
          <Icon name='code-scanner' className='size-7 text-white' />
        </span>
      </button>

      {open ? (
        <div
          data-ticket-export-ignore
          role='dialog'
          aria-modal='true'
          aria-label='Gate pass QR code'
          className='fixed inset-0 z-100 flex flex-col bg-slate-300/50 p-4 backdrop-blur-xl sm:p-6'>
          <div className='flex items-center justify-between gap-3'>
            <div className='space-y-1'>
              <p className='font-ios text-xs uppercase tracking-widest text-foreground/55'>Scan</p>
              <p className='font-okx text-lg font-medium'>Gate Pass</p>
            </div>
            <div className='flex items-center space-x-2'>
              {onDownload ? (
                <button
                  type='button'
                  disabled={downloading}
                  aria-label='Download ticket as PNG'
                  className='inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/25 disabled:opacity-50'
                  onClick={() => {
                    void onDownload()
                  }}>
                  <Icon
                    name={
                      downloading
                        ? 'spinner-ring'
                        : 'down-to-line'
                    }
                    className='size-5'
                  />
                </button>
              ) : null}
              <button
                type='button'
                aria-label='Close gate pass QR code'
                className='inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/25'
                onClick={() => setOpen(false)}>
                <Icon name='close' className='size-5' />
              </button>
            </div>
          </div>

          <div className='flex flex-1 items-center justify-center py-4'>
            <div
              className={cn(
                'relative w-full max-w-[min(88vw,430px)] rounded-3xl bg-white p-4 transition-colors',
                checkedIn && 'ring-4 ring-emerald-500/70'
              )}>
              <QRCanvas config={fullscreenConfig} className='aspect-square w-full rounded-2xl bg-white' />
              {checkedIn ? (
                <div className='absolute inset-4 flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-500/92 text-white backdrop-blur-sm'>
                  <span className='inline-flex size-16 items-center justify-center rounded-full bg-white/20'>
                    <Icon name='check' className='size-9' />
                  </span>
                  <div className='text-center'>
                    <p className='font-ios text-xs uppercase tracking-widest'>Ticket scanned</p>
                    <p className='mt-1 font-okx text-lg'>{registration?.name ?? 'Player checked in'}</p>
                    {checkedInAt ? (
                      <p className='mt-1 text-xs text-white/80'>{new Date(checkedInAt).toLocaleString()}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className='h-2/5 flex justify-center'>
            <div className='max-w-[min(88vw,430px)] h-fit w-full border bg-white p-4 divide-y divide-slate-300 rounded-lg'>
              <InfoDetail label='Status' value={checkedIn ? 'Scanned' : (registration?.slotLabel ?? '')} />
              <InfoDetail label='Name' value={registration?.name ?? ''} />
              <InfoDetail label='Email' value={registration?.email ?? ''} />
              <InfoDetail label='Entry Id' value={registration?.id ?? ''} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

interface InfoDetailProps {
  label: string
  value: string
  className?: ClassName
}
function InfoDetail({ label, value, className }: InfoDetailProps) {
  return (
    <div className='space-y-0.5 py-3'>
      <p className='font-ios font-medium text-[10px] uppercase tracking-widest text-foreground/80 dark:text-slate-500 italic'>
        {label}
      </p>
      <p
        className={cn(
          'font-ios tracking-[0.28em] text-sm text-foreground/80 dark:text-slate-800 max-w-[16ch]! text-clip whitespace-nowrap',
          className
        )}>
        {value}
      </p>
    </div>
  )
}
