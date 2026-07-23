'use client'

import { GroupSelect } from '@/components/examples/c-select-26'
import { LinkTitle, SectionTitle } from '@/components/layouts/title'
import { Badge } from '@/components/reui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { updateRegistrationPairing } from './actions'
import { StartSelector } from './start-selector'

type Registration = Doc<'registrations'>
type PairingGroup = 'A' | 'B' | 'C'
type PairingState = Record<
  string,
  {
    pairingGroup: string
    startHole: string
  }
>

type PairingsTableProps = {
  eventId: string
  registrations: Registration[]
  eventName?: string
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
  return Object.fromEntries(
    registrations.map((registration) => [
      registration._id,
      {
        pairingGroup: registration.pairing_group ?? 'A',
        startHole: registration.start_hole ? String(registration.start_hole) : ''
      }
    ])
  )
}

export function PairingsTable({ eventId, registrations, eventName }: PairingsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingRegistrationId, setPendingRegistrationId] = useState<Id<'registrations'> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pairingByRegistrationId, setPairingByRegistrationId] = useState(() => buildInitialPairingState(registrations))

  const rows = useMemo(() => {
    return registrations.toSorted((left, right) => {
      const nameSort = left.player_name.localeCompare(right.player_name)

      return nameSort === 0 ? left._creationTime - right._creationTime : nameSort
    })
  }, [registrations])

  const updatePairing = (
    registrationId: Id<'registrations'>,
    nextPairing: { pairingGroup?: string; startHole?: string }
  ) => {
    const currentPairing = pairingByRegistrationId[registrationId] ?? { pairingGroup: 'A', startHole: '' }
    const optimisticPairing = {
      ...currentPairing,
      ...nextPairing
    }

    setErrorMessage(null)
    setPendingRegistrationId(registrationId)
    setPairingByRegistrationId((current) => ({
      ...current,
      [registrationId]: optimisticPairing
    }))

    startTransition(async () => {
      try {
        const startHole = optimisticPairing.startHole ? Number.parseInt(optimisticPairing.startHole, 10) : undefined
        const pairingGroup = optimisticPairing.pairingGroup
          ? (optimisticPairing.pairingGroup as PairingGroup)
          : undefined

        await updateRegistrationPairing({
          eventId,
          registrationId,
          startHole,
          pairingGroup
        })

        router.refresh()
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to update this pairing.')
        setPairingByRegistrationId(buildInitialPairingState(registrations))
      } finally {
        setPendingRegistrationId(null)
      }
    })
  }

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col min-h-screen _border border-input'>
      <div className='flex items-center justify-between px-4'>
        <SectionTitle title={eventName ?? 'Event Name'} eyebrow='Event' href={`/admin/som-2026`} />
        <h1 className='font-poly text-base hidden md:flex'>{'Pairings'}</h1>

        <LinkTitle title='Podium' icon='trophy' href={`/admin/${eventId}/podium`} />
      </div>

      {errorMessage ? (
        <div className='mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {errorMessage}
        </div>
      ) : null}

      <Table className='border border-border/80'>
        <TableHeader>
          <TableRow className='bg-slate-100/50 dark:bg-slate-400/35 font-okx'>
            <TableHead className='w-12 text-center text-indigo-600 dark:text-indigo-300'>{rows.length}</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Principal</TableHead>
            <TableHead className='text-center'>Handicap</TableHead>
            <TableHead className='text-center'>Checked-In</TableHead>
            <TableHead className='text-center'>Start</TableHead>
            <TableHead className='text-center'>Group</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className='divide-y divide-slate-200 dark:divide-input/80'>
          {rows.length ? (
            rows.map((registration, index) => {
              const pairing = pairingByRegistrationId[registration._id] ?? {
                pairingGroup: registration.pairing_group ?? 'A',
                startHole: registration.start_hole ? String(registration.start_hole) : ''
              }
              const rowPending = isPending && pendingRegistrationId === registration._id

              return (
                <TableRow key={registration._id} className=''>
                  <TableCell className='text-center text-sm font-bold'>{index + 1}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar size='sm'>
                        <AvatarImage src={registration.player_id} alt={registration.player_name} />
                        <AvatarFallback>{getInitials(registration.player_name)}</AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <span className='font-okx font-medium text-sm capitalize'>{registration.player_name}</span>
                        {/*<span className='text-muted-foreground text-xs'>{registration.player_email ?? 'No email'}</span>*/}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' size='sm'>
                      {formatPrincipal(registration.shirt_size)}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-center font-mono text-sm font-medium'>
                    {registration.handicap_index ?? '-'}
                  </TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={registration.checked_in ? 'success-light' : 'warning-light'} size='sm'>
                      {registration.checked_in ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-center'>
                    <StartSelector
                      value={pairing.startHole}
                      disabled={rowPending}
                      onChangeAction={(startHole) => updatePairing(registration._id, { startHole })}
                    />
                  </TableCell>
                  <TableCell className='text-right w-28'>
                    <GroupSelect
                      value={pairing.pairingGroup}
                      disabled={rowPending}
                      onChange={(pairingGroup) => updatePairing(registration._id, { pairingGroup })}
                    />
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className='h-32 text-center text-sm text-muted-foreground'>
                No registered players for this tournament yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
