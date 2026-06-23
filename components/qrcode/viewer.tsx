'use client'

import { ClassName } from '@/types'
import QRCode, { type Options } from 'qrcode-svg'
import { useMemo } from 'react'

export type QRCodeOptions = Options

export const createQRCodeSvg = (options: Options) => {
  const code = new QRCode({
    ...options,
    padding: options.padding ?? 4,
    ecl: options.ecl ?? 'M',
    content: options.content,
    width: options.width ?? 280,
    height: options.height ?? 280,
    background: options.background ?? '#ffffff',
    color: options.color ?? '#12121a',
    xmlDeclaration: options.xmlDeclaration ?? false
  })

  return code.svg()
}

interface QRCodeSVGProps {
  options: Options
  className?: ClassName
}

export const QRCodeSVG = ({ options, className }: QRCodeSVGProps) => {
  const svgString = useMemo(() => createQRCodeSvg(options), [options])

  return <div className={className} dangerouslySetInnerHTML={{ __html: svgString }} />
}

// Hook to get QR code SVG data for downloading/printing
export const useQRCodeSVG = ({ options }: { options: Options }) => {
  return useMemo(() => createQRCodeSvg(options), [options])
}
