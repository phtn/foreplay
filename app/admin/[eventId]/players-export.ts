import type { jsPDF as JsPdfDocument } from 'jspdf'

import { formatStatus } from '@/utils/formatters'
import type { EventSubscriptionTableRow } from './players-data-table'

interface PlayersExportOptions {
  eventId: string
  eventTitle: string
  rows: EventSubscriptionTableRow[]
}

const exportDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

const amountFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 2
})

const CSV_HEADERS = [
  'Reference',
  'Created',
  'Player',
  'Email',
  'Total players',
  'Checked in',
  'Amount',
  'Payment status',
  'Entry status',
  'Confirmed by',
  'Confirmed at',
  'Remarks',
  'Receipt URL',
  'Ticket count'
] as const

const PDF_HEADERS = [
  'Reference',
  'Created',
  'Player',
  'Email',
  'Entries',
  'Amount',
  'Payment',
  'Entry status',
  'Confirmation',
  'Remarks'
] as const

const formatExportDate = (timestamp: number | null) =>
  timestamp !== null && Number.isFinite(timestamp) ? exportDateTimeFormatter.format(timestamp) : ''

const escapeCsvCell = (value: string | number | null) => {
  const text = value === null ? '' : String(value)
  const formulaSafeText = typeof value === 'string' && /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text

  return `"${formulaSafeText.replaceAll('"', '""')}"`
}

const normalizePdfText = (value: string) =>
  value
    .replaceAll(/[‐‑‒–—−]/g, '-')
    .replaceAll(/[‘’]/g, "'")
    .replaceAll(/[“”]/g, '"')
    .replaceAll('…', '...')
    .replaceAll(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '?')

const getCsvRow = (row: EventSubscriptionTableRow): Array<string | number | null> => [
  row.reference,
  formatExportDate(row.createdAt),
  row.teamName,
  row.contactEmail,
  row.totalPlayers,
  row.totalCheckedIn,
  row.paymentAmount,
  formatStatus(row.paymentStatus),
  formatStatus(row.subscriptionStatus),
  row.confirmer,
  formatExportDate(row.confirmedAt),
  row.adminRemarks,
  row.receiptUrl,
  row.tickets.length
]

const getPdfRow = (row: EventSubscriptionTableRow): string[] =>
  [
    row.reference,
    formatExportDate(row.createdAt),
    row.teamName,
    row.contactEmail ?? '',
    `${row.totalCheckedIn}/${row.totalPlayers}`,
    row.paymentAmount === null ? '' : `PHP ${amountFormatter.format(row.paymentAmount)}`,
    formatStatus(row.paymentStatus),
    formatStatus(row.subscriptionStatus),
    [row.confirmer, formatExportDate(row.confirmedAt)].filter(Boolean).join('\n'),
    row.adminRemarks
  ].map(normalizePdfText)

export function createPlayersCsv(rows: EventSubscriptionTableRow[]) {
  const lines = [
    CSV_HEADERS.map(escapeCsvCell).join(','),
    ...rows.map((row) => getCsvRow(row).map(escapeCsvCell).join(','))
  ]

  return `\uFEFF${lines.join('\r\n')}`
}

export function createPlayersExportFileName(eventId: string, extension: 'csv' | 'pdf') {
  const safeEventId =
    eventId
      .trim()
      .replaceAll(/[^a-zA-Z0-9_-]+/g, '-')
      .replaceAll(/^-+|-+$/g, '') || 'tournament'
  const dateStamp = new Date().toISOString().slice(0, 10)

  return `${safeEventId}-players-${dateStamp}.${extension}`
}

export async function createPlayersPdf({ eventId, eventTitle, rows }: PlayersExportOptions): Promise<JsPdfDocument> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const document = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'landscape',
    putOnlyUsedFonts: true,
    unit: 'mm'
  })
  const generatedAt = exportDateTimeFormatter.format(new Date())
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const marginX = 10

  document.setProperties({
    author: 'Foreplay PRO',
    creator: 'Foreplay PRO',
    subject: 'Filtered tournament player export',
    title: `${eventTitle} Players`
  })

  autoTable(document, {
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    body: rows.map(getPdfRow),
    bodyStyles: {
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 21 },
      1: { cellWidth: 24 },
      2: { cellWidth: 33 },
      3: { cellWidth: 41 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 21, halign: 'right' },
      6: { cellWidth: 20 },
      7: { cellWidth: 23 },
      8: { cellWidth: 40 },
      9: { cellWidth: 39 }
    },
    head: [[...PDF_HEADERS]],
    headStyles: {
      fillColor: [15, 23, 42],
      fontStyle: 'bold',
      textColor: [255, 255, 255]
    },
    margin: {
      bottom: 13,
      left: marginX,
      right: marginX,
      top: 22
    },
    rowPageBreak: 'avoid',
    showHead: 'everyPage',
    startY: 22,
    styles: {
      cellPadding: 1.8,
      font: 'helvetica',
      fontSize: 6.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      minCellHeight: 7,
      overflow: 'linebreak',
      valign: 'middle'
    },
    theme: 'grid',
    willDrawPage: () => {
      document.setFont('helvetica', 'bold')
      document.setFontSize(12)
      document.setTextColor(15, 23, 42)
      document.text(normalizePdfText(eventTitle), marginX, 9)

      document.setFont('helvetica', 'normal')
      document.setFontSize(7)
      document.setTextColor(71, 85, 105)
      document.text(
        normalizePdfText(`${rows.length} records | Event ${eventId} | Generated ${generatedAt}`),
        marginX,
        15
      )
    }
  })

  const pageCount = document.getNumberOfPages()

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    document.setPage(pageNumber)
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    document.setTextColor(100, 116, 139)
    document.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - marginX, pageHeight - 6, { align: 'right' })
  }

  return document
}
