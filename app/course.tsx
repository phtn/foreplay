import { courseDrawing } from '@/public/pinatubo-complete'
import { CourseMap, type CourseDrawingExport } from 'foreway'

export function GolfCourse() {
  return <CourseMap drawing={courseDrawing as CourseDrawingExport} height={520} />
}
