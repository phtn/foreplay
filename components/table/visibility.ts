interface VisibilityAwareColumn {
  getIsVisible: () => boolean
  getSize: () => number
}

interface VisibilityAwareHeader {
  column: VisibilityAwareColumn
}

export const getVisibleHeaders = <T extends VisibilityAwareHeader>(headers: readonly T[]) =>
  headers.filter((header) => header.column.getIsVisible())

export const getVisibleColumnsSize = (columns: readonly VisibilityAwareColumn[]) =>
  columns.reduce((total, column) => total + column.getSize(), 0)
