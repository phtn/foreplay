const MODERN_COLOR_FUNCTION = /(?:color-mix|lab|lch|oklab|oklch)\(/i

const colorProperties = [
  'accent-color',
  'background-color',
  'border-block-end-color',
  'border-block-start-color',
  'border-bottom-color',
  'border-inline-end-color',
  'border-inline-start-color',
  'border-left-color',
  'border-right-color',
  'border-top-color',
  'caret-color',
  'color',
  'column-rule-color',
  'fill',
  'outline-color',
  'stroke',
  'text-decoration-color'
] as const

function createColorResolver(documentRef: Document) {
  const canvas = documentRef.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const cache = new Map<string, string>()

  canvas.width = 1
  canvas.height = 1

  return (color: string) => {
    const cached = cache.get(color)
    if (cached) {
      return cached
    }

    if (!context) {
      return 'rgba(0, 0, 0, 1)'
    }

    context.clearRect(0, 0, 1, 1)
    context.fillStyle = 'rgba(0, 0, 0, 0)'
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)

    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
    const resolved = `rgba(${red}, ${green}, ${blue}, ${Number((alpha / 255).toFixed(3))})`
    cache.set(color, resolved)
    return resolved
  }
}

function normalizeExportColors(root: HTMLElement, clonedDocument: Document) {
  const resolveColor = createColorResolver(clonedDocument)
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement | SVGElement>('*'))]
  const view = clonedDocument.defaultView

  if (!view) {
    return
  }

  for (const element of elements) {
    const computedStyle = view.getComputedStyle(element)
    const inlineStyle = element.style

    for (const property of colorProperties) {
      const value = computedStyle.getPropertyValue(property)
      if (MODERN_COLOR_FUNCTION.test(value)) {
        inlineStyle.setProperty(property, resolveColor(value))
      }
    }

    for (const property of ['background-image', 'box-shadow', 'filter', 'text-shadow'] as const) {
      const value = computedStyle.getPropertyValue(property)
      if (MODERN_COLOR_FUNCTION.test(value)) {
        inlineStyle.setProperty(property, 'none')
      }
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Unable to create the ticket PNG.'))
      }
    }, 'image/png')
  })
}

export function createPngFilename(label: string, fallback = 'ticket') {
  const normalized = label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const normalizedFallback = fallback.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  return `${normalized || normalizedFallback || 'ticket'}.png`
}

export async function downloadElementAsPng(element: HTMLElement, filename: string) {
  await document.fonts?.ready
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  const { default: html2canvas } = await import('html2canvas')
  const exportWidth = Math.max(element.scrollWidth, 1)
  const exportHeight = Math.max(element.scrollHeight, 1)
  const dimensionScale = 16_000 / Math.max(exportWidth, exportHeight)
  const areaScale = Math.sqrt(64_000_000 / (exportWidth * exportHeight))
  const exportScale = Math.min(2, window.devicePixelRatio || 1, dimensionScale, areaScale)
  const canvas = await html2canvas(element, {
    allowTaint: false,
    backgroundColor: '#ffffff',
    ignoreElements: (candidate) => candidate.hasAttribute('data-ticket-export-ignore'),
    logging: false,
    onclone: (clonedDocument, clonedElement) => {
      normalizeExportColors(clonedElement, clonedDocument)
    },
    scale: exportScale,
    useCORS: true
  })
  const blob = await canvasToBlob(canvas)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.download = filename
  link.href = url
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
