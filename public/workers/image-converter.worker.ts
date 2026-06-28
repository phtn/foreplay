interface ConversionRequest {
  id: string
  file: Blob
  format: 'avif' | 'webp' | 'jpeg'
  quality?: number
}

interface ConversionResponse {
  id: string
  blob: Blob
  size: number
  format: string
}

interface ErrorResponse {
  id: string
  error: string
}

function isValidMessage(event: MessageEvent<unknown>): event is MessageEvent<ConversionRequest> {
  if (typeof self === 'undefined' || !self.postMessage) {
    return false
  }

  if (!event.data || typeof event.data !== 'object') {
    return false
  }

  const data = event.data as Partial<ConversionRequest>

  if (
    !data.id ||
    typeof data.id !== 'string' ||
    !data.file ||
    !(data.file instanceof Blob) ||
    !data.format ||
    !['avif', 'webp', 'jpeg'].includes(data.format)
  ) {
    return false
  }

  return data.quality === undefined || (typeof data.quality === 'number' && data.quality >= 0 && data.quality <= 1)
}

function getCandidateId(event: MessageEvent<unknown>) {
  if (event.data && typeof event.data === 'object' && 'id' in event.data) {
    const id = (event.data as { id?: unknown }).id
    return typeof id === 'string' ? id : 'unknown'
  }

  return 'unknown'
}

self.addEventListener('message', async (event: MessageEvent<unknown>) => {
  if (!isValidMessage(event)) {
    const errorResponse: ErrorResponse = {
      id: getCandidateId(event),
      error: 'Invalid image conversion request'
    }

    self.postMessage(errorResponse)
    return
  }

  const { file, format, id, quality = 0.8 } = event.data

  try {
    const imageBitmap = await createImageBitmap(file)
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      imageBitmap.close()
      throw new Error('Failed to get canvas context')
    }

    ctx.drawImage(imageBitmap, 0, 0)
    imageBitmap.close()

    const mimeType = `image/${format}`
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality
    })
    const response: ConversionResponse = {
      id,
      blob,
      size: blob.size,
      format: blob.type || mimeType
    }

    self.postMessage(response)
  } catch (error) {
    const errorResponse: ErrorResponse = {
      id,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }

    self.postMessage(errorResponse)
  }
})

export {}
