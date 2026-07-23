'use client'

import { ClassName } from '@/types'
import { useMemo } from 'react'
import { createQRCodeSvg, type QRCodeOptions } from './create-svg'

export { createQRCodeSvg, type QRCodeOptions }

interface QRCodeSVGProps {
  options: QRCodeOptions
  className?: ClassName
}

export const QRCodeSVG = ({ options, className }: QRCodeSVGProps) => {
  const svgString = useMemo(() => createQRCodeSvg(options), [options])

  return <div className={className} dangerouslySetInnerHTML={{ __html: svgString }} />
}

// Hook to get QR code SVG data for downloading/printing
export const useQRCodeSVG = ({ options }: { options: QRCodeOptions }) => {
  return useMemo(() => createQRCodeSvg(options), [options])
}
