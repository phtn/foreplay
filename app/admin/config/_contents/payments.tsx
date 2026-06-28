import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import { PaymentsForm } from './payments-form'

export type ManualPaymentMethod = {
  _id: Id<'paymentMethods'>
  bankOrEwallet: string
  accountName: string
  accountNumber: string
  qrCodeContent?: string
  qrCodeImageUrl: string | null
  isActive?: boolean
}

export const PaymentsContent = async () => {
  await requireAdminSession()

  const paymentMethods = await fetchQuery(api.paymentMethods.q.list)
  const manualPaymentMethod = paymentMethods.find((paymentMethod) => paymentMethod.kind === 'manual') ?? null

  return <PaymentsForm paymentMethod={manualPaymentMethod} />
}
