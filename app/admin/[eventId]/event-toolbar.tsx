import { createQRCodeSvg } from '@/components/qrcode/create-svg'
import type { Doc } from '@/convex/_generated/dataModel'

import { Icon } from '@/lib/icons'
import { EventQrDrawer } from './event-qr-drawer'

interface EventToolbarProps {
  event: Doc<'tournaments'>
}

const FOREPLAY_ORIGIN = 'https://foreplay.pro'

export const EventToolbar = ({ event }: EventToolbarProps) => {
  if (!event.id) {
    return null
  }

  const tournamentUrl = `${FOREPLAY_ORIGIN}/tournaments/${encodeURIComponent(event.id)}`
  const qrSvg = createQRCodeSvg({
    container: 'svg-viewbox',
    content: tournamentUrl,
    ecl: 'H',
    height: 720,
    join: true,
    padding: 4,
    pretty: false,
    width: 720
  })

  return (
    <div className='flex items-center space-x-2 md:space-x-4'>
      <EventQrDrawer
        eventTitle={event.title}
        fileName={`${event.id}-tournament-qr.svg`}
        qrSvg={qrSvg}
        tournamentUrl={tournamentUrl}
      />
      <Icon name='service' className='size-4' />
      <Icon name='heart-hand' className='size-4' />
    </div>
  )
}
