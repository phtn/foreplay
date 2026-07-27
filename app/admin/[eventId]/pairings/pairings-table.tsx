'use client'

import { GroupSelect } from '@/components/examples/c-select-26'
import { LinkTitle, SectionTitle } from '@/components/layouts/title'
import { Badge } from '@/components/reui/badge'
import { DataTable } from '@/components/table'
import { type ColumnConfig, multiSelectFilterFn } from '@/components/table/create-column'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { updateRegistrationPairing } from './actions'
import { StartSelector } from './start-selector'

type Registration = Doc<'registrations'>
type PairingGroup = 'A' | 'B' | 'C'
type PairingValue = {
  pairingGroup: PairingGroup
  startHole: string
}
type PairingState = Map<Id<'registrations'>, PairingValue>

type PairingTableRow = PairingValue & {
  checkedInStatus: 'Yes' | 'No'
  id: Id<'registrations'>
  pending: boolean
  playerId: string
  playerName: string
  position: number
  shirtSize: string
}

type PairingsTableProps = {
  eventId: string
  registrations: Registration[]
  eventName?: string
}
const cmap = {
  A: 'emerald text-emerald-500',
  B: 'orange text-orange-400',
  C: 'indigo text-indigo-500'
}
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatPrincipal(value: string) {
  if (value.includes('|')) {
    return value.split('|').at(-1) ?? value
  }

  return value
}

function buildInitialPairingState(registrations: Registration[]): PairingState {
  return new Map(
    registrations.map((registration) => [
      registration._id,
      {
        pairingGroup: registration.pairing_group ?? 'A',
        startHole: registration.start_hole === undefined ? '' : String(registration.start_hole)
      }
    ])
  )
}

const pairingGroupOptions: PairingGroup[] = ['A', 'B', 'C']
const checkedInOptions: PairingTableRow['checkedInStatus'][] = ['Yes', 'No']
const startHoleOptions = Array.from({ length: 18 }, (_, index) => String(index + 1))
const isPairingGroup = (value: string): value is PairingGroup => pairingGroupOptions.some((group) => group === value)

const emptyState = (
  <div className='flex min-h-44 flex-col items-center justify-center gap-1 p-8 text-center'>
    <p className='font-okx text-base'>No registered players</p>
    <p className='text-sm text-muted-foreground'>This tournament does not have any players to pair yet.</p>
  </div>
)

