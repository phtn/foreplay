'use client'

import { CreateQR } from '@/components/qrcode/creator'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { createPngFilename, downloadElementAsPng } from '@/lib/tickets/download-ticket-png'
import { formatTicketNumber, type RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { useCallback, useMemo, useRef, useState } from 'react'

const TICKET_QR_SOURCE_SIZE = 512

interface RegistrationTicketCardProps {
  className?: string
  deletePending?: boolean
  exportDisabled?: boolean
  isActive?: boolean
  onDelete?: (registrationId: Id<'registrations'>, playerName: string) => void
  onExportError?: (message: string | null) => void
  registration: RegistrationTicketData
  subscribeToCheckIn?: boolean
}

function formatCheckedInAt(timestamp: number | undefined) {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Scanned'
}

function RegistrationField({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className='min-w-0 space-y-1'>
      <p className='font-ios text-[9px] font-medium uppercase tracking-[0.24em] text-slate-400'>{label}</p>
      <p
        className={cn(
          'min-w-0 max-w-full wrap-break-word font-ios text-[13px] leading-5 tracking-[0.06em] text-slate-700',
          className
        )}>
        {value}
      </p>
    </div>
  )
}

function TicketMetric({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className='font-ios text-[8px] font-medium uppercase tracking-[0.22em] text-slate-400'>{label}</p>
      <p className='mt-1 wrap-break-word font-okx text-sm font-medium text-slate-800'>{value}</p>
    </div>
  )
}

export function RegistrationTicketCard({
  className,
  deletePending = false,
  exportDisabled = false,
  isActive,
  onDelete,
  onExportError,
  registration,
  subscribeToCheckIn = true
}: RegistrationTicketCardProps) {
  const liveCheckInStatus = useQuery(
    api.registrations.q.getCheckInStatus,
    subscribeToCheckIn ? { registrationId: registration.id } : 'skip'
  )
  const checkedIn = liveCheckInStatus?.checkedIn ?? registration.checkedIn
  const checkedInAt = liveCheckInStatus?.checkedInAt ?? registration.checkedInAt
  const active = isActive ?? registration.paymentStatus === 'paid'
  const ticketRef = useRef<HTMLDivElement>(null)
  const exportLockRef = useRef(false)
  const [isExporting, setIsExporting] = useState(false)
  const qrConfig = useMemo(
    () => ({
      text: registration.gatePassPayload,
      radius: 0.36,
      ecLevel: 'M' as const,
      fill: checkedIn ? '#047857' : '#334155',
      background: '#ffffff',
      size: TICKET_QR_SOURCE_SIZE
    }),
    [checkedIn, registration.gatePassPayload]
  )

  const handleDownload = useCallback(async () => {
    if (!active || exportDisabled || exportLockRef.current || isExporting || !ticketRef.current) {
      return
    }

    onExportError?.(null)
    exportLockRef.current = true
    setIsExporting(true)

    try {
      await downloadElementAsPng(
        ticketRef.current,
        createPngFilename(`foreplay-ticket-${registration.name}`, `foreplay-ticket-${registration.id}`)
      )
    } catch (error) {
      console.error('Unable to export ticket PNG.', error)
      onExportError?.('Unable to download this ticket. Please try again.')
    } finally {
      exportLockRef.current = false
      setIsExporting(false)
    }
  }, [active, exportDisabled, isExporting, onExportError, registration.id, registration.name])

  return (
    <div className={cn('relative rounded-[1.35rem] bg-white shadow-sm', className)}>
      <div
        ref={ticketRef}
        data-ticket-export-root
        className={cn(
          'relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white text-slate-950 transition-opacity',
          !active && 'opacity-75'
        )}>
        <div aria-hidden className='h-1 w-full bg-slate-950' />

        <div className='grid md:grid-cols-[minmax(0,1fr)_13.5rem]'>
          <section className='min-w-0 p-5 pt-4 sm:p-6 sm:pt-5 md:p-7 relative'>
            <div className='absolute top-4 right-4 bg-[url("/som-optimized.svg")] bg-cover bg-no-repeat w-18 h-16 aspect-auto opacity-80' />
            <header className='flex items-center gap-3 pr-20 md:pr-0'>
              <span
                aria-hidden
                className='inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-950 font-poly text-sm font-medium text-white'>
                <Icon name='foreplay' size={24} />
              </span>
              <div className='min-w-0'>
                <p className='font-poly text-[15px] font-medium leading-none tracking-[-0.02em] text-slate-950'>
                  FOREPLAY
                </p>
                <p className='mt-1 max-w-72 wrap-break-word font-ios text-[8px] uppercase leading-3 tracking-[0.18em] text-slate-600'>
                  {registration.eventName ?? 'Tournament entry'}
                </p>
              </div>
            </header>

            <div className='mt-7 min-w-0 sm:mt-9'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='font-ios text-[9px] font-medium uppercase tracking-[0.28em] text-slate-500'>
                  Admit one · {registration.slotLabel}
                </p>
                {checkedIn ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-ios text-[8px] font-medium uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-600/15'>
                    <Icon name='check' className='size-3' />
                    Checked in
                  </span>
                ) : active ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-ios text-[8px] font-medium uppercase tracking-[0.18em] text-slate-600 ring-1 ring-slate-900/5'>
                    <span aria-hidden className='size-1.5 rounded-full bg-emerald-500' />
                    Entry active
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-ios text-[8px] font-medium uppercase tracking-[0.18em] text-amber-700 ring-1 ring-amber-600/15'>
                    <Icon name='lock' className='size-3' />
                    Inactive
                  </span>
                )}
              </div>
              <p className='mt-3 wrap-break-word font-poly text-[1.65rem] font-medium leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-[2rem]'>
                {registration.name}
              </p>
              {checkedIn ? (
                <p className='mt-2 font-ios text-[10px] tracking-[0.04em] text-emerald-700'>
                  Admitted {formatCheckedInAt(checkedInAt)}
                </p>
              ) : null}
            </div>

            <div className='mt-7 grid min-w-0 grid-cols-2 border-y border-slate-200 py-4 sm:mt-8 sm:grid-cols-[1.35fr_1fr_0.75fr]'>
              <TicketMetric
                className='col-span-2 border-b border-slate-200 pb-3 sm:col-span-1 sm:border-b-0 sm:pb-0'
                label='Venue'
                value={registration.venue ?? 'Venue TBA'}
              />
              <TicketMetric
                className='pt-3 sm:border-l sm:border-slate-200 sm:pl-4 sm:pt-0'
                label='Event date'
                value={registration.eventDate ?? 'Date TBA'}
              />
              <TicketMetric className='border-l border-slate-200 pl-4 pt-3 sm:pt-0' label='Type' value='Premium' />
            </div>

            <div className='mt-5 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-6'>
              <RegistrationField label='Email Address' value={registration.email} />
              <RegistrationField label='Phone Number' value={registration.phone} />
            </div>
          </section>

          <aside className='relative border-t-2 border-dashed border-neutral-300 dark:border-neutral-300 md:border-l-2 md:border-t-0'>
            <span
              aria-hidden
              className='absolute -left-3 -top-3 size-6 rounded-full border border-slate-200 bg-neutral-200 dark:bg-neutral-500 md:hidden'
            />
            <span
              aria-hidden
              className='absolute -right-3 -top-3 size-6 rounded-full border border-slate-200 bg-neutral-200 dark:bg-neutral-500 md:hidden'
            />
            <span
              aria-hidden
              className='absolute -left-3 -top-4 hidden size-6 rounded-full border border-slate-200 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-500 md:block'
            />
            <span
              aria-hidden
              className='absolute -bottom-3 -left-3 hidden size-6 rounded-full border border-slate-200 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-500 md:block'
            />

            <div className='flex h-full min-w-0 flex-col items-center justify-center px-5 py-6 text-center md:px-4 md:pb-5 md:pt-12'>
              <div>
                <p className='font-ios text-[9px] font-medium uppercase tracking-[0.3em] text-slate-700'>Gate pass</p>
                <p className='mt-1 font-ios text-[8px] uppercase tracking-[0.2em] text-slate-400'>Scan at entry</p>
              </div>

              <CreateQR
                className='my-4 size-40 rounded-xl p-2.5 sm:size-44 md:my-3 md:size-36 md:p-2'
                config={qrConfig}
                disabled={!active}
                downloading={isExporting}
                onDownload={active && !exportDisabled ? handleDownload : undefined}
                registration={{
                  ...registration,
                  checkedIn,
                  checkedInAt
                }}
              />

              <RegistrationField
                label='Ticket number'
                value={formatTicketNumber(registration.id)}
                className={cn(
                  'max-w-none whitespace-nowrap font-semibold text-base leading-none tracking-[0.2em] text-slate-900',
                  checkedIn && 'text-emerald-700'
                )}
              />
              <p className='mt-3 font-ios text-[7px] uppercase tracking-[0.18em] text-slate-400'>
                Valid for one admission
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div
        data-ticket-export-ignore
        className='absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-slate-200 backdrop-blur'>
        <Button
          type='button'
          variant='ghost'
          size='icon-xs'
          className='shrink-0 rounded-full text-slate-600 hover:bg-sky-50 hover:text-sky-700'
          disabled={!active || exportDisabled || isExporting}
          aria-label={`Download ${registration.name}'s ticket as PNG`}
          title={active ? 'Download ticket as PNG' : 'Payment must be confirmed before download'}
          onClick={() => {
            void handleDownload()
          }}>
          <Icon name={isExporting ? 'spinner-ring' : 'down-to-line'} className='size-4' />
        </Button>
        {onDelete && !checkedIn ? (
          <Button
            type='button'
            variant='ghost'
            size='icon-xs'
            className='shrink-0 rounded-full text-slate-600 hover:bg-destructive/10 hover:text-destructive'
            disabled={deletePending || exportDisabled || isExporting}
            aria-label={`Delete ${registration.name}`}
            onClick={() => onDelete(registration.id, registration.name)}>
            <Icon name={deletePending ? 'spinner-ring' : 'close'} className='size-4' />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
