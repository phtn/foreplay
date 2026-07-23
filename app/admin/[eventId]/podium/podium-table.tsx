'use client'

import { LinkTitle, SectionTitle } from '@/components/layouts/title'
import { Badge } from '@/components/reui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { assignPodiumAward } from './actions'

type Registration = Doc<'registrations'>
type PodiumAward = Doc<'podiumAwards'>

type PodiumTableProps = {
  eventId: string
  podiumAwards: PodiumAward[]
  registrations: Registration[]
  eventName?: string
}

type AwardSlot = {
  assignedRegistrationId?: Id<'registrations'>
  position: number
}

type AwardTable = {
  awardKey: string
  eyebrow: string
  slots: AwardSlot[]
  title: string
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

function groupBy(registrations: Registration[], getKey: (registration: Registration) => string) {
  return registrations.reduce<Record<string, Registration[]>>((acc, registration) => {
    const key = getKey(registration)
    acc[key] = [...(acc[key] ?? []), registration]
    return acc
  }, {})
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildSlots(awardKey: string, podiumAwards: PodiumAward[]) {
  return [1, 2, 3].map((position) => ({
    position,
    assignedRegistrationId: podiumAwards.find((award) => award.award_key === awardKey && award.position === position)
      ?.registration_id
  }))
}

function buildAwardTables(registrations: Registration[], podiumAwards: PodiumAward[]): AwardTable[] {
  const confirmedRows = registrations.filter((registration) => registration.payment_status === 'paid')
  const divisionRows = Object.entries(groupBy(confirmedRows, (registration) => registration.division ?? 'Unassigned'))
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([division]) => ({
      awardKey: `division-${slugify(division)}`,
      title: `${division} Division`,
      eyebrow: 'Division Award',
      slots: buildSlots(`division-${slugify(division)}`, podiumAwards)
    }))
  const pairingGroupRows = Object.entries(
    groupBy(confirmedRows, (registration) => `Group ${registration.pairing_group ?? 'Unassigned'}`)
  )
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([group]) => ({
      awardKey: `group-${slugify(group)}`,
      title: group,
      eyebrow: 'Group Award',
      slots: buildSlots(`group-${slugify(group)}`, podiumAwards)
    }))

  return [
    {
      awardKey: 'overall',
      title: 'Overall Podium',
      eyebrow: 'Main Award',
      slots: buildSlots('overall', podiumAwards)
    },
    ...divisionRows,
    ...pairingGroupRows,
    {
      awardKey: 'checked-in',
      title: 'Checked-In Players',
      eyebrow: 'Attendance Award',
      slots: buildSlots('checked-in', podiumAwards)
    }
  ]
}

function buildRegistrationMap(registrations: Registration[]) {
  return new Map(registrations.map((registration) => [registration._id, registration]))
}

