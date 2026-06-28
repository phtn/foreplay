import type { Id } from '../_generated/dataModel'
import { query } from '../_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const paymentMethods = await ctx.db.query('paymentMethods').order('desc').collect()

    return await Promise.all(
      paymentMethods.map(async (paymentMethod) => ({
        ...paymentMethod,
        qrCodeImageUrl: paymentMethod.qrCodeStorageId
          ? await ctx.storage.getUrl(paymentMethod.qrCodeStorageId as Id<'_storage'>)
          : null
      }))
    )
  }
})

export const getActiveManual = query({
  args: {},
  handler: async (ctx) => {
    const paymentMethods = await ctx.db
      .query('paymentMethods')
      .withIndex('by_kind', (q) => q.eq('kind', 'manual'))
      .collect()
    const paymentMethod = paymentMethods.find((method) => method.isActive) ?? null

    if (!paymentMethod) {
      return null
    }

    return {
      ...paymentMethod,
      qrCodeImageUrl: paymentMethod.qrCodeStorageId
        ? await ctx.storage.getUrl(paymentMethod.qrCodeStorageId as Id<'_storage'>)
        : null
    }
  }
})
