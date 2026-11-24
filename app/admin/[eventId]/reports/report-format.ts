import type { api } from '@/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'

export type OperationsData = FunctionReturnType<typeof api.tournamentReports.q.operations>
export type FinanceData = FunctionReturnType<typeof api.tournamentReports.q.finance>
export type ItemsData = FunctionReturnType<typeof api.tournamentReports.q.items>
export type Closeout = FunctionReturnType<typeof api.tournamentReports.q.closeout>

export const entryTypes = {
  standard: 'Standard', vip: 'VIP', complimentary: 'Complimentary', non_playing: 'Non-playing guest'
} as const

export const transactionKinds = {
  entry_payment: 'Entry payment', sponsorship: 'Sponsorship', other_income: 'Other income',
  refund: 'Refund', fee: 'Fee', expense: 'Expense', commission: 'Commission', prize: 'Prize'
} as const

export const transactionStatuses = {
  unmatched: 'Unmatched', outstanding: 'Outstanding', reconciled: 'Reconciled', void: 'Voided'
} as const

export const channels = { bank: 'Bank transfer', ewallet: 'E-wallet', cash: 'Cash', other: 'Other' } as const

export const readable = (value: string) => value
  .replaceAll('_', ' ')
  .replace(/^./, (first) => first.toUpperCase())

export const entryTypeLabel = (type: string) => entryTypes[type as keyof typeof entryTypes] ?? readable(type)

const moneyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const reportDateFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' })
export const money = (minor: number | null) => minor === null ? '—' : moneyFormatter.format(minor / 100)
export const reportDate = (timestamp: number | null) => timestamp === null || !Number.isFinite(timestamp) || Math.abs(timestamp) > 8.64e15 ? '—' : reportDateFormatter.format(timestamp)
export const decimal = (minor: number | null | undefined) => minor == null ? '' : (minor / 100).toFixed(2)

export function parseAmount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(value.trim())) {
    throw new Error('Enter an amount with up to two decimal places.')
  }
  const [pesos, cents = ''] = value.trim().split('.')
  return Number(pesos) * 100 + Number(cents.padEnd(2, '0'))
}

export const formText = (form: FormData, field: string) => String(form.get(field) ?? '').trim()
export const optionalText = (form: FormData, field: string) => formText(form, field) || undefined

export function manilaCutoff(dateTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) return NaN
  const timestamp = Date.parse(`${dateTime}:00+08:00`)
  if (!Number.isFinite(timestamp)) return NaN
  const roundTrip = new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
  return dateTime === roundTrip ? timestamp : NaN
}
