import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { tournamentSchema } from './d'
import { normalizeTournamentSupport } from './support'

const trimRequired = (value: string, label: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new ConvexError(`${label} is required.`)
  }

  return trimmed
}

const trimOptional = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const trimOptionalWithLimit = (
  value: string | undefined,
  label: string,
  maxLength: number
) => {
  const trimmed = trimOptional(value)

  if (trimmed && trimmed.length > maxLength) {
    throw new ConvexError(
      `${label} must be ${maxLength} characters or fewer.`
    )
  }

  return trimmed
}

const trimRequiredWithLimit = (
  value: string,
  label: string,
  maxLength: number
) => {
  const trimmed = trimRequired(value, label)

  if (trimmed.length > maxLength) {
    throw new ConvexError(
      `${label} must be ${maxLength} characters or fewer.`
    )
  }

  return trimmed
}

const tournamentUpdateResult = v.object({
  eventId: v.union(v.string(), v.null()),
  tournamentId: v.id('tournaments')
})

const getTournament = async (
  ctx: MutationCtx,
  tournamentId: Id<'tournaments'>
): Promise<Doc<'tournaments'>> => {
  const tournament = await ctx.db.get(tournamentId)

  if (!tournament) {
    throw new ConvexError('Tournament not found.')
  }

  return tournament
}

const toTournamentUpdateResult = (
  tournament: Awaited<ReturnType<typeof getTournament>>
) => ({
  eventId: tournament.id ?? null,
  tournamentId: tournament._id
})

export const create = mutation({
  args: {
    id: v.string(),
    title: v.string(),
    venue: v.string(),
    eventDate: v.string(),
    gateOpenAt: v.number(),
    registrationFee: v.number(),
    slotsLimit: v.optional(v.number()),
    divisions: v.array(v.string()),
    description: v.optional(v.string()),
    ticketLogoStorageId: v.optional(v.id('_storage')),
    coverPhotoStorageId: v.optional(v.id('_storage')),
    published: v.boolean()
  },
  returns: v.id('tournaments'),
  handler: async (ctx, args) => {
    const id = trimRequired(args.id, 'Event slug')
    const existingTournament = await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', id))
      .unique()

    if (existingTournament) {
      throw new ConvexError('An event with this slug already exists.')
    }

    return await ctx.db.insert('tournaments', {
      id,
      title: trimRequired(args.title, 'Title'),
      venue: trimRequired(args.venue, 'Venue'),
      event_date: trimRequired(args.eventDate, 'Event date'),
      gate_open_at: args.gateOpenAt,
      gate_open: args.gateOpenAt,
      registration_fee: Math.max(0, Math.round(args.registrationFee)),
      registered_slots: 0,
      ...(args.slotsLimit == null ? {} : { slots_limit: Math.max(1, Math.round(args.slotsLimit)) }),
      divisions: args.divisions.length ? args.divisions : ['Open'],
      bank_details_text: 'Payment destination is configured in Admin Settings.',
      published: args.published,
      description: trimOptional(args.description),
      commission_type: 'flat',
      commission_value: 0,
      ...(args.ticketLogoStorageId ? { ticket_logo_url: args.ticketLogoStorageId } : {}),
      ...(args.coverPhotoStorageId ? { cover_photo_url: args.coverPhotoStorageId } : {}),
      ticket_primary_color: '#1d4ed8',
      ticket_secondary_color: '#0f172a'
    })
  }
})

export const generateAssetUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  }
})

export const updateSupport = mutation({
  args: {
    tournamentId: v.id('tournaments'),
    support: tournamentSchema.fields.support
  },
  returns: tournamentUpdateResult,
  handler: async (ctx, args) => {
    const tournament = await getTournament(ctx, args.tournamentId)
    const support = normalizeTournamentSupport(args.support)

    await ctx.db.patch(args.tournamentId, { support })

    return toTournamentUpdateResult(tournament)
  }
})

export const updateSponsorList = mutation({
  args: {
    tournamentId: v.id('tournaments'),
    sponsor_list: tournamentSchema.fields.sponsor_list
  },
  returns: tournamentUpdateResult,
  handler: async (ctx, args) => {
    const tournament = await getTournament(ctx, args.tournamentId)
    const sponsorList = args.sponsor_list?.map((sponsor, index) => {
      const sponsorLabel = `Sponsor ${index + 1}`
      const value = trimRequiredWithLimit(
        sponsor.value,
        `${sponsorLabel} value`,
        160
      )
      const label = trimOptionalWithLimit(
        sponsor.label,
        `${sponsorLabel} label`,
        160
      )
      const url = trimOptionalWithLimit(
        sponsor.url,
        `${sponsorLabel} URL`,
        2048
      )

      return {
        value,
        ...(label ? { label } : {}),
        ...(url ? { url } : {}),
        ...(sponsor.is_active === undefined
          ? {}
          : { is_active: sponsor.is_active })
      }
    })

    await ctx.db.patch(args.tournamentId, {
      sponsor_list: sponsorList?.length ? sponsorList : undefined
    })

    return toTournamentUpdateResult(tournament)
  }
})
