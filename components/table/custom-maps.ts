const startHoleMap: Record<number, string> = {
  1: 'Hole 1',
  2: 'Hole 2',
  3: 'Hole 3',
  4: 'Hole 4',
  5: 'Hole 5',
  6: 'Hole 6',
  7: 'Hole 7',
  8: 'Hole 8',
  9: 'Hole 9',
  10: 'Hole 10',
  11: 'Hole 11',
  12: 'Hole 12',
  13: 'Hole 13',
  14: 'Hole 14',
  15: 'Hole 15',
  16: 'Hole 16',
  17: 'Hole 17',
  18: 'Hole 18'
}

const colorMap: Record<string, string> = {
  indigo: 'Indigo',
  emerald: 'Emerald',
  orange: 'Orange'
}
const groupMap: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C'
}
const checkedInMap: Record<string, string> = {
  Yes: 'Yes',
  No: 'No'
}

export const smap: Record<string, string> = {
  confirmed: 'Confirmed',
  paid: 'Paid',
  failed: 'Failed',
  pending: 'Pending',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
  for_testing: 'For Testing',
  payment_review: 'Payment Review',
  pending_payment: 'Pending Payment',
  ...startHoleMap,
  ...colorMap,
  ...groupMap,
  ...checkedInMap
}
