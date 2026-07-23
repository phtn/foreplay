import type { VisibilityState } from '@tanstack/react-table'

interface VisibilityAwareColumn {
  getIsVisible: () => boolean
  getSize: () => number
}

interface VisibilityAwareHeader {
  column: VisibilityAwareColumn
}

interface VisibilityAwareCell {
  column: VisibilityAwareColumn
}

interface VisibilityAwareRow<T extends VisibilityAwareCell> {
  getAllCells: () => readonly T[]
}

export const getVisibleHeaders = <T extends VisibilityAwareHeader>(headers: readonly T[]) =>
  headers.filter((header) => header.column.getIsVisible())

export const getVisibleRowCells = <T extends VisibilityAwareCell>(row: VisibilityAwareRow<T>) =>
  row.getAllCells().filter((cell) => cell.column.getIsVisible())

export const getVisibleColumnsSize = (columns: readonly VisibilityAwareColumn[]) =>
  columns.reduce((total, column) => total + column.getSize(), 0)

export const areVisibilityStatesEqual = (left: VisibilityState, right: VisibilityState) => {
  const leftHidden = Object.keys(left).filter((key) => left[key] === false)
  const rightHidden = Object.keys(right).filter((key) => right[key] === false)

  return leftHidden.length === rightHidden.length && leftHidden.every((key) => right[key] === false)
}

export const resolveColumnVisibilityUpdate = (
  current: VisibilityState,
  updater: VisibilityState | ((current: VisibilityState) => VisibilityState)
) => (typeof updater === 'function' ? updater(current) : updater)

export const reconcileColumnVisibility = (
  current: VisibilityState,
  incoming: VisibilityState,
  pending: VisibilityState | null
) => {
  if (pending && !areVisibilityStatesEqual(incoming, pending)) {
    return current
  }

  return areVisibilityStatesEqual(current, incoming) ? current : incoming
}
