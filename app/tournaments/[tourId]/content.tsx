'use client'

import TourDetail from './details'

interface TourContentProps {
  tourId: string
}
export const TourContent = ({ tourId }: TourContentProps) => {
  return (
    <main>
      <TourDetail tourId={tourId} />
    </main>
  )
}
