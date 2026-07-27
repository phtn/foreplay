import type { jsPDF as JsPdfDocument } from 'jspdf'

import type { PairingTableRow } from './pairings-table'

interface PairingsExportOptions {
  eventId: string
  eventTitle: string
  rows: PairingTableRow[]
}

const exportDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

const CSV_HEADERS = ['No.', 'Player', 'Checked in', 'Start hole', 'Group', 'Color'] as const
const PDF_HEADERS = [...CSV_HEADERS]

const colorByGroup: Record<PairingTableRow['pairingGroup'], string> = {
  A: 'Emerald',
  B: 'Orange',
  C: 'Indigo'
}

const escapeCsvCell = (value: string | number) => {
  const text = String(value)
  const formulaSafeText =
    typeof value === 'string' && /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text

  return `"${formulaSafeText.replaceAll('"', '""')}"`
}

const normalizePdfText = (value: string) =>
  value
    .replaceAll(/[‐‑‒–—−]/g, '-')
    .replaceAll(/[‘’]/g, "'")
    .replaceAll(/[“”]/g, '"')
    .replaceAll('…', '...')
    .replaceAll(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '?')

const getExportRow = (row: PairingTableRow): Array<string | number> => [
  row.position,
  row.playerName,
  row.checkedInStatus,
  row.startHole || 'Unassigned',
  row.pairingGroup,
  colorByGroup[row.pairingGroup]
]

export function createPairingsCsv(rows: PairingTableRow[]) {
  const lines = [
    CSV_HEADERS.map(escapeCsvCell).join(','),
    ...rows.map((row) => getExportRow(row).map(escapeCsvCell).join(','))
  ]

  return `\uFEFF${lines.join('\r\n')}`
}

export function createPairingsExportFileName(eventId: string, extension: 'csv' | 'pdf') {
  const safeEventId =
    eventId
      .trim()
      .replaceAll(/[^a-zA-Z0-9_-]+/g, '-')
      .replaceAll(/^-+|-+$/g, '') || 'tournament'
  const dateStamp = new Date().toISOString().slice(0, 10)

  return `${safeEventId}-pairings-${dateStamp}.${extension}`
}

export async function createPairingsPdf({
  eventId,
  eventTitle,
  rows
}: PairingsExportOptions): Promise<JsPdfDocument> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const document = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'portrait',
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
    subject: 'Filtered tournament pairings export',
    title: `${eventTitle} pairings`
  })

  autoTable(document, {
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    body: rows.map((row) => getExportRow(row).map((value) => normalizePdfText(String(value)))),
    bodyStyles: {
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 33, halign: 'center' }
    },
    head: [PDF_HEADERS],
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
      cellPadding: 2,
      font: 'helvetica',
      fontSize: 8,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      minCellHeight: 8,
      overflow: 'linebreak',
      valign: 'middle'
    },
    theme: 'grid',
    willDrawPage: () => {
      document.setFont('helvetica', 'bold')
      document.setFontSize(12)
      document.setTextColor(15, 23, 42)
      document.text(normalizePdfText(`${eventTitle} Pairings`), marginX, 9)

      document.setFont('helvetica', 'normal')
      document.setFontSize(7)
      document.setTextColor(71, 85, 105)
      document.text(
        normalizePdfText(`${rows.length} pairings | Event ${eventId} | Generated ${generatedAt}`),
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
