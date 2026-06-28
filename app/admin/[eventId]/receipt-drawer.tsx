'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface ReceiptDrawerProps {
  amount?: number
  contactEmail?: string
  receiptUrl: string | null
  reference: string
  status: string
  teamName: string
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
})

export function ReceiptDrawer({ amount, contactEmail, receiptUrl, reference, status, teamName }: ReceiptDrawerProps) {
  const [open, setOpen] = useState(false)

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

  if (!receiptUrl) {
    return <span className='text-muted-foreground'>N/A</span>
  }

  return (
    <>
      <button
        type='button'
        className='font-okx text-xs text-sky-700 transition-colors hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200'
        onClick={() => setOpen(true)}>
        View
      </button>

      {open ? (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Receipt verification'
          className='fixed inset-0 z-100 flex justify-end bg-slate-950/55 backdrop-blur-sm'>
          <button
            type='button'
            aria-label='Close receipt viewer'
            className='absolute inset-0 cursor-default'
            onClick={() => setOpen(false)}
          />

          <aside
            className={cn(
              'relative z-10 flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-background shadow-2xl',
              'animate-in slide-in-from-right duration-200'
            )}>
            <div className='flex items-start justify-between gap-4 border-b border-border/70 p-4 sm:p-5'>
              <div className='min-w-0 space-y-1'>
                <p className='font-ios text-xs uppercase tracking-widest text-sky-500'>Receipt verification</p>
                <h2 className='truncate font-okx text-xl font-semibold'>{teamName}</h2>
                <p className='truncate font-mono text-xs text-muted-foreground'>{reference}</p>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='shrink-0 rounded-full'
                aria-label='Close receipt viewer'
                onClick={() => setOpen(false)}>
                <Icon name='close' className='size-4' />
              </Button>
            </div>

            <div className='grid grid-cols-3 gap-2 border-b border-border/70 p-4 sm:p-5'>
              {[
                { label: 'Amount', value: amount == null ? 'N/A' : pesoFormatter.format(amount) },
                { label: 'Payment', value: status },
                { label: 'Email', value: contactEmail ?? 'N/A' }
              ].map((item) => (
                <div key={item.label} className='min-w-0 rounded-lg border border-border/60 bg-muted/20 px-2 py-2'>
                  <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{item.label}</p>
                  <p className='mt-1 truncate text-xs font-medium text-foreground/85'>{item.value}</p>
                </div>
              ))}
            </div>

            <div className='min-h-0 flex-1 overflow-hidden bg-slate-950/5 p-3 sm:p-5'>
              <div className='flex h-full min-h-0 items-center justify-center rounded-xl border border-border/70 bg-white p-2'>
                <object
                  data={receiptUrl}
                  className='h-full max-h-full w-full max-w-full rounded-lg bg-white object-contain'
                  aria-label='Payment receipt'>
                  <div className='flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center text-slate-900'>
                    <Icon name='file' className='size-8 text-slate-500' />
                    <p className='text-sm'>This receipt cannot be previewed inline.</p>
                    <a href={receiptUrl} target='_blank' rel='noreferrer' className='text-sm font-medium text-sky-700'>
                      Open original
                    </a>
                  </div>
                </object>
              </div>
            </div>

            <div className='grid gap-2 border-t border-border/70 p-4 sm:grid-cols-2 sm:p-5'>
              <a
                href={receiptUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex h-10 items-center justify-center rounded-lg border border-border/70 px-3 text-sm transition-colors hover:bg-muted'>
                Open original
              </a>
              <Button type='button' className='h-10' onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