export function PairingsTable({ eventId, registrations, eventName }: PairingsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingRegistrationId, setPendingRegistrationId] = useState<Id<'registrations'> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pairingByRegistrationId, setPairingByRegistrationId] = useState(() => buildInitialPairingState(registrations))

  const rows = useMemo(() => {
    const sortedRegistrations = registrations.toSorted((left, right) => {
      const nameSort = left.player_name.localeCompare(right.player_name, undefined, {
        sensitivity: 'base'
      })

      return nameSort === 0 ? left._creationTime - right._creationTime : nameSort
    })

    return sortedRegistrations.map((registration, index): PairingTableRow => {
      const pairing = pairingByRegistrationId.get(registration._id) ?? {
        pairingGroup: registration.pairing_group ?? 'A',
        startHole: registration.start_hole === undefined ? '' : String(registration.start_hole)
      }

      return {
        ...pairing,
        checkedInStatus: registration.checked_in === true ? 'Yes' : 'No',
        id: registration._id,
        pending: isPending && pendingRegistrationId === registration._id,
        playerId: registration.player_id,
        playerName: registration.player_name,
        position: index + 1,
        shirtSize: formatPrincipal(registration.shirt_size)
      }
    })
  }, [isPending, pairingByRegistrationId, pendingRegistrationId, registrations])

  const updatePairing = useCallback(
    (registrationId: Id<'registrations'>, currentPairing: PairingValue, nextPairing: Partial<PairingValue>) => {
      const optimisticPairing = {
        ...currentPairing,
        ...nextPairing
      }

      setErrorMessage(null)
      setPendingRegistrationId(registrationId)
      setPairingByRegistrationId((current) => {
        const nextState = new Map(current)
        nextState.set(registrationId, optimisticPairing)
        return nextState
      })

      startTransition(async () => {
        try {
          const startHole = optimisticPairing.startHole ? Number.parseInt(optimisticPairing.startHole, 10) : undefined

          await updateRegistrationPairing({
            eventId,
            registrationId,
            startHole,
            pairingGroup: optimisticPairing.pairingGroup
          })

          router.refresh()
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to update this pairing.')
          setPairingByRegistrationId(buildInitialPairingState(registrations))
        } finally {
          setPendingRegistrationId(null)
        }
      })
    },
    [eventId, registrations, router]
  )

  const columns = useMemo<ColumnConfig<PairingTableRow>[]>(
    () => [
      {
        id: 'position',
        accessorKey: 'position',
        header: <div className='flex justify-center w-full text-indigo-500'>{rows.length}</div>,
        size: 56,
        enableFiltering: false,
        enableGlobalFiltering: false,
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => <div className='text-center text-sm font-bold tabular-nums'>{row.original.position}</div>
      },
      {
        id: 'player',
        accessorKey: 'playerName',
        header: 'Player',
        size: 280,
        enableHiding: false,
        cell: ({ row }) => (
          <div className='flex min-w-0 items-center gap-3'>
            <Avatar size='sm'>
              <AvatarImage src={row.original.playerId} alt={row.original.playerName} />
              <AvatarFallback>{getInitials(row.original.playerName)}</AvatarFallback>
            </Avatar>
            <span className='truncate font-okx text-sm font-medium capitalize'>{row.original.playerName}</span>
          </div>
        )
      },

      {
        id: 'checked-in',
        accessorKey: 'checkedInStatus',
        header: <div className='flex justify-center w-full'>Checked-In</div>,
        size: 150,
        filterFn: multiSelectFilterFn,
        meta: { filterOptions: checkedInOptions },
        cell: ({ row }) => (
          <div className='text-center'>
            <Badge variant={row.original.checkedInStatus === 'Yes' ? 'success-light' : 'warning-light'} size='sm'>
              {row.original.checkedInStatus}
            </Badge>
          </div>
        )
      },
      {
        id: 'start-hole',
        accessorKey: 'startHole',
        header: <div className='flex justify-center w-full'>Start</div>,
        size: 160,
        filterFn: multiSelectFilterFn,
        enableGlobalFiltering: false,
        meta: { filterOptions: startHoleOptions },
        cell: ({ row }) => (
          <StartSelector
            value={row.original.startHole}
            disabled={row.original.pending}
            onChangeAction={(startHole) =>
              updatePairing(row.original.id, row.original, {
                startHole
              })
            }
          />
        )
      },
      {
        id: 'group',
        accessorKey: 'pairingGroup',
        header: <div className='flex justify-center w-full'>Group</div>,
        size: 180,
        filterFn: multiSelectFilterFn,
        enableGlobalFiltering: false,
        enableHiding: false,
        meta: { filterOptions: pairingGroupOptions },
        cell: ({ row }) => (
          <div className='flex justify-center'>
            <GroupSelect
              value={row.original.pairingGroup}
              disabled={row.original.pending}
              onChange={(pairingGroup) => {
                if (!isPairingGroup(pairingGroup)) return

                updatePairing(row.original.id, row.original, {
                  pairingGroup
                })
              }}
            />
          </div>
        )
      },
      {
        id: 'color',
        accessorKey: 'pairingGroup',
        header: <div className='flex justify-center w-full'>Color</div>,
        size: 110,
        filterFn: multiSelectFilterFn,
        cell: ({ row }) => (
          <div
            className={cn(
              'flex justify-center font-okx font-medium tracking-wide',
              cmap[row.original.pairingGroup].split(' ').pop()
            )}>
            {cmap[row.original.pairingGroup].split(' ').shift()}
          </div>
        )
      }
    ],
    [rows.length, updatePairing]
  )

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col min-h-screen _border border-input'>
      <div className='flex items-center justify-between px-4'>
        <SectionTitle title={eventName ?? 'Event Name'} eyebrow='Players' href={`/admin/${eventId}`} />
        <h1 className='font-poly text-base md:text-lg hidden md:flex'>{'Pairings'}</h1>
        <LinkTitle title='Podium' icon='trophy' href={`/admin/${eventId}/podium`} />
      </div>

      {errorMessage ? (
        <div className='mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {errorMessage}
        </div>
      ) : null}

      <DataTable
        data={rows}
        title=''
        emptyState={emptyState}
        loading={false}
        editingRowId={isPending ? pendingRegistrationId : null}
        columnConfigs={columns}
        rowIdAccessor='id'
        queryParamPrefix='pairings'
        defaultPageSize={100}
        enableRowSelection={false}
        fillAvailableWidth
      />
    </div>
  )
}
