import type { Infer } from 'convex/values'
import type { financialSummary } from './d'

export function hasFinanceExceptions(summary: Infer<typeof financialSummary>) {
  return Boolean(
    summary.unmatchedCount || summary.paidWithoutMatch || summary.paidWithoutAmount ||
    summary.outstandingIn || summary.outstandingOut || summary.entryBalance || summary.sponsorBalance ||
    summary.prizeBalance || summary.entryOverpayment || summary.sponsorOverpayment || summary.prizeOverpayment
  )
}
