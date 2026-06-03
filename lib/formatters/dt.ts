export const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'N/A'
  }
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
