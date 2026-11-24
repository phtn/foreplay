import {
  channels, decimal, entryTypeLabel, readable, reportDate, transactionKinds, transactionStatuses,
  type Closeout, type FinanceData, type OperationsData
} from './report-format'

type Cell = string | number | null | undefined

function csvCell(value: Cell) {
  const text = String(value ?? '')
  const safe = typeof value === 'string' && /^(?:[\s\u200b-\u200d\ufeff]*[=+\-@]|[\t\r\n])/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function createReportCsv(headers: string[], rows: Cell[][]) {
  return '\uFEFF' + [headers, ...rows].map((cells) => cells.map(csvCell).join(',')).join('\r\n')
}

export function downloadCsv(name: string, headers: string[], rows: Cell[][]) {
  const blob = new Blob([createReportCsv(headers, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name.replaceAll(/[^a-zA-Z0-9_.-]/g, '-') + '.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportEntries(name: string, rows: OperationsData['entries']) {
  downloadCsv(name, ['Entry reference', 'Entry', 'Type', 'Status', 'Payment status', 'Requested players', 'Has receipt', 'Created (Manila)'],
    rows.map((row) => [row.reference, row.team, entryTypeLabel(row.entryType), readable(row.status),
      readable(row.paymentStatus), row.requestedPlayers, row.hasReceipt ? 'Yes' : 'No', reportDate(row.createdAt)]))
}

export function exportRoster(name: string, rows: OperationsData['roster']) {
  downloadCsv(name, ['Name', 'Type', 'Division', 'Eligible', 'Attendance', 'Checked in (Manila)', 'Hole', 'Group'],
    rows.map((row) => [row.name, entryTypeLabel(row.entryType), row.division, row.eligibility ? 'Yes' : 'No',
      readable(row.attendance), row.checkedInAt === null ? '' : reportDate(row.checkedInAt), row.hole, row.group]))
}

export function exportTransactions(name: string, rows: FinanceData['transactions']) {
  downloadCsv(name, ['Transaction ID', 'Type', 'State', 'Amount (PHP)', 'Description', 'Entry', 'Commitment',
    'Transaction date (Manila)', 'Channel', 'Account', 'External reference', 'Statement line ID', 'Reviewer', 'Reviewed (Manila)', 'Duplicate reference'],
  rows.map((row) => [row.id, transactionKinds[row.kind], transactionStatuses[row.status], decimal(row.amountMinor),
    row.description, row.entryLabel, row.itemLabel, row.occurredOn, row.channel ? channels[row.channel] : '',
    row.accountLabel, row.externalReference, row.evidence, row.reviewer, reportDate(row.updatedAt), row.duplicateReference ? 'Yes' : 'No']))
}

export function exportBalances(name: string, entries: FinanceData['entries'], commitments: FinanceData['commitments']) {
  downloadCsv(name, ['Type', 'Label', 'Expected (PHP)', 'Collected or paid (PHP)', 'Balance (PHP)', 'Status'], [
    ...entries.map((row) => ['Entry', row.label, decimal(row.expected), decimal(row.collected), decimal(row.balance), row.markedPaid ? 'Marked paid' : 'Pending']),
    ...commitments.map((row) => [readable(row.kind), row.title, decimal(row.amountMinor),
      row.kind === 'budget' ? '' : decimal(row.reconciled), row.kind === 'budget' ? '' : decimal(row.balance), readable(row.status)])
  ])
}

export function exportSponsor(name: string, event: Closeout, sponsor: Closeout['items'][number]) {
  const { summary } = event.operations
  downloadCsv(name, ['Tournament', 'Version', 'Sponsor', 'Commitment status', 'In-kind contribution', 'Sponsor benefits', 'Players checked in', 'Guests checked in'],
    [[event.eventTitle, event.version, sponsor.title, readable(sponsor.status), sponsor.inKind, sponsor.deliverables, summary.playersCheckedIn, summary.guestsCheckedIn]])
}

export function exportFollowUps(name: string, rows: Closeout['items']) {
  downloadCsv(name, ['Type', 'Title', 'Status', 'Owner', 'Due date', 'In-kind contribution', 'Sponsor benefits', 'Internal notes'],
    rows.map((row) => [readable(row.kind), row.title, readable(row.status), row.owner, row.dueOn, row.inKind, row.deliverables, row.notes]))
}

export async function exportCloseoutPdf(name: string, report: Closeout) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const document = new jsPDF({ compress: true })
  const { summary, awards, divisions, entryTypes } = report.operations
  const asPdf = (text: string) => text.replaceAll(/[’‘]/g, "'").replaceAll(/[“”]/g, '"').replaceAll(/[–—]/g, '-').replaceAll(/[^\x20-\x7e\u00a0-\u00ff\n]/g, '?')

  document.setProperties({ title: `${report.eventTitle} | Closeout v${report.version}` })
  const sponsorOrPrize = report.items.filter((row) => row.kind === 'sponsor' || row.kind === 'prize')
  const sections: [string, Cell[][]][] = [
    ['Attendance', [
      ['Eligible players', summary.players], ['Players checked in', summary.playersCheckedIn],
      ['Player no-shows', summary.noShows], ['Eligible guests', summary.guests], ['Guests checked in', summary.guestsCheckedIn],
      ['Undated check-ins', summary.undatedCheckIns], ['Check-ins outside the eligible roster', summary.inactiveCheckIns],
      ['Cancelled entries', summary.cancelled]
    ]],
    ['Attendance by division', divisions.map((row) => [row.label, `${row.playersCheckedIn} of ${row.players} checked in`])],
    ['Attendance by entry type', entryTypes.map((row) => [entryTypeLabel(row.label),
      `${row.playersCheckedIn + row.guestsCheckedIn} of ${row.players + row.guests} checked in`])],
    ['Results and awards', awards.map((row) => [`${row.title} (${row.position})`, row.winner ?? 'Unassigned'])],
    ['Sponsorship and prizes', sponsorOrPrize.map((row) => [row.title, readable(row.status)])]
  ]
  if (report.finance) {
    const finance = report.finance
    sections.push(['Accounting (PHP)', [
      ['Expected entry fees', decimal(finance.expected)], ['Entry fees reconciled', decimal(finance.entryCollected)],
      ['Sponsor collections', decimal(finance.sponsorCollected)], ['Other collections', decimal(finance.otherCollected)],
      ['Reconciled inflows', decimal(finance.reconciledIn)], ['Reconciled outflows', decimal(finance.reconciledOut)],
      ['Expenses paid', decimal(finance.expensesPaid)], ['Fees paid', decimal(finance.feesPaid)],
      ['Refunds paid', decimal(finance.refundsPaid)], ['Commissions paid', decimal(finance.commissionsPaid)],
      ['Prizes paid', decimal(finance.prizesPaid)], ['Cash surplus / shortfall', decimal(finance.cashBalance)],
      ['Entry balances', decimal(finance.entryBalance)], ['Sponsor balances', decimal(finance.sponsorBalance)],
      ['Prize commitments remaining', decimal(finance.prizeBalance)],
      ['Entry overpayments', decimal(finance.entryOverpayment)], ['Sponsor overpayments', decimal(finance.sponsorOverpayment)],
      ['Prize overpayments', decimal(finance.prizeOverpayment)],
      ['Other outstanding inflows', decimal(finance.outstandingIn)], ['Outstanding outflows', decimal(finance.outstandingOut)],
      ['Refunds due (included in outstanding outflows)', decimal(finance.refundsDue)], ['Unmatched statement lines', finance.unmatchedCount],
      ['Unmatched inflows', decimal(finance.unmatchedIn)], ['Unmatched outflows', decimal(finance.unmatchedOut)],
      ['Entry amounts marked paid without a match', decimal(finance.paidWithoutMatch)],
      ...(finance.budget === null ? [] : [
        ['Approved cash outflow budget', decimal(finance.budget)],
        ['Budget less reconciled outflows', decimal(finance.budget - finance.reconciledOut)]
      ])
    ]])
  }

  autoTable(document, {
    head: [[asPdf(report.eventTitle), `Closeout v${report.version}`]],
    body: [
      ['Event', [report.eventDate, report.venue].filter(Boolean).join(' / ')],
      ['Gate cutoff (Manila)', reportDate(report.cutoff)],
      ['Operations approval', `${report.operationsApprover} / ${reportDate(report.operationsApprovedAt)}`],
      ['Finance approval', `${report.financeApprover ?? 'Pending'} / ${reportDate(report.financeApprovedAt)}`],
      ...sections.flatMap(([label, values]) => values.length ? [[label, ''], ...values] : [])
    ].map((row) => row.map((cell) => asPdf(String(cell ?? '')))),
    columnStyles: { 0: { cellWidth: 75 } },
    styles: { fontSize: 9, overflow: 'linebreak' },
    headStyles: { fillColor: [31, 41, 55] },
    rowPageBreak: 'avoid'
  })

  document.save(name.replaceAll(/[^a-zA-Z0-9_.-]/g, '-') + '.pdf')
}
