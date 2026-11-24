'use client'

import { Button } from '@/components/ui/button'
import { ConvexError } from 'convex/values'
import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'

export const selectClass = 'min-h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1.5 text-base focus-visible:outline-2 focus-visible:outline-ring md:text-sm'
export const textAreaClass = `${selectClass} min-h-20 resize-y`
export const linkClass = 'rounded-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-current'

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className='min-w-0 rounded-xl border border-border bg-card'>
      <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5'>
        <h2 className='text-base font-semibold'>{title}</h2>
        {action}
      </div>
      <div className='px-4 pb-4 sm:px-5 sm:pb-5'>{children}</div>
    </section>
  )
}

export function MetricGrid({ metrics }: { metrics: { label: string; value: ReactNode; detail?: string }[] }) {
  return (
    <dl className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4'>
      {metrics.map(({ label, value, detail }) => (
        <div key={label} className='min-w-0 bg-card p-3 sm:p-5'>
          <dt className='text-xs font-medium text-muted-foreground sm:text-sm'>{label}</dt>
          <dd className='mt-1 break-words font-poly text-lg tabular-nums sm:text-2xl'>{value}</dd>
          {detail ? <dd className='mt-1 text-xs text-muted-foreground'>{detail}</dd> : null}
        </div>
      ))}
    </dl>
  )
}

export function ReportMessage({ children }: { children: ReactNode }) {
  return <p role='status' className='rounded-xl border border-border px-4 py-5 text-sm text-muted-foreground'>{children}</p>
}

export function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const generatedId = useId()
  const id = children.props.id ?? generatedId
  return (
    <div className='grid min-w-0 content-start gap-1.5 text-sm font-medium'>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  )
}

export function useEditorFocus() {
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
  }, [])
  return form
}

export function FormStatus({ message, error }: { message: string; error?: boolean }) {
  return <p role={error ? 'alert' : 'status'} className={`min-h-5 text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{message}</p>
}

export function readableError(error: unknown) {
  return error instanceof ConvexError && typeof error.data === 'string'
    ? error.data
    : 'Unable to save. Check your connection and try again.'
}

export type Column<Row> = { label: string; value: (row: Row) => ReactNode; numeric?: boolean }

export function ReportTable<Row>({
  rows, columns, caption, empty, pageSize = 15
}: {
  rows: (Row & { id: string })[]
  columns: Column<Row>[]
  caption: string
  empty: string
  pageSize?: number
}) {
  const [page, setPage] = useState(0)
  const [overflows, setOverflows] = useState(false)
  const scrollRegion = useRef<HTMLDivElement>(null)
  const hasRows = rows.length > 0

  useEffect(() => {
    const region = scrollRegion.current
    const table = region?.querySelector('table')
    if (!region || !table) return

    const observer = new ResizeObserver(() => setOverflows(region.scrollWidth > region.clientWidth))
    observer.observe(region)
    observer.observe(table)
    return () => observer.disconnect()
  }, [hasRows])

  const pageCount = Math.ceil(rows.length / pageSize)
  const displayedPage = Math.min(page, Math.max(0, pageCount - 1))
  const start = displayedPage * pageSize

  if (!hasRows) return <p className='py-4 text-sm text-muted-foreground'>{empty}</p>

  return (
    <>
      <div ref={scrollRegion} role='region' aria-label={caption} tabIndex={overflows ? 0 : undefined} className='overflow-x-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-ring'>
        <table className='w-full border-collapse text-sm'>
          <caption className='sr-only'>{caption}</caption>
          <thead className='bg-muted/60 text-xs text-muted-foreground'>
            <tr>
              {columns.map((column) => (
                <th key={column.label} scope='col' className={`px-2 py-2.5 font-medium sm:whitespace-nowrap sm:px-3 ${column.numeric ? 'text-end' : 'text-start'}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(start, start + pageSize).map((row) => (
              <tr key={row.id} className='border-t border-border align-top'>
                {columns.map((column) => (
                  <td key={column.label} className={`break-words px-2 py-2 sm:min-w-20 sm:px-3 ${column.numeric ? 'whitespace-nowrap text-end tabular-nums' : ''}`}>
                    {column.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {overflows ? <p className='mt-1.5 text-xs text-muted-foreground'>Scroll for more columns</p> : null}
      {pageCount > 1 ? (
        <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
          <p role='status' className='text-xs tabular-nums text-muted-foreground'>{start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}</p>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' size='sm' disabled={displayedPage === 0} onClick={() => setPage(displayedPage - 1)}>Previous</Button>
            <Button type='button' variant='outline' size='sm' disabled={displayedPage + 1 >= pageCount} onClick={() => setPage(displayedPage + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
