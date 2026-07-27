export const statusStyles: Record<string, string> = {
  pending_payment: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  payment_review: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-destructive/10 text-destructive'
}

export type MetricTone = 'amber' | 'emerald' | 'sky' | 'violet'
export const metricToneStyles: Record<MetricTone, string> = {
  amber: '_bg-amber-500/10 text-orange-700 dark:text-orange-300',
  emerald: '_bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  sky: '_bg-sky-500/10 text-sky-700 dark:text-sky-300',
  violet: '_bg-violet-500/10 text-violet-700 dark:text-violet-300'
}
