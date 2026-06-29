import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

const trimRequired = (value: string, label: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new ConvexError(`${label} is required.`)
  }

  return trimmed
}

export const generateQrCodeUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  }
})

export const upsertManual = mutation({
  args: {
    id: v.optional(v.id('paymentMethods')),
    bankOrEwallet: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    qrCodeStorageId: v.optional(v.id('_storage')),
    qrCodeContent: v.optional(v.string()),
    isActive: v.boolean()
  },
  returns: v.id('paymentMethods'),
  handler: async (ctx, args) => {
    const now = Date.now()
    const payload = {
      kind: 'manual' as const,
      label: 'Manual Payments',
      bankOrEwallet: trimRequired(args.bankOrEwallet, 'Bank name or EWallet'),
      accountName: trimRequired(args.accountName, 'Account name'),
      accountNumber: trimRequired(args.accountNumber, 'Account number'),
      qrCodeContent: args.qrCodeContent?.trim() || undefined,
      isActive: args.isActive,
      updatedAt: now
    }

    if (payload.isActive && !payload.qrCodeContent) {
      throw new ConvexError('QR code content is required before activating this payment destination.')
    }

    if (args.isActive) {
      const activeManualPaymentMethods = await ctx.db
        .query('paymentMethods')
        .withIndex('by_kind', (q) => q.eq('kind', 'manual'))
        .collect()

      await Promise.all(
        activeManualPaymentMethods
          .filter((paymentMethod) => paymentMethod._id !== args.id && paymentMethod.isActive)
          .map((paymentMethod) =>
            ctx.db.patch(paymentMethod._id, {
              isActive: false,
              updatedAt: now
            })
          )
      )
    }

    if (args.id) {
      const existingPaymentMethod = await ctx.db.get(args.id)

      if (!existingPaymentMethod) {
        throw new ConvexError('Payment method not found.')
      }

      await ctx.db.patch(args.id, {
        ...payload,
        ...(args.qrCodeStorageId ? { qrCodeStorageId: args.qrCodeStorageId } : {})
      })

      return args.id
    }

    return await ctx.db.insert('paymentMethods', {
      ...payload,
      ...(args.qrCodeStorageId ? { qrCodeStorageId: args.qrCodeStorageId } : {}),
      createdAt: now
    })
  }
})
