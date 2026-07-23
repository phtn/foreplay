import type { VisibilityState } from '@tanstack/react-table'

export const RETAINED_COLUMN_MODEL_VISIBILITY: VisibilityState = Object.freeze({})

interface VisibilityAwareColumn {
  getIsVisible: () => boolean
  getSize: () => number
}

export const isColumnVisible = (columnId: string, columnVisibility: VisibilityState) =>
  columnVisibility[columnId] !== false

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
