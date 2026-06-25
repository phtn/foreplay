'use server'

import { api } from '@/convex/_generated/api'
import { requireGateScannerSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'

export async function checkInGatePass(payload: string) {
  await requireGateScannerSession()

  if (!payload.trim()) {
    throw new Error('QR payload is required.')
  }

  return await fetchMutation(api.registrations.m.checkInByGatePassPayload, {
    payload
  })
}
