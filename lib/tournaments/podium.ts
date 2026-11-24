import type { Doc, Id } from '@/convex/_generated/dataModel'

type Registration = Doc<'registrations'>
type PodiumAward = Doc<'podiumAwards'>

type AwardSlot = {
  assignedRegistrationId?: Id<'registrations'>
  position: number
}

export type AwardTable = {
  awardKey: string
  eyebrow: string
  slots: AwardSlot[]
  title: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildAwardTables(registrations: Registration[], podiumAwards: PodiumAward[]): AwardTable[] {
  const assignments = new Map<string, PodiumAward>()
  for (const award of podiumAwards) {
    const key = `${award.award_key}:${award.position}`
    if (!assignments.has(key)) assignments.set(key, award)
  }

  const buildSlots = (awardKey: string): AwardSlot[] => [1, 2, 3].map((position) => ({
    position,
    assignedRegistrationId: assignments.get(`${awardKey}:${position}`)?.registration_id
  }))
  const confirmedRows = registrations.filter((registration) => registration.payment_status === 'paid')
  const ordered = (values: string[]) => [...new Set(values)].sort((left, right) => left.localeCompare(right))
  const divisionRows = ordered(confirmedRows.map((row) => row.division ?? 'Unassigned')).map((division) => {
    const awardKey = `division-${slugify(division)}`
    return { awardKey, title: `${division} Division`, eyebrow: 'Division Award', slots: buildSlots(awardKey) }
  })
  const pairingGroupRows = ordered(confirmedRows.map((row) => `Group ${row.pairing_group ?? 'Unassigned'}`)).map((group) => {
    const awardKey = `group-${slugify(group)}`
    return { awardKey, title: group, eyebrow: 'Group Award', slots: buildSlots(awardKey) }
  })

  return [
    {
      awardKey: 'overall',
      title: 'Overall Podium',
      eyebrow: 'Main Award',
      slots: buildSlots('overall')
    },
    ...divisionRows,
    ...pairingGroupRows,
    {
      awardKey: 'checked-in',
      title: 'Checked-In Players',
      eyebrow: 'Attendance Award',
      slots: buildSlots('checked-in')
    }
  ]
}
