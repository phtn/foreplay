export const normalizeStateValue = (value) =>
  value.trim().toLowerCase().replace(/[\s-]+/g, '_')

export const encodeUriComponent = (value) => encodeURIComponent(value)

export const formIdSearchParams = (formId) => new URLSearchParams({ formId }).toString()
