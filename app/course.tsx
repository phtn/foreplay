import { Icon } from '@/lib/icons'
import { CourseMap, type CourseDrawingExport } from 'foreway'
import Image from 'next/image'

import course from './pinatubo-complete.json'
const drawing = course as CourseDrawingExport

export function GolfCourse() {
  return <CourseMap drawing={drawing} height={520} />
}

export const Course = () => (
  <div className='relative min-h-97.5 overflow-hidden rounded-[24px] bg-[#edf4ef] shadow-inner'>
    <span className='absolute right-[17%] top-[31%] flex size-11 items-center justify-center rounded-full bg-[#ef4b20] text-white shadow-lg'>
      <Icon name='flag-fill' className='size-5' />
    </span>
    <div className='size-64 aspectaspect-square'>
      <Image src='/course.svg' fill alt='map' className='w-full h-64' />
    </div>
    <span className='absolute bottom-12 left-[48%] flex size-12 items-center justify-center rounded-full bg-white text-base font-semibold text-[#1d2824] shadow-lg'>
      SM
    </span>
  </div>
)
