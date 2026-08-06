import { query } from '../_generated/server'

export const list = query({
  handler: async ({ db }) => {
    const tones = await db.query('tones').collect()
    return tones
  }
})
