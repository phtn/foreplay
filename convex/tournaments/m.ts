import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

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
