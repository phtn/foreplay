import { v } from 'convex/values'

export const paymentMethodSchema = v.object({
  kind: v.literal('manual'),
  label: v.string(),
  bankOrEwallet: v.string(),
  accountName: v.string(),
  accountNumber: v.string(),
  qrCodeStorageId: v.optional(v.id('_storage')),
  qrCodeContent: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number()
})

export type PaymentMethod = typeof paymentMethodSchema
