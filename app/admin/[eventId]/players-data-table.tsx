'use client'

import { DataTable } from '@/components/table'
import { type ColumnConfig, multiSelectFilterFn } from '@/components/table/create-column'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Icon, type IconName } from '@/lib/icons'
import type { RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { cn } from '@/lib/utils'
import { formatStatus, pesoFormatter } from '@/utils/formatters'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useRef, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import {
  confirmSubscription,
  undoSubscriptionStatus,
  updateSubscriptionRemarks,
  updateSubscriptionStatus
} from './actions'
import { ReceiptDrawer } from './receipt-drawer'
import type { EditableSubscriptionStatus } from './subscription-status-actions'

export interface EventSubscriptionTableRow {
  subscriptionId: string
  userId: string
  createdAt: number
  reference: string
  contactEmail: string | null
  teamName: string
  totalPlayers: number
  totalCheckedIn: number
  paymentAmount: number | null
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  subscriptionStatus: string
  confirmer: string | null
  confirmedAt: number | null
  receiptUrl: string | null
  adminRemarks: string
  canUndo: boolean
  tickets: RegistrationTicketData[]
}

interface PlayersDataTableProps {
  eventId: string
  rows: EventSubscriptionTableRow[]
}

const subscriptionStatusStyles: Record<string, string> = {
  pending_payment: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  payment_review: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-destructive/10 text-destructive'
}

const paymentStatusStyles: Record<EventSubscriptionTableRow['paymentStatus'], string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
}

const paymentFilterOptions: EventSubscriptionTableRow['paymentStatus'][] = ['pending', 'paid', 'failed', 'refunded']

const TicketViewerDrawer = dynamic(() => import('./ticket-viewer-drawer').then((module) => module.TicketViewerDrawer), {
  ssr: false
})

type StatusMenuActionId = EditableSubscriptionStatus | 'confirm_payment'

interface StatusMenuAction {
  id: StatusMenuActionId
  label: string
  icon: IconName
  variant?: 'default' | 'destructive'
}

const statusMenuActions: StatusMenuAction[] = [
  {
    id: 'pending_payment',
    label: 'Pending payment',
    icon: 'clock'
  },
  {
    id: 'payment_review',
    label: 'Payment review',
    icon: 'eye'
  },
  {
    id: 'confirm_payment',
    label: 'Confirm payment',
    icon: 'circle-check-line'
  },
  {
    id: 'cancelled',
    label: 'Cancel entry',
    icon: 'close',
    variant: 'destructive'
  }
]

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

const emptyState = (
  <div className='flex min-h-44 flex-col items-center justify-center gap-3 p-8 text-center'>
    <Icon name='ticket' className='size-10 text-muted-foreground/50' />
    <div className='space-y-1'>
      <p className='font-okx text-base'>No subscriptions yet</p>
      <p className='text-sm text-muted-foreground'>This event does not have any entry requests yet.</p>
    </div>
  </div>
)

function DateTimeCell({ timestamp, fallback = '—' }: { timestamp: number | null; fallback?: string }) {
  if (timestamp === null || !Number.isFinite(timestamp)) {
    return <span className='text-xs text-muted-foreground'>{fallback}</span>
  }

  const parts = dateTimeFormatter.format(timestamp).split(',')

  return (
    <div className='font-okx text-xs text-muted-foreground'>
      {parts.map((part, index) => (
        <p className='whitespace-nowrap' key={`${part}-${index}`}>
          {part.trim()}
        </p>
      ))}
    </div>
  )
}

function ReferenceCell({ row }: { row: EventSubscriptionTableRow }) {
  return (
    <div className='min-w-0 space-y-1'>
      <Link href={`/admin/users/${row.subscriptionId}`}>
        <p className='truncate font-ios text-foreground/90'>{row.reference.substring(0, 4).toUpperCase()}</p>
      </Link>
    </div>
  )
}

