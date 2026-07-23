import { Card, CardContent } from '@/components/ui/card'
import { formatRegistrationFee } from '@/utils/formatters'

interface EventHeaderProps {
  eventDateLabel: string
  gateOpenTimeLabel: string
  fee: number
  slotsLabel: string
}

export const EventHeader = ({ eventDateLabel, gateOpenTimeLabel, fee, slotsLabel }: EventHeaderProps) => {
  return (
    <div className='grid gap-0 md:gap-4 grid-cols-4 px-4'>
      {[
        { label: 'Date', value: eventDateLabel },
        { label: 'Gate open', value: gateOpenTimeLabel },
        { label: 'Entry fee', value: formatRegistrationFee(fee) },
        { label: 'Slots', value: slotsLabel }
      ].map((stat) => (
        <Card key={stat.label} size='sm' className='border-[0.33px] py-1! rounded-xs md:rounded-lg'>
          <CardContent className='space-y-1 ps-3! pe-0!'>
            <p className='font-ios text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground'>
              {stat.label}
            </p>
            <p className='font-heading text-base font-bold'>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
