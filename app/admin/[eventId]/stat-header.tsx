import { CardHeader } from '@/components/ui/card'

interface StatHeaderProps {
  counts: {
    total: number
    pending: number
    review: number
    confirmed: number
    cancelled: number
  }
}

export const StatHeader = ({ counts }: StatHeaderProps) => {
  return (
    <CardHeader className='px-2 pt-2 pb-0 md:pb-0 md:pt-0 hidden'>
      <div className='flex flex-col md:gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-1'>
          <p className='text-sm text-muted-foreground sr-only'>
            Entry requests, payment state, and receipt workflow for this event.
          </p>
        </div>

        <div className='grid grid-cols-5 sm:grid-cols-5'>
          {[
            { label: 'Total', value: counts.total },
            { label: 'Pending', value: counts.pending },
            { label: 'Review', value: counts.review },
            { label: 'Confirmed', value: counts.confirmed },
            { label: 'Cancelled', value: counts.cancelled }
          ].map((stat) => (
            <div key={stat.label} className='bg-muted/0 px-1.5 md:px-3 md:py-2 py-1 flex flex-col items-center'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{stat.label}</p>
              <p className='mt-1 font-poly text-lg'>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </CardHeader>
  )
}
