import { courseDrawing } from '@/public/pinatubo-complete'
import type { CourseDrawingExport } from 'foreway/core'
import { CourseMap } from 'foreway/react'

export function GolfCourse() {
  return <CourseMap className='min-w-0 flex-1' drawing={courseDrawing as CourseDrawingExport} height={520} />
}
