'use client'

import { createQRCodeSvg, type QRCodeOptions } from './create-svg'

const canvasToPngBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Unable to create the QR code PNG.'))
    }, 'image/png')
  })

const loadSvgImage = (svg: string) => {
  const sourceBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const sourceUrl = URL.createObjectURL(sourceBlob)
  const image = new window.Image()

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl)
      reject(new Error('Unable to render the QR code.'))
    }
    image.src = sourceUrl
  })
}

export const createQRCodePngBlob = async (options: QRCodeOptions) => {
  const width = Math.max(1, Math.round(options.width ?? 280))
  const height = Math.max(1, Math.round(options.height ?? 280))
  const svg = createQRCodeSvg({ ...options, width, height })
  const image = await loadSvgImage(svg)
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to prepare the QR code download.')
  }

  context.fillStyle = options.background ?? '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return await canvasToPngBlob(canvas)
}

export const downloadQRCodePng = async (options: QRCodeOptions, filename: string) => {
  const png = await createQRCodePngBlob(options)
  const downloadUrl = URL.createObjectURL(png)
  const link = document.createElement('a')

  try {
    link.href = downloadUrl
    link.download = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`
    link.hidden = true
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
  }
}
