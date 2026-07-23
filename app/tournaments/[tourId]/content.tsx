import { courseDrawing } from '@/public/pinatubo-complete'
import { CourseDrawingExport } from 'foreway/core'
import { CourseMap } from 'foreway/react'
import TourDetail from './details'

interface TourContentProps {
  tourId: string
}

const courseStats = [
  { label: 'HOLES', value: '18', unit: '' },
  { label: 'PAR', value: '72', unit: '' },
  { label: 'START', value: '7AM', unit: '' }
]

export function TourContent({ tourId }: TourContentProps) {
  const drawing = courseDrawing as CourseDrawingExport
  return (
    <main>
      <TourDetail tourId={tourId} />
      <div className='md:flex items-center'>
        <CourseMap className='min-w-0 flex-1' drawing={drawing as CourseDrawingExport} height={520} />
        <div className='grid grid-cols-3 md:grid-cols-1 gap-4'>
          {courseStats.map((stat) => (
            <div key={stat.label} className='pb-4 text-center'>
              <p className='text-sm leading-5 text-[#1d2824]/45'>{stat.label}</p>
              <p className='mt-2 font-poly text-3xl leading-none'>
                {stat.value}
                <span className='ml-1 font-sans text-sm font-medium text-[#1d2824]/65'>{stat.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
