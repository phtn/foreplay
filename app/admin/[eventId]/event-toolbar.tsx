import { createQRCodeSvg } from '@/components/qrcode/create-svg'
import type { Doc } from '@/convex/_generated/dataModel'

import { EventQrDrawer } from './event-qr-drawer'
import { EventSponsorsDrawer } from './event-sponsors-drawer'
import { EventSupportDrawer } from './event-support-drawer'

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
    <div className='flex items-center space-x-5 md:space-x-7'>
      <EventQrDrawer
        eventTitle={event.title}
        fileName={`${event.id}-tournament-qr.svg`}
        qrSvg={qrSvg}
        tournamentUrl={tournamentUrl}
      />
      <EventSponsorsDrawer eventTitle={event.title} sponsorList={event.sponsor_list} tournamentId={event._id} />
      <EventSupportDrawer eventTitle={event.title} support={event.support} tournamentId={event._id} />
    </div>
  )
}
