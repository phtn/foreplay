'use client'

import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'

type VenueCoordinates = {
  latitude: number
  longitude: number
}

type MapButtonProps = {
  coordinates: VenueCoordinates
  venue: string
  className?: ClassName
}

const isIOS = () => {
  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform

  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

const isAndroid = () => /Android/.test(window.navigator.userAgent)

const buildMapUrl = ({ coordinates, venue }: MapButtonProps) => {
  const { latitude, longitude } = coordinates
  const label = encodeURIComponent(venue)
  const query = `${latitude},${longitude}`

  if (isIOS()) {
    return `https://maps.apple.com/?ll=${query}&q=${label}`
  }

  if (isAndroid()) {
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export function MapButton({ coordinates, venue, className }: MapButtonProps) {
  const openMap = () => {
    window.open(buildMapUrl({ coordinates, venue }), '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type='button'
      aria-label={`Open ${venue} in maps`}
      className='text-sky-500 hover:text-sky-600'
      onClick={openMap}>
      <Icon name='navigation-fill' className={cn('size-4', className)} />
    </button>
  )
}
