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
    <div className='space-y-0.5'>
      <p className='font-ios text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500'>{label}</p>
      <p
        className={cn(
          'min-w-0 max-w-full wrap-break-word font-ios text-sm tracking-[0.18em] text-slate-800',
          className
        )}>
        {value}
      </p>
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
      size: 180
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
    <div className={cn('relative', className)}>
      <div
        ref={ticketRef}
        data-ticket-export-root
        className={cn('relative bg-white px-4 py-6 text-slate-900 transition-colors', !active && 'opacity-70')}>
        <div className='grid gap-4 md:grid-cols-[1fr_auto] md:items-start'>
          <div className='min-w-0 space-y-4'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='w-fit font-ios text-[11px] uppercase tracking-widest text-slate-500'>
                  {registration.slotLabel}
                </p>
                {checkedIn ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-ios text-[10px] uppercase tracking-widest text-emerald-800'>
                    <Icon name='check' className='size-3' />
                    Scanned
                  </span>
                ) : null}
                {!active ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-ios text-[10px] uppercase tracking-widest text-amber-800'>
                    <Icon name='lock' className='size-3' />
                    Inactive
                  </span>
                ) : null}
              </div>
              <p className='wrap-break-word font-ios text-lg font-medium tracking-widest text-slate-900'>
                {registration.name}
              </p>
              {checkedIn ? (
                <p className='mt-1 text-xs text-emerald-700'>Checked in {formatCheckedInAt(checkedInAt)}</p>
              ) : null}
            </div>

            <div className='grid min-w-0 grid-cols-1 gap-3'>
              <RegistrationField label='Email Address' value={registration.email} />
              <RegistrationField label='Phone Number' value={registration.phone} />
              <RegistrationField
                label='Ticket Number'
                value={formatTicketNumber(registration.id)}
                className={cn(
                  'relative z-10 max-w-none whitespace-nowrap font-semibold text-xl tracking-[0.22em] sm:text-2xl sm:tracking-[0.35em] line-through decoration-white',
                  checkedIn && 'text-emerald-700'
                )}
              />
            </div>
          </div>

          <CreateQR
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