function EntriesCell({ row }: { row: EventSubscriptionTableRow }) {
  return (
    <Link href={`/admin/config/users/${row.userId}`} className='space-y-1'>
      <p className='text-foreground/85'>
        <span className='font-okx'>{row.teamName}</span>
      </p>
      <p className='whitespace-nowrap text-xs text-muted-foreground'>
        <span className='font-okx'>{row.contactEmail}</span>
      </p>
    </Link>
  )
}

function StatusPill({ value, className }: { value: string; className: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-sm px-1.5 py-1 font-ios text-xs uppercase tracking-widest whitespace-nowrap',
        className
      )}>
      {formatStatus(value)}
    </span>
  )
}

function SubscriptionStatusCell({ row }: { row: EventSubscriptionTableRow }) {
  return (
    <div className='space-y-1.5'>
      <StatusPill
        value={row.subscriptionStatus}
        className={subscriptionStatusStyles[row.subscriptionStatus] ?? subscriptionStatusStyles.pending_payment}
      />
      {row.subscriptionStatus === 'confirmed' && row.confirmer ? (
        <p className='max-w-44 truncate text-xs text-muted-foreground' title={row.confirmer}>
          {row.confirmer}
        </p>
      ) : null}
    </div>
  )
}

function FormSubmitButton({
  label,
  pendingLabel,
  className
}: {
  label: string
  pendingLabel: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button type='submit' variant='ghost' size='xs' disabled={pending} aria-live='polite' className={className}>
      {pending ? <Icon name='spinner-ring' className='size-3.5' /> : null}
      {pending ? pendingLabel : label}
    </Button>
  )
}

const isCurrentStatusAction = (row: EventSubscriptionTableRow, action: StatusMenuActionId) => {
  if (action === 'confirm_payment') {
    return row.subscriptionStatus === 'confirmed' && row.paymentStatus === 'paid' && row.tickets.length > 0
  }

  return row.subscriptionStatus === action
}

