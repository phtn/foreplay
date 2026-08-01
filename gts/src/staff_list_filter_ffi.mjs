export const normalizeSearchValue = (value) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')

export const compareSubjects = (left, right) => left.localeCompare(right)