export function PodiumTable({ eventId, podiumAwards, registrations, eventName }: PodiumTableProps) {
  const awardTables = useMemo(() => buildAwardTables(registrations, podiumAwards), [podiumAwards, registrations])
  const registrationById = useMemo(() => buildRegistrationMap(registrations), [registrations])
  const assignedCount = awardTables.reduce(
    (count, award) => count + award.slots.filter((slot) => slot.assignedRegistrationId).length,
    0
  )

  return (
    <div className='mx-auto flex min-h-screen w-full max-w-7xl flex-col border border-input'>
      <div className='flex items-center justify-between px-3 py-4'>
        <SectionTitle title='Pairings' eyebrow='back' href={`/admin/${eventId}/pairings`} />
        <h1 className='hidden font-poly text-sm md:flex'>{'Podium'}</h1>

        <LinkTitle title={eventName ?? 'Event Name'} icon='chevron-right' href={`/admin/${eventId}/pairings`} />
      </div>

      <div className='grid grid-cols-3 border-y border-border/80 bg-slate-100/50 dark:bg-slate-400/20'>
        {[
          { label: 'Registered', value: registrations.length },
          { label: 'Award Tables', value: awardTables.length },
          { label: 'Assigned Slots', value: assignedCount }
        ].map((stat) => (
          <div key={stat.label} className='border-r border-border/70 px-3 py-3 last:border-r-0'>
            <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{stat.label}</p>
            <p className='mt-1 font-heading text-xl font-bold'>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className='space-y-6 p-3'>
        {awardTables.map((award) => (
          <AwardTable
            key={award.awardKey}
            award={award}
            eventId={eventId}
            registrationById={registrationById}
            registrations={registrations}
          />
        ))}
      </div>
    </div>
  )
}

function AwardTable({
  award,
  eventId,
  registrationById,
  registrations
}: {
  award: AwardTable
  eventId: string
  registrationById: Map<Id<'registrations'>, Registration>
  registrations: Registration[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingPosition, setPendingPosition] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateAssignment = (position: number, registrationId: string) => {
    setErrorMessage(null)
    setPendingPosition(position)

    startTransition(async () => {
      try {
        await assignPodiumAward({
          eventId,
          awardKey: award.awardKey,
          awardTitle: award.title,
          awardEyebrow: award.eyebrow,
          position,
          registrationId: registrationId ? (registrationId as Id<'registrations'>) : undefined
        })

        router.refresh()
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to assign this award.')
      } finally {
        setPendingPosition(null)
      }
    })
  }

  return (
    <section className='space-y-3'>
      <div>
        <p className='font-ios text-xs uppercase tracking-widest text-sky-600 dark:text-sky-500'>{award.eyebrow}</p>
        <h2 className='font-okx text-lg font-semibold tracking-wide'>{award.title}</h2>
      </div>

      {errorMessage ? (
        <div className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {errorMessage}
        </div>
      ) : null}

      <Table className='border border-border/80'>
        <TableHeader>
          <TableRow className='bg-slate-100/50 font-okx dark:bg-slate-400/35'>
            <TableHead className='w-12 text-center text-indigo-600 dark:text-indigo-300'>#</TableHead>
            <TableHead>Assign Player</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Principal</TableHead>
            <TableHead className='text-center'>Division</TableHead>
            <TableHead className='text-center'>Handicap</TableHead>
            <TableHead className='text-center'>Start</TableHead>
            <TableHead className='text-center'>Group</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className='divide-y divide-slate-200 dark:divide-input/80'>
          {award.slots.map((slot) => {
            const registration = slot.assignedRegistrationId
              ? registrationById.get(slot.assignedRegistrationId)
              : undefined
            const rowPending = isPending && pendingPosition === slot.position

            return (
              <TableRow key={`${award.awardKey}-${slot.position}`}>
                <TableCell className='text-center text-sm font-bold'>{slot.position}</TableCell>
                <TableCell>
                  <select
                    value={slot.assignedRegistrationId ?? ''}
                    disabled={rowPending}
                    className='h-9 w-full min-w-48 rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50'
                    onChange={(event) => updateAssignment(slot.position, event.currentTarget.value)}>
                    <option value=''>Unassigned</option>
                    {registrations.map((option) => (
                      <option key={option._id} value={option._id}>
                        {option.player_name}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  {registration ? (
                    <div className='flex items-center gap-3'>
                      <Avatar size='sm'>
                        <AvatarImage src={registration.player_id} alt={registration.player_name} />
                        <AvatarFallback>{getInitials(registration.player_name)}</AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <span className='font-okx text-sm font-medium capitalize'>{registration.player_name}</span>
                        {registration.player_email ? (
                          <span className='text-xs text-muted-foreground'>{registration.player_email}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <span className='text-sm text-muted-foreground'>No player assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {registration ? (
                    <Badge variant='outline' size='sm'>
                      {formatPrincipal(registration.shirt_size)}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className='text-center'>
                  {registration ? (
                    <Badge variant='info-light' size='sm'>
                      {registration.division ?? 'Unassigned'}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className='text-center font-mono text-sm font-medium'>
                  {registration?.handicap_index ?? '-'}
                </TableCell>
                <TableCell className='text-center font-mono text-sm'>{registration?.start_hole ?? '-'}</TableCell>
                <TableCell className='text-center'>
                  {registration ? (
                    <Badge variant='outline' size='sm'>
                      {registration.pairing_group ?? '-'}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}