function SubscriptionStatusActions({ eventId, row }: { eventId: string; row: EventSubscriptionTableRow }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<StatusMenuActionId | 'undo' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const actionPendingRef = useRef(false)

  const runAction = (action: StatusMenuActionId | 'undo') => {
    if (actionPendingRef.current) return

    actionPendingRef.current = true
    setActionError(null)
    setPendingAction(action)
    startTransition(async () => {
      try {
        const input = {
          eventId,
          subscriptionId: row.subscriptionId
        }

        if (action === 'confirm_payment') {
          await confirmSubscription(input)
        } else if (action === 'undo') {
          await undoSubscriptionStatus(input)
        } else {
          await updateSubscriptionStatus({
            ...input,
            status: action
          })
        }

        setMenuOpen(false)
      } catch {
        setActionError(action === 'undo' ? 'The last update could not be undone.' : 'The status could not be updated.')
        setMenuOpen(true)
      } finally {
        actionPendingRef.current = false
        setPendingAction(null)
      }
    })
  }

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        if (!actionPendingRef.current) {
          setMenuOpen(open)
          if (open) setActionError(null)
        }
      }}>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='xs'
            disabled={isPending}
            aria-label={`Update status for ${row.reference}`}
            className='mx-auto gap-1 text-sky-600 hover:text-sky-500 dark:text-sky-400'>
            <Icon name={isPending ? 'spinner-ring' : 'document'} className='size-3.5' />
            <span>Update</span>
            {!isPending ? <Icon name='chevron-down' className='size-3' /> : null}
          </Button>
        }
      />
      {menuOpen ? (
        <DropdownMenuContent align='end' className='w-64 rounded-md border-[0.5px] border-foreground/50'>
          <DropdownMenuGroup className='space-y-2'>
            <DropdownMenuLabel className='font-okx font-semibold tracking-widest uppercase text-neutral-500 dark:text-sky-500 border-b border-border/60 border-dashed text-xs'>
              Status Options
            </DropdownMenuLabel>
            {statusMenuActions.map((action) => {
              const isCurrent = isCurrentStatusAction(row, action.id)
              const actionLabel =
                action.id === 'confirm_payment' &&
                row.subscriptionStatus === 'confirmed' &&
                row.paymentStatus === 'paid' &&
                row.tickets.length === 0
                  ? 'Generate ticket'
                  : action.label
              const cancelBlocked =
                action.id === 'cancelled' && (row.paymentStatus === 'paid' || row.subscriptionStatus === 'confirmed')
              const actionPending = pendingAction === action.id

              return (
                <DropdownMenuItem
                  className={cn(isCurrent && 'bg-sky-500/8')}
                  key={action.id}
                  variant={action.variant}
                  disabled={isPending || isCurrent || cancelBlocked}
                  onClick={() => runAction(action.id)}>
                  <Icon
                    name={actionPending ? 'spinner-ring' : isCurrent ? 'check' : action.icon}
                    className={cn('size-4', { 'text-sky-800 dark:text-sky-500 opacity-100': isCurrent })}
                  />
                  <span className={cn('whitespace-nowrap capitalize font-okx', { '': isCurrent })}>{actionLabel}</span>
                  {isCurrent ? (
                    <span className='ml-auto font-ios text-foreground/80 text-[10px] uppercase tracking-widest'>
                      Current
                    </span>
                  ) : null}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isPending || !row.canUndo} onClick={() => runAction('undo')}>
            <Icon name={pendingAction === 'undo' ? 'spinner-ring' : 'undo-variant'} className='size-4' />
            <span>Undo last update</span>
          </DropdownMenuItem>
          {actionError ? (
            <p role='alert' className='px-3 py-2 text-xs text-destructive'>
              {actionError}
            </p>
          ) : null}
        </DropdownMenuContent>
      ) : null}
    </DropdownMenu>
  )
}

function TicketCell({ row }: { row: EventSubscriptionTableRow }) {
  const [open, setOpen] = useState(false)

  if (row.tickets.length === 0) {
    return <span className='flex justify-center text-xs text-muted-foreground'>N/A</span>
  }

  return (
    <div className='flex justify-center'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='gap-1 text-pink-600 hover:text-pink-500 dark:text-pink-400/80'
        aria-label={`View tickets for ${row.reference}`}
        onClick={() => setOpen(true)}>
        <Icon name='ticket' className='size-5' />
        <span className='hidden'>View{row.tickets.length > 1 ? ` (${row.tickets.length})` : ''}</span>
      </Button>
      {open ? (
        <TicketViewerDrawer
          active={row.paymentStatus === 'paid' && row.subscriptionStatus === 'confirmed'}
          onOpenChange={setOpen}
          open={open}
          reference={row.reference}
          tickets={row.tickets}
        />
      ) : null}
    </div>
  )
}

function RemarksCell({ eventId, row }: { eventId: string; row: EventSubscriptionTableRow }) {
  return (
    <form action={updateSubscriptionRemarks} className='flex min-w-64 items-center gap-1'>
      <input type='hidden' name='subscriptionId' value={row.subscriptionId} />
      <input type='hidden' name='eventId' value={eventId} />
      <textarea
        key={row.adminRemarks}
        name='remarks'
        defaultValue={row.adminRemarks}
        maxLength={1_000}
        rows={2}
        aria-label={`Admin remarks for ${row.reference}`}
        placeholder='Add admin notes'
        className='min-h-10 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-xs whitespace-normal outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-transparent'
      />
      <FormSubmitButton label='Save' pendingLabel='Saving' className='text-sky-600 hover:text-sky-500' />
    </form>
  )
}

export function PlayersDataTable({ eventId, rows }: PlayersDataTableProps) {
  const columns = useMemo<ColumnConfig<EventSubscriptionTableRow>[]>(
    () => [
      {
        id: 'reference',
        accessorKey: 'reference',
        header: 'Ref #',
        size: 80,
        enableFiltering: true,
        enableSorting: true,
        cell: ({ row }) => <ReferenceCell row={row.original} />
      },
      {
        id: 'created',
        accessorKey: 'createdAt',
        header: 'Created',
        size: 100,
        enableFiltering: true,
        enableGlobalFiltering: true,
        cell: ({ row }) => <DateTimeCell timestamp={row.original.createdAt} />
      },

      {
        id: 'player',
        accessorKey: 'teamName',
        header: 'Player',
        size: 220,
        enableFiltering: false,
        cell: ({ row }) => <EntriesCell row={row.original} />
      },
      {
        id: 'amount',
        accessorKey: 'paymentAmount',
        header: 'Amount',
        size: 80,
        enableFiltering: false,
        enableGlobalFiltering: false,
        cell: ({ row }) => (
          <span className='font-okx text-foreground/85'>
            {row.original.paymentAmount === null
              ? '—'
              : pesoFormatter.format(row.original.paymentAmount).replace('₱', '').trim()}
          </span>
        )
      },
      {
        id: 'payment',
        accessorKey: 'paymentStatus',
        header: 'Payment',
        size: 120,
        filterFn: multiSelectFilterFn,
        meta: { filterOptions: paymentFilterOptions },
        cell: ({ row }) => (
          <StatusPill value={row.original.paymentStatus} className={paymentStatusStyles[row.original.paymentStatus]} />
        )
      },
      {
        id: 'status',
        accessorKey: 'subscriptionStatus',
        header: 'Status',
        size: 190,
        filterFn: multiSelectFilterFn,
        cell: ({ row }) => <SubscriptionStatusCell row={row.original} />
      },
      {
        id: 'receipt',
        accessorKey: 'receiptUrl',
        header: 'Receipt',
        size: 80,
        enableFiltering: false,
        enableGlobalFiltering: false,
        enableSorting: false,
        cell: ({ row }) => (
          <ReceiptDrawer
            amount={row.original.paymentAmount ?? undefined}
            contactEmail={row.original.contactEmail ?? undefined}
            receiptUrl={row.original.receiptUrl}
            reference={row.original.reference}
            status={formatStatus(row.original.paymentStatus)}
            teamName={row.original.teamName}
            uploadedAt={row.original.createdAt}
          />
        )
      },
      {
        id: 'tickets',
        accessorKey: 'tickets',
        header: <div className='flex items-center justify-center w-full'>Ticket</div>,
        size: 110,
        enableFiltering: false,
        enableGlobalFiltering: false,
        enableSorting: false,
        cell: ({ row }) => <TicketCell row={row.original} />
      },
      {
        id: 'confirmation',
        accessorKey: 'subscriptionId',
        header: <div className='flex items-center justify-center w-full'>Action</div>,
        size: 130,
        enableFiltering: false,
        enableGlobalFiltering: false,
        enableHiding: true,
        enableSorting: false,
        cell: ({ row }) => <SubscriptionStatusActions eventId={eventId} row={row.original} />
      },
      {
        id: 'confirmedAt',
        accessorKey: 'confirmedAt',
        header: 'Confirmed At',
        size: 120,
        enableFiltering: false,
        enableGlobalFiltering: false,
        cell: ({ row }) => (
          <DateTimeCell
            timestamp={row.original.confirmedAt}
            fallback={row.original.subscriptionStatus === 'confirmed' ? 'N/A' : '—'}
          />
        )
      },
      {
        id: 'remarks',
        accessorKey: 'adminRemarks',
        header: 'Remarks',
        size: 330,
        enableFiltering: false,
        enableHiding: true,
        enableSorting: false,
        cell: ({ row }) => <RemarksCell eventId={eventId} row={row.original} />
      }
    ],
    [eventId]
  )

  return (
    <DataTable
      data={rows}
      title=''
      emptyState={emptyState}
      loading={false}
      editingRowId={null}
      columnConfigs={columns}
      rowIdAccessor='subscriptionId'
      queryParamPrefix='players'
      defaultPageSize={200}
      enableRowSelection={false}
    />
  )
}
