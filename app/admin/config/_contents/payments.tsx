import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchQuery } from 'convex/nextjs'
import { PaymentsForm } from './payments-form'

export type ManualPaymentMethod = Doc<'paymentMethods'> & {
  _id: Id<'paymentMethods'>
  qrCodeImageUrl: string | null
}

export const PaymentsContent = async () => {
  await requireAdminSession()

  const paymentMethods = await fetchQuery(api.paymentMethods.q.list)
  const manualPaymentMethods = paymentMethods.filter((paymentMethod) => paymentMethod.kind === 'manual')

  return <PaymentsForm paymentMethods={manualPaymentMethods} />
}
