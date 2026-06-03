import { Badge } from '@/components/reui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ProtectedLayout from '@/ctx/protected'
import { formatDateTime } from '@/lib/formatters/dt'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

export default function H() {
  const props: EventItem = {
    id: 'id0',
    slots_limit: 400,
    title: 'Viva Hot Babes',
    venue: 'Wack2',
    event_date: 'Thu Jun 04 2026 05:01:10 GMT+0800 (Philippine Standard Time)',
    divisions: ['Championships'],
    registration_fee: 400
  }
  return (
    <ProtectedLayout>
      <div className='space-y-4'>
        <div className='flex flex-col w-full space-y-2'>
          <div className='flex items-center space-x-1'>
            <Icon name='chevrons-right' className='opacity-60 size-5' />
            <span className='font-medium xl:text-base py-2 opacity-80'>Upcoming Events</span>
          </div>
          <UpcomingEvent {...props} />
        </div>
        <div className='flex items-center justify-between w-full space-x-4'>
          <Card className='w-full'>
            <CardContent className='whitespace-nowrap'>All Tournaments</CardContent>
          </Card>
          <Card className='w-full'>
            <CardContent className='whitespace-nowrap text-center'>My Tickets</CardContent>
          </Card>
          <Card className='w-full'>
            <CardContent className='whitespace-nowrap text-center'>Ranking</CardContent>
          </Card>
          {/*<Card>
            <CardContent>Competitive Ranking</CardContent>
          </Card>
          <Card>
            <CardContent>International Invitations</CardContent>
          </Card>*/}
        </div>
      </div>
    </ProtectedLayout>
  )
}

export interface EventItem {
  id: string
  slots_limit?: number
  title: string
  venue: string
  event_date: string
  divisions: string[]
  registration_fee: number
  description?: string
  gcash_qr_url?: string
  bank_details_text?: string
  commission_type?: string
  commission_value?: number
}

const UpcomingEvent = (t: EventItem) => (
  <Link href={`/tournaments/${t.id}`}>
    <Card className='group hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer h-full p-1'>
      <CardContent className='p-2 xl:p-6 flex flex-col h-full relative font-sans'>
        <Badge variant='secondary' className='text-xs absolute right-2 top-2'>
          {t.slots_limit ? (
            <span className='font-semibold'>
              {t.slots_limit} <span className='font-light'> slots</span>
            </span>
          ) : (
            'Open'
          )}
        </Badge>
        <h3 className='font-heading text-lg md:text-xl font-semibold mb-3'>{t.title}</h3>
        <div className='space-y-2 text-sm text-muted-foreground flex-1'>
          <div className='flex items-center gap-2 text-xs'>
            <Icon name='tag-chevron' className='size-3.5' />
            <span>{t.venue}</span>
          </div>
          <div className='flex items-center gap-2 text-xs'>
            <Icon name='squircle' className='size-3' />
            <span>{t.event_date ? formatDateTime(t.event_date) : ''}</span>
          </div>
          {t.divisions?.length > 0 && (
            <div className='flex items-center gap-2 text-xs'>
              <Icon name='trophy' className='w-3.5 h-3.5' />
              <span>{t.divisions.join(', ')}</span>
            </div>
          )}
        </div>
        <div className='mt-4 pt-4 border-t flex items-center justify-between'>
          <span className='font-semibold text-primary text-lg'>₱{t.registration_fee?.toLocaleString()}</span>
          <div className='flex items-center space-x-1 transition-colors'>
            <span className='text-xs text-muted-foreground'>View Details</span>
            <Icon
              name='arrow-right'
              className='size-4 opacity-80 text-foreground group-hover:text-accent group-hover:opacity-100'
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
)

export interface Affiliate {
  clicks_count?: number
  conversions_count?: number
  total_conversions?: number
  total_earnings?: number
}
